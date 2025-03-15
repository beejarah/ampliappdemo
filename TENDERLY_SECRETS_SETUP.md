# Setting Up Secrets in Tenderly Dashboard

We need to set up two secrets in the Tenderly dashboard for our USDC monitor action to work correctly:

1. `SUPABASE_URL`
2. `SUPABASE_SERVICE_KEY`

## Steps to Set Up Secrets

1. Go to the [Tenderly Dashboard](https://dashboard.tenderly.co/)
2. Navigate to your project (`thebeej/project`)
3. Click on "Web3 Actions" in the left sidebar
4. Click on "Secrets" in the Web3 Actions section
5. Add the following secrets:

### Secret 1: SUPABASE_URL
- Name: `SUPABASE_URL`
- Value: `https://ktytrhvkxxnggvxfzdfe.supabase.co`

### Secret 2: SUPABASE_SERVICE_KEY
- Name: `SUPABASE_SERVICE_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eXRyaHZreHhuZ2d2eGZ6ZGZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkzNDY4OSwiZXhwIjoyMDU3NTEwNjg5fQ.ukA_fadBYb78cVMESTNDhZgF1hwf4Fu-yBw056c1WIk`

## Verification

Once you've set up the secrets, you can verify they are working correctly by checking the logs of the `check-secrets` action. This action runs every 5 minutes and will show if it can access the secrets.

1. Go to the [Tenderly Dashboard](https://dashboard.tenderly.co/)
2. Navigate to your project
3. Click on "Web3 Actions" in the left sidebar
4. Find the "check-secrets" action in the list
5. Click on it to view its details
6. Check the "Executions" tab to see recent runs and their logs

The logs should show both secrets as available with their lengths displayed. 