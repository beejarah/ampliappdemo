# Tenderly Setup and Usage Guide

This document provides comprehensive instructions for the Tenderly Web3 Actions setup and integration in your Ampli project.

## File and Directory Structure

Here's a complete map of all files and directories related to the Tenderly setup:

### Main Directories
- **Project Root**: `C:\Users\bjmak\Ampli\ampliappdemo`
- **Tenderly CLI Location**: `C:\Users\bjmak\Ampli\Tenderly\tenderly.exe`
- **Actions Directory**: `C:\Users\bjmak\Ampli\ampliappdemo\actions`
- **Alternative Actions Directory**: `C:\Users\bjmak\Ampli\ampliappdemo\tenderly-actions`

### Configuration Files
- **Tenderly Configuration**: `C:\Users\bjmak\Ampli\ampliappdemo\tenderly.yaml`
- **Tenderly Setup Documentation**: `C:\Users\bjmak\Ampli\ampliappdemo\TENDERLY_SETUP.md` (this file)
- **Tenderly Deployment Guide**: `C:\Users\bjmak\Ampli\ampliappdemo\TENDERLY_ACTIONS_DEPLOYMENT.md`
- **Tenderly Secrets Setup**: `C:\Users\bjmak\Ampli\ampliappdemo\TENDERLY_SECRETS_SETUP.md`
- **PowerShell Scripts**:
  - `C:\Users\bjmak\Ampli\ampliappdemo\setup-tenderly.ps1`
  - `C:\Users\bjmak\Ampli\ampliappdemo\update-tenderly-yaml.ps1`
  - `C:\Users\bjmak\Ampli\ampliappdemo\create-tenderly-yaml.ps1`

### Application Files
- **Main App with Tenderly Integration**: `C:\Users\bjmak\Ampli\ampliappdemo\app\(tabs)\index.tsx`
- **USDC Balance Service**: `C:\Users\bjmak\Ampli\ampliappdemo\utils\usdcBalanceService.js`

### Action Source Files
- **Balance Withdrawal Action**: `C:\Users\bjmak\Ampli\ampliappdemo\actions\balance-withdrawal.js`
- **Interest Withdrawal Action**: `C:\Users\bjmak\Ampli\ampliappdemo\actions\interest-withdrawal.js`
- **USDC Monitor**: `C:\Users\bjmak\Ampli\ampliappdemo\actions\usdc-monitor.js`
- **Check Secrets Action**: `C:\Users\bjmak\Ampli\ampliappdemo\actions\check-secrets.js`

### Dependencies
- **Actions package.json**: `C:\Users\bjmak\Ampli\ampliappdemo\actions\package.json`
- **Actions Dependencies**: 
  ```
  C:\Users\bjmak\Ampli\ampliappdemo\actions\node_modules\
  ```

### Action Dependencies
The Tenderly actions use the following dependencies defined in `actions/package.json`:
```json
{
  "dependencies": {
    "@tenderly/actions": "^0.2.0",
    "ethers": "^5.7.2",
    "node-fetch": "^2.6.7"
  },
  "devDependencies": {
    "typescript": "^4.3.5"
  }
}
```

When adding new actions or modifying existing ones, make sure to install these dependencies in the actions directory:
```powershell
cd actions
npm install
```

### Tenderly Account Details
- **Account Name**: `thebeej`
- **Project Name**: `project`
- **Dashboard URL**: `https://dashboard.tenderly.co/thebeej/project`

### Environment Variables and Secrets
Environment variables are managed through the Tenderly Dashboard and are used by the actions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `TARGET_PRIVATE_KEY` - Private key for balance withdrawals (WITHOUT 0x prefix)
- `INTEREST_PRIVATE_KEY` - Private key for interest withdrawals (WITHOUT 0x prefix)

## Installation Status

Tenderly CLI has been successfully installed and added to your PATH. The CLI is located at:
```
C:\Users\bjmak\Ampli\Tenderly\tenderly.exe
```

Current CLI version: v1.6.5

## Deployed Actions

The following Tenderly Web3 Actions have been successfully deployed:

### Balance Withdrawal Action
- **Action ID**: `dda57d54-33b6-4f05-bcb1-cb23508668dd`
- **Purpose**: Withdraws USDC balance from the target wallet
- **Trigger**: Webhook (can be called on-demand from the app)
- **Function**: Named `actionFn` in action file
- **Dashboard URL**: https://dashboard.tenderly.co/thebeej/project/action/dda57d54-33b6-4f05-bcb1-cb23508668dd
- **Execution Type**: Sequential

### Interest Withdrawal Action
- **Action ID**: `d434bd21-f36a-4e70-ae68-d211ac1078aa`
- **Purpose**: Withdraws accumulated interest from the interest wallet
- **Trigger**: Webhook (can be called on-demand from the app)
- **Function**: Named `actionFn` in action file
- **Dashboard URL**: https://dashboard.tenderly.co/thebeej/project/action/d434bd21-f36a-4e70-ae68-d211ac1078aa
- **Execution Type**: Sequential

## Project Configuration

- **Account ID**: `thebeej`
- **Project Slug**: `thebeej/project`
- **API Base URL**: `https://api.tenderly.co/api/v1/actions`
- **API Key**: `xdq0bEB5o3hhdyI70Akm1sTXCqYOuwli`

## Integration in the App

The Actions are integrated in the app using the Tenderly webhook format with the following configuration:

```typescript
// From app/(tabs)/index.tsx
const TENDERLY_ACCOUNT = 'thebeej';
const TENDERLY_PROJECT = 'project';
const TENDERLY_API_KEY = 'xdq0bEB5o3hhdyI70Akm1sTXCqYOuwli';

// Updated webhook action IDs
const BALANCE_ACTION_ID = 'dda57d54-33b6-4f05-bcb1-cb23508668dd';
const INTEREST_ACTION_ID = 'd434bd21-f36a-4e70-ae68-d211ac1078aa';

// Using Tenderly webhook URLs for actions - confirmed working format
const BALANCE_WEBHOOK_URL = `https://api.tenderly.co/api/v1/actions/${BALANCE_ACTION_ID}/webhook`;
const INTEREST_WEBHOOK_URL = `https://api.tenderly.co/api/v1/actions/${INTEREST_ACTION_ID}/webhook`;
```

API calls are made using the following pattern:
```typescript
// For balance withdrawal
const balanceResponse = await fetch(BALANCE_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Access-Key': TENDERLY_API_KEY,
    'Authorization': `Bearer ${TENDERLY_API_KEY}`,
  },
  body: JSON.stringify({
    sourceWallet: TARGET_WALLET,
    destinationWallet: ORIGIN_WALLET,
    amount: 'all', // Withdraw all funds
    type: 'balance',
    timestamp: new Date().toISOString()
  }),
});
```

## Important Lessons Learned About Tenderly Actions

### 1. Correct Function Format is Critical

For Tenderly Web3 Actions to work properly, the function in your action file MUST follow this specific format:

```javascript
// Do not change function name.
const actionFn = async (context, webhookEvent) => {
    // Your code here
};

// Do not change this.
module.exports = { actionFn };
```

Important notes:
- The function MUST be named `actionFn`
- The export MUST be `module.exports = { actionFn }`
- Comments indicating not to change these names help prevent future issues

### 2. Base Chain Configuration

When working with Base blockchain, you MUST explicitly specify the chainId in the provider:

```javascript
// Incorrect (will fail silently)
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');

// Correct (explicitly specifies chain ID)
const provider = new ethers.providers.JsonRpcProvider(
  'https://mainnet.base.org',
  { name: 'base', chainId: 8453 }
);
```

### 3. Handling Dependencies

Tenderly Web3 Actions run in a limited environment that doesn't include all Node.js modules. For optional dependencies like `node-fetch`, use this pattern:

```javascript
// Make dependencies optional with graceful fallback
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  console.warn('node-fetch module not available, Supabase integration will be disabled');
}

// Then check before using
if (fetch && supabaseUrl && supabaseServiceKey) {
  // Supabase operations here
}
```

### 4. Private Key Format

Private keys in Tenderly secrets MUST:
- NOT include the `0x` prefix
- Be exactly 64 hexadecimal characters

### 5. Example of Working Action Function

Here's a complete example of a working Tenderly Web3 Action for Base chain:

```javascript
// Do not change function name.
const actionFn = async (context, webhookEvent) => {
    console.log("Balance Withdrawal Action Triggered:", JSON.stringify(webhookEvent));
    
    // Wallet addresses
    const TARGET_WALLET = "0x20b7bd444aBBDc4B27e399Ad6440c1801e1413cF"; // Source wallet
    const ORIGIN_WALLET = "0x97AE9243Fa9E0D1DABed05d42D02edAF62a6C21A"; // Destination wallet
    const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
    
    // USDC Contract ABI (only the methods we need)
    const USDC_ABI = [
        // transfer
        {
            constant: false,
            inputs: [
                { name: '_to', type: 'address' },
                { name: '_value', type: 'uint256' }
            ],
            name: 'transfer',
            outputs: [{ name: '', type: 'bool' }],
            type: 'function'
        },
        // balanceOf
        {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function'
        },
        // decimals
        {
            constant: true,
            inputs: [],
            name: 'decimals',
            outputs: [{ name: '', type: 'uint8' }],
            type: 'function'
        }
    ];
    
    const ethers = require('ethers');
    let fetch;
    try {
        fetch = require('node-fetch');
    } catch (error) {
        console.warn('node-fetch module not available, Supabase integration will be disabled');
    }
    
    try {
        // Get the private key from secrets
        const targetPrivateKey = await context.secrets.get('TARGET_PRIVATE_KEY');
        if (!targetPrivateKey) {
            console.error("TARGET_PRIVATE_KEY secret not found or empty");
            return {
                success: false,
                error: "Private key not found in secrets"
            };
        }
        console.log("Successfully retrieved TARGET_PRIVATE_KEY from secrets");
        
        // Try to get Supabase credentials (optional)
        let supabaseUrl = null;
        let supabaseServiceKey = null;
        try {
            supabaseUrl = await context.secrets.get('SUPABASE_URL');
            supabaseServiceKey = await context.secrets.get('SUPABASE_SERVICE_KEY');
            if (supabaseUrl && supabaseServiceKey) {
                console.log("Successfully retrieved Supabase credentials from secrets");
            }
        } catch (error) {
            console.log("Supabase credentials not found (optional, continuing)");
        }
        
        // Determine if this is a webhook event or direct execution
        if (webhookEvent.request && webhookEvent.request.method === 'POST') {
            // This is a webhook request
            console.log("Processing balance withdrawal webhook request");
            
            // Parse the payload
            const payload = webhookEvent.request.body;
            console.log("Webhook payload:", JSON.stringify(payload));
            
            // Extract details from payload
            const sourceWallet = payload.sourceWallet || TARGET_WALLET;
            const destinationWallet = payload.destinationWallet || ORIGIN_WALLET;
            const amount = payload.amount;
            const type = payload.type;
            
            // Validate payload
            if (!sourceWallet || !destinationWallet || !amount || type !== 'balance') {
                console.error("Invalid payload for balance withdrawal");
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        error: "Invalid payload for balance withdrawal"
                    })
                };
            }
            
            // Create provider for Base network with explicit chainId
            const provider = new ethers.providers.JsonRpcProvider(
                'https://mainnet.base.org',
                { name: 'base', chainId: 8453 }
            );
            
            // Get current balance
            const usdcContract = new ethers.Contract(USDC_CONTRACT, USDC_ABI, provider);
            const decimals = await usdcContract.decimals();
            const balanceWei = await usdcContract.balanceOf(sourceWallet);
            const currentBalance = parseFloat(ethers.utils.formatUnits(balanceWei, decimals));
            console.log(`Current balance for ${sourceWallet}: ${currentBalance} USDC`);
            
            // Determine withdrawal amount
            let withdrawAmount = amount;
            if (amount === 'all') {
                withdrawAmount = currentBalance;
                console.log(`Withdrawing full balance: ${withdrawAmount} USDC`);
            } else {
                withdrawAmount = parseFloat(amount);
                console.log(`Withdrawing specified amount: ${withdrawAmount} USDC`);
            }
            
            // Check if balance is sufficient
            if (currentBalance < withdrawAmount) {
                console.error(`Insufficient balance: ${currentBalance} USDC (requested: ${withdrawAmount} USDC)`);
                return {
                    statusCode: 400,
        body: JSON.stringify({
                        success: false,
                        error: `Insufficient balance: ${currentBalance} USDC (requested: ${withdrawAmount} USDC)`
                    })
                };
            }
            
            // Execute the withdrawal
            const wallet = new ethers.Wallet(targetPrivateKey, provider);
            const contractWithSigner = new ethers.Contract(USDC_CONTRACT, USDC_ABI, wallet);
            
            // Convert amount to wei
            const amountWei = ethers.utils.parseUnits(withdrawAmount.toString(), decimals);
            
            console.log(`Executing transfer of ${withdrawAmount} USDC from ${sourceWallet} to ${destinationWallet}`);
            
            // Send the transaction
            const tx = await contractWithSigner.transfer(destinationWallet, amountWei, {
                gasLimit: 200000
            });
            
            console.log(`Transaction sent: ${tx.hash}`);
            
            // Wait for transaction to be mined
            const receipt = await tx.wait();
            console.log(`Transaction confirmed: ${receipt.transactionHash}`);
            console.log(`Gas used: ${receipt.gasUsed.toString()}`);
            
            // Return success response
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    transactionHash: receipt.transactionHash,
                    amount: withdrawAmount,
                    sourceWallet: sourceWallet,
                    destinationWallet: destinationWallet,
                    gasUsed: receipt.gasUsed.toString()
                })
            };
        } else {
            // Handle direct execution
            // ... similar code for direct execution ...
        }
    } catch (error) {
        console.error("Error processing balance withdrawal:", error);
        return {
            success: false,
            error: error.message
        };
    }
}
// Do not change this.
module.exports = { actionFn };
```

### 6. Troubleshooting Common Errors

#### Function Not Found Error
If you get "FunctionNotFoundInSource" error:
- Make sure your function is named `actionFn`
- Make sure it's exported as `module.exports = { actionFn }`
- Include the comment markers to help you remember not to change these

#### Module Not Found Error
If you get "Cannot find module 'node-fetch'":
- Make the dependency optional using try/catch
- Add checks before using the module
- Consider using built-in modules where possible

#### Transaction Execution Issues
If transactions don't execute despite 200 OK responses:
- Verify private keys in Tenderly Secrets (no 0x prefix)
- Check wallet balances for gas fees
- Include explicit chainId in the provider configuration
- Increase gas limit for transactions
- Check Tenderly Dashboard logs for detailed errors

## Important Tenderly.yaml Configuration

For the webhook URLs to work properly, your actions must be configured with a webhook trigger type in the `tenderly.yaml` file:

```yaml
actions:
  balance-webhook:
    description: Withdraws the balance from the smart contract wallet
    function: actions/balance-withdrawal.js:actionFn  # Note the function name must match
    trigger:
      type: webhook
      webhook:
        authenticated: true
    execution_type: sequential
  interest-webhook:
    description: Withdraws the interest from the smart contract wallet
    function: actions/interest-withdrawal.js:actionFn  # Note the function name must match
    trigger:
      type: webhook
      webhook:
        authenticated: true
    execution_type: sequential
```

## Deployment Process

The action deployment process faced an issue where deploying all actions at once would hang. The solution was to deploy actions incrementally:

1. First deploy only the balance-withdrawal action:
```bash
tenderly actions deploy
```

2. Then add and deploy the interest-withdrawal action:
```bash
tenderly actions deploy
```

Both actions are now successfully deployed and running on a periodic schedule.

## Common Tenderly CLI Commands

Here are the most commonly used Tenderly CLI commands for this project:

### Authentication
```powershell
# Login to Tenderly
tenderly login

# Check current version
tenderly version

# Check current user info
tenderly whoami
```

### Actions Management
```powershell
# Deploy actions (from project root with tenderly.yaml)
tenderly actions deploy

# List all deployed actions
tenderly actions list

# Get URLs for actions
tenderly actions urls

# Get logs for a specific action
tenderly actions logs --action-id 52cf343d-800c-454d-8b9f-daba1a25c9e3

# Run a specific action locally for testing
tenderly actions run --function src/balance-withdrawal.ts:main
```

### Secrets Management
```powershell
# Set a secret
tenderly actions secrets set SECRET_NAME="secret_value"

# List all secrets (names only, not values)
tenderly actions secrets list
```

### Project Management
```powershell
# List all projects
tenderly projects list

# Initialize a new actions project from template
tenderly actions init --template onboarding
```

## Testing the Withdrawal Functionality

To test the withdrawal functionality:

1. Start the app:
   ```powershell
   npx expo start --clear
   ```

2. In your browser, navigate to http://localhost:8081 (or the URL provided in the terminal)

3. Click on the "Withdraw All" button to initiate both withdrawals (balance and interest)

4. Confirm the withdrawal in the popup dialog

5. Observe the API calls in the console logs - you should see logs showing the webhook URLs being called and the response status

### Troubleshooting Withdrawal Issues

If you encounter issues with the withdrawals:

1. **Check Console Logs**: Examine the detailed logs in the browser console to see the API call details, headers, and response texts.

2. **Verify Webhook URLs**: Ensure the webhook URLs are formatted correctly:
   ```
   https://api.tenderly.co/api/v1/actions/{action_id}/webhook
   ```

3. **Verify Payloads**: Check that the payloads contain the correct wallet addresses:
   - `sourceWallet`: The wallet containing the funds (TARGET_WALLET or INTEREST_WALLET)
   - `destinationWallet`: The wallet to receive the funds (ORIGIN_WALLET)
   - `amount`: Set to "all" to withdraw all funds
   - `type`: Should be "balance" or "interest" depending on the action

4. **API Key**: Verify your Tenderly API key is valid and has permissions to execute actions

5. **Action Status**: Check in the Tenderly dashboard that your actions are deployed and running

### Testing with Different Action Triggers

Actions can be triggered in several ways:

1. **Direct webhook call**: The approach used in the app
2. **Periodic execution**: Actions are set to run hourly via cron (0 * * * *)
3. **Manual execution**: You can manually trigger actions from the Tenderly dashboard
4. **Local testing**: Use the CLI to test actions locally:
   ```powershell
   tenderly actions run --function balance-withdrawal:balanceWithdrawalWebhook
   tenderly actions run --function interest-withdrawal:interestWithdrawalWebhook
   ```

## Testing in Production Mode

To properly test in production mode:

1. Build a production version of the app:
   ```powershell
   npx expo export --platform web
   ```

2. Serve the production build locally:
   ```powershell
   npx serve web-build
   ```

3. This will run the app in production mode, using the actual Tenderly API

## PowerShell Command Issues

Note that in PowerShell, the `&&` operator is not supported for command chaining. Instead, use the semicolon `;` as a command separator:

```powershell
cd .. ; cd .\ampliappdemo\ ; npx expo start --clear
```

## Troubleshooting

### Action Deployment Hanging
If action deployment hangs, try:
- Deploying actions one by one
- Checking the Tenderly Dashboard to see if actions were actually deployed
- Making sure dependencies are installed in the actions directory

### API Integration Issues
- Verify the API key is correct and has proper permissions
- Ensure the action IDs match the deployed actions
- Check for proper error handling in the API response processing

### PowerShell Issues
- Use `;` instead of `&&` for command chaining
- Ensure all paths are properly escaped with backticks when necessary

## Workflow for Making Changes

Follow this workflow when you need to make changes to the Tenderly actions:

### 1. Modifying Action Code

1. Navigate to the actions directory:
   ```powershell
   cd C:\Users\bjmak\Ampli\ampliappdemo\actions
   ```

2. Edit the JavaScript action files:
   - `balance-withdrawal.js` for balance withdrawal logic
   - `interest-withdrawal.js` for interest withdrawal logic

3. If new dependencies are needed, install them:
   ```powershell
   npm install --save new-dependency-name
   ```

### 2. Testing Actions Locally

1. Run a specific action locally to test:
   ```powershell
   tenderly actions run --function balance-withdrawal.js:actionFn
   ```

2. Check the output for any errors or issues

### 3. Updating Configuration

1. If needed, edit the `tenderly.yaml` file to update action configuration:
   ```powershell
   code C:\Users\bjmak\Ampli\ampliappdemo\tenderly.yaml
   ```

2. Make sure the file references the correct function paths and trigger settings

### 4. Deploying Updates

1. Deploy changes incrementally to avoid the hanging issue:
   ```powershell
   tenderly actions deploy
   ```

2. If deployment hangs, modify the `tenderly.yaml` file to include only one action at a time

### 5. Updating App Integration

1. If action IDs have changed, update them in the app code:
   ```powershell
   code C:\Users\bjmak\Ampli\ampliappdemo\app\(tabs)\index.tsx
   ```

2. Update the constants at the top of the file:
   ```typescript
   const BALANCE_ACTION_ID = 'new-id-from-step-3';
   const INTEREST_ACTION_ID = 'new-id-from-step-3';
   ```

3. Test the integration by running the app and using the "Withdraw All" button

## Additional Resources

- [Tenderly Web3 Actions Documentation](https://docs.tenderly.co/web3-actions/intro-to-web3-actions)
- [Tenderly CLI Reference](https://docs.tenderly.co/tenderly-cli/commands)
- [API Reference for Actions](https://docs.tenderly.co/reference/web3-actions-api)
- [Tenderly Dashboard](https://dashboard.tenderly.co/)

### Troubleshooting Webhook Calls

If you encounter issues with Tenderly webhook calls, here are some common problems and solutions:

1. **404 Error (Not Found)**: 
   - Incorrect URL format. Ensure you're using the exact format `https://api.tenderly.co/api/v1/actions/{action_id}/webhook`.
   - Invalid action ID. Verify the action ID exists in your Tenderly dashboard.

2. **403 Error (Forbidden)**: 
   - Authentication issue. Ensure you're providing the correct API key in both `X-Access-Key` header and `Authorization: Bearer {api_key}` header.
   - Action not configured for webhooks. Make sure the action has a webhook trigger type in your `tenderly.yaml` file and has been redeployed.
   - The webhook may have `authenticated: true` in the configuration but you're missing the correct authentication headers.

3. **Request Payload Issues**:
   - For webhook-triggered actions, send the payload directly without wrapping it in an `input` object.
   - Ensure your payload includes all the required fields expected by your action function.

4. **Debugging Tips**:
   - Always log the request URL, headers, and payload to help diagnose issues.
   - Check the response status, headers, and body for error messages.
   - Verify the action logs in the Tenderly dashboard to see if the action is being triggered.
   - Use the test script (`test-tenderly-api.js`) to isolate and test different API approaches.

Remember to redeploy your actions using `tenderly actions deploy` after any configuration changes in the `tenderly.yaml` file.

## Function Structure Requirements (Critical)

The function naming and structure is **extremely important** for Tenderly Web3 Actions to work:

1. **Exactly as shown below** - the function must be named `actionFn` and exported exactly as shown:

```javascript
// Do not change function name.
const actionFn = async (context, webhookEvent) => {
    // Your implementation here
};

// Do not change this.
module.exports = { actionFn };
```

2. **Function format errors** are the most common issues:
   - `"FunctionNotFoundInSource"` error means the function name doesn't match what Tenderly expects
   - Any variation in the export pattern can cause deployment issues
   - Comments like `// Do not change function name.` help prevent mistakes

3. **Always check the dashboard** after deployment to ensure your function was successfully deployed with the correct function name and trigger type.

## Real-World Working Examples

We've successfully deployed and tested these action patterns. Use them as templates for future actions:

1. **Balance Withdrawal Action**: Successfully withdraws USDC from a wallet
2. **Interest Withdrawal Action**: Successfully withdraws interest from a secondary wallet