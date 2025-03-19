-- Enable realtime for our tables
ALTER PUBLICATION supabase_realtime ADD TABLE wallet_balances;
ALTER PUBLICATION supabase_realtime ADD TABLE usdc_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE wallet_withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE interest_balances;

-- Create a table to track wallet balances
CREATE TABLE IF NOT EXISTS wallet_balances (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  usdc_balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index for faster lookups by wallet address
CREATE INDEX IF NOT EXISTS idx_wallet_balances_address ON wallet_balances (wallet_address);

-- Create a table to track USDC transactions
CREATE TABLE IF NOT EXISTS usdc_transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  block_number BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  tenderly_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_usdc_transactions_addresses 
  ON usdc_transactions (from_address, to_address);
CREATE INDEX IF NOT EXISTS idx_usdc_transactions_hash 
  ON usdc_transactions (tx_hash);

-- Create a table to track wallet withdrawals
CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  withdrawal_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index for faster lookups of wallet withdrawals
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_address ON wallet_withdrawals (wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_time ON wallet_withdrawals (withdrawal_time DESC);

-- Create a table to track interest balances
CREATE TABLE IF NOT EXISTS interest_balances (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  interest_amount DECIMAL(36, 18) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index for faster lookups by wallet address for interest
CREATE INDEX IF NOT EXISTS idx_interest_balances_address ON interest_balances (wallet_address);

-- Function that automatically updates last_updated in wallet_balances
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_updated timestamp when balance changes
CREATE TRIGGER update_wallet_balances_updated
BEFORE UPDATE ON wallet_balances
FOR EACH ROW
WHEN (OLD.usdc_balance IS DISTINCT FROM NEW.usdc_balance)
EXECUTE FUNCTION update_last_updated();

-- Trigger to update last_updated timestamp when interest changes
CREATE TRIGGER update_interest_balances_updated
BEFORE UPDATE ON interest_balances
FOR EACH ROW
WHEN (OLD.interest_amount IS DISTINCT FROM NEW.interest_amount)
EXECUTE FUNCTION update_last_updated(); 