-- Direct SQL update to fix the balance value
-- Run this in Supabase SQL Editor

-- First, let's see what's currently in the table
SELECT * FROM wallet_balances;

-- Update the balance directly
UPDATE wallet_balances 
SET 
  usdc_balance = 9.0,
  last_updated = NOW()
WHERE 
  wallet_address = '0x2b769d40a46bde0718f0ab1242c7d5eae7402e71';

-- Verify the change
SELECT * FROM wallet_balances;

-- If that doesn't work, try deleting and re-inserting
-- DELETE FROM wallet_balances 
-- WHERE wallet_address = '0x2b769d40a46bde0718f0ab1242c7d5eae7402e71';

-- INSERT INTO wallet_balances (wallet_address, usdc_balance, last_updated, created_at)
-- VALUES (
--   '0x2b769d40a46bde0718f0ab1242c7d5eae7402e71',
--   9.0,
--   NOW(),
--   NOW()
-- ); 