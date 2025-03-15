-- Fix RLS Issues in Supabase
-- Run these commands in the Supabase SQL Editor

-- 1. Enable RLS on both tables
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usdc_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create permissive policies for the service role (used by Tenderly)
CREATE POLICY "Allow service role full access to wallet_balances" 
ON public.wallet_balances
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Allow service role full access to usdc_transactions"
ON public.usdc_transactions
FOR ALL
TO service_role
USING (true);

-- 3. Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read wallet_balances"
ON public.wallet_balances
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to read usdc_transactions"
ON public.usdc_transactions
FOR SELECT
TO authenticated
USING (true);

-- 4. Create policies for anonymous users (if needed)
CREATE POLICY "Allow anon users to read wallet_balances"
ON public.wallet_balances
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon users to read usdc_transactions"
ON public.usdc_transactions
FOR SELECT
TO anon
USING (true);

-- Alternative: Bypass RLS for service role (if above doesn't work)
-- This is less secure but sometimes necessary
-- Uncomment if needed
-- ALTER ROLE service_role BYPASSRLS; 