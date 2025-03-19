-- Fix interest calculation issues in Supabase
-- Run this SQL in the Supabase SQL Editor

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS calculate_interest;

-- Create the improved version of the function
CREATE OR REPLACE FUNCTION calculate_interest(
  wallet_address TEXT,
  calculation_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS DECIMAL AS $$
DECLARE
  current_balance DECIMAL;
  current_interest DECIMAL;
  last_update TIMESTAMPTZ;
  withdrawal_time TIMESTAMPTZ;
  time_diff INTERVAL;
  annual_rate DECIMAL = 0.10; -- 10% annual interest rate
  daily_rate DECIMAL;
  days_fraction DECIMAL;
  interest_increment DECIMAL;
  last_balance DECIMAL;
BEGIN
  -- Get the current wallet data
  SELECT 
    wb.usdc_balance, 
    wb.accumulated_interest, 
    wb.last_interest_update,
    wb.last_withdrawal_timestamp
  INTO 
    current_balance, 
    current_interest, 
    last_update,
    withdrawal_time
  FROM 
    wallet_balances wb
  WHERE 
    wb.wallet_address = calculate_interest.wallet_address;

  -- If wallet not found, create it with zero values
  IF NOT FOUND THEN
    INSERT INTO wallet_balances (
      wallet_address, 
      usdc_balance, 
      accumulated_interest, 
      last_interest_update, 
      last_updated
    ) VALUES (
      calculate_interest.wallet_address,
      0,
      0,
      calculation_time,
      calculation_time
    );
    RETURN 0;
  END IF;

  -- CRITICAL: Handle zero balance - zero balance should never accrue interest
  IF current_balance <= 0.0001 THEN
    -- Reset interest to zero if it's not already zero
    IF current_interest > 0 THEN
      UPDATE wallet_balances
      SET 
        accumulated_interest = 0,
        last_interest_update = calculation_time
      WHERE 
        wallet_address = calculate_interest.wallet_address;
    END IF;
    RETURN 0;
  END IF;

  -- Check if we had a withdrawal and a new deposit after
  -- This is critical to prevent interest accruing on money that wasn't in the wallet
  IF withdrawal_time IS NOT NULL AND last_update > withdrawal_time THEN
    -- Check the previous balance before this deposit
    SELECT usdc_balance INTO last_balance
    FROM wallet_balances_history
    WHERE wallet_address = calculate_interest.wallet_address
    AND timestamp < last_update
    ORDER BY timestamp DESC
    LIMIT 1;
    
    -- If last balance was zero/near-zero and current is not, reset interest
    -- This means we're dealing with a fresh deposit after zero balance
    IF (last_balance IS NULL OR last_balance <= 0.0001) AND current_balance > 0.0001 THEN
      UPDATE wallet_balances
      SET 
        accumulated_interest = 0,
        last_interest_update = calculation_time
      WHERE 
        wallet_address = calculate_interest.wallet_address;
      RETURN 0;
    END IF;
  END IF;

  -- Calculate time difference since last update
  time_diff = calculation_time - last_update;
  
  -- Skip interest calculation if the time difference is too small
  -- (less than 1 second to prevent excessive updates)
  IF EXTRACT(EPOCH FROM time_diff) < 1 THEN
    RETURN current_interest;
  END IF;
  
  -- Calculate the daily interest rate
  daily_rate = annual_rate / 365.0;
  
  -- Calculate fraction of a day that has passed
  days_fraction = EXTRACT(EPOCH FROM time_diff) / (24 * 60 * 60);
  
  -- Calculate interest increment
  interest_increment = current_balance * daily_rate * days_fraction;
  
  -- Add interest increment to current interest
  current_interest = current_interest + interest_increment;
  
  -- Update wallet with new interest and timestamp
  UPDATE wallet_balances
  SET 
    accumulated_interest = current_interest,
    last_interest_update = calculation_time
  WHERE 
    wallet_address = calculate_interest.wallet_address;
  
  RETURN current_interest;
END;
$$ LANGUAGE plpgsql;

-- Create a table to track wallet balance history if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_balances_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  usdc_balance DECIMAL(36, 18) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index for faster lookups by wallet address and timestamp
CREATE INDEX IF NOT EXISTS idx_wallet_balances_history_address_time 
ON wallet_balances_history (wallet_address, timestamp DESC);

-- Create a trigger to record balance history on changes
CREATE OR REPLACE FUNCTION record_balance_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record history when balance changes
  IF OLD.usdc_balance IS DISTINCT FROM NEW.usdc_balance THEN
    INSERT INTO wallet_balances_history (
      wallet_address,
      usdc_balance,
      timestamp
    ) VALUES (
      NEW.wallet_address,
      NEW.usdc_balance,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'record_balance_history_trigger'
  ) THEN
    CREATE TRIGGER record_balance_history_trigger
    AFTER UPDATE ON wallet_balances
    FOR EACH ROW
    EXECUTE FUNCTION record_balance_history();
  END IF;
END $$; 