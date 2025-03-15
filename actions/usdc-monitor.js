/**
 * USDC Monitor Action for Tenderly
 * 
 * This action monitors USDC transfers to a specific wallet address
 * and updates the balance in Supabase when a transfer is detected.
 */

const TARGET_WALLET = "0x2B769d40A46Bde0718f0AB1242c7d5eAe7402e71";
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base

// IMPORTANT: No Supabase client initialization - using fetch API only

/**
 * Extracts the recipient and amount from a USDC transfer transaction
 */
function extractTransferDetails(event) {
  try {
    console.log("Transaction input:", event.input);
    console.log("Transaction logs:", JSON.stringify(event.logs));
    
    // Check if this is an approval transaction or a transfer
    const isApproval = event.input && event.input.startsWith("0x095ea7b3");
    
    if (isApproval) {
      console.log("This is an approval transaction, not a transfer");
      return null;
    }
    
    // For proper transfer detection we'd need to look for the Transfer event in logs
    // or decode the input if it's a direct transfer method call
    
    // This is a simplified example looking for transfer() method signature
    const isTransfer = event.input && (
      event.input.startsWith("0xa9059cbb") || // transfer
      event.input.startsWith("0x23b872dd")    // transferFrom
    );
    
    if (!isTransfer) {
      console.log("Not a transfer method call");
      return null;
    }
    
    // TODO: Implement proper decoding of the transfer method parameters
    // This would require decoding the input data based on the function signature
    
    // For testing, let's use a placeholder value to trigger the balance check
    return {
      recipient: TARGET_WALLET.toLowerCase(),
      amount: 1.0 // placeholder 1 USDC
    };
  } catch (error) {
    console.error("Error extracting transfer details:", error);
    return null;
  }
}

/**
 * Fetches the on-chain USDC balance for a wallet
 */
async function fetchOnChainBalance(walletAddress) {
  try {
    console.log(`Fetching on-chain USDC balance for ${walletAddress}`);
    
    // Use Base RPC to query the USDC balance
    const rpcUrl = "https://mainnet.base.org";
    
    // ERC20 balanceOf method encoded
    const data = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        {
          to: USDC_CONTRACT,
          data: `0x70a08231000000000000000000000000${walletAddress.replace("0x", "")}`
        },
        "latest"
      ]
    };
    
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`RPC error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`RPC returned error: ${result.error.message}`);
    }
    
    if (!result.result) {
      throw new Error("RPC returned empty result");
    }
    
    // Convert hex value to decimal and adjust for USDC's 6 decimals
    const balanceHex = result.result;
    const balanceWei = parseInt(balanceHex, 16);
    const balanceUSDC = balanceWei / 1000000;
    
    console.log(`On-chain USDC balance: ${balanceUSDC}`);
    
    return balanceUSDC;
  } catch (error) {
    console.error("Error fetching on-chain balance:", error);
    return null;
  }
}

/**
 * Updates the wallet balance in Supabase
 */
async function updateBalanceInSupabase(context, walletAddress, amount) {
  try {
    console.log(`Updating balance for wallet ${walletAddress} with amount ${amount}`);
    
    // Get Supabase credentials from secrets
    const supabaseUrl = await context.secrets.get("SUPABASE_URL");
    const supabaseKey = await context.secrets.get("SUPABASE_SERVICE_KEY");
    
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL not found in secrets");
    }
    
    if (!supabaseKey) {
      throw new Error("SUPABASE_SERVICE_KEY not found in secrets");
    }
    
    console.log(`Supabase URL available: ${!!supabaseUrl}, length: ${supabaseUrl.length}`);
    console.log(`Supabase Key available: ${!!supabaseKey}, length: ${supabaseKey.length}`);
    
    // Fetch the actual on-chain balance instead of just adding to the DB value
    const onChainBalance = await fetchOnChainBalance(walletAddress);
    
    if (onChainBalance === null) {
      throw new Error("Failed to fetch on-chain balance");
    }
    
    console.log(`Using on-chain balance: ${onChainBalance} USDC`);
    
    // Simple HTTP request to fetch current database record
    const getResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_balances?wallet_address=eq.${walletAddress}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get current balance: ${getResponse.status} ${getResponse.statusText}`);
    }
    
    const balanceData = await getResponse.json();
    console.log("Current DB balance data:", JSON.stringify(balanceData));
    
    let method, endpoint, body;
    
    // If the wallet already exists, update it
    if (balanceData && balanceData.length > 0) {
      method = 'PATCH';
      endpoint = `${supabaseUrl}/rest/v1/wallet_balances?wallet_address=eq.${walletAddress}`;
      // For PATCH, only include the fields we want to update
      body = {
        usdc_balance: onChainBalance,
        last_updated: new Date().toISOString()
      };
    } else {
      method = 'POST';
      endpoint = `${supabaseUrl}/rest/v1/wallet_balances`;
      // For POST, include all required fields
      body = {
        wallet_address: walletAddress,
        usdc_balance: onChainBalance,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
    }
    
    console.log(`Updating balance to ${onChainBalance} using method ${method}`);
    console.log("Request body:", JSON.stringify(body));
    
    // Update the balance
    const updateResponse = await fetch(endpoint, {
      method: method,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // Check for errors and get response text for better debugging
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`Update failed with status ${updateResponse.status}: ${errorText}`);
      throw new Error(`Failed to update balance: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    const updatedData = await updateResponse.json();
    console.log("Updated balance data:", JSON.stringify(updatedData));
    
    // Verify the update by fetching the record again
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_balances?wallet_address=eq.${walletAddress}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log("Verification data:", JSON.stringify(verifyData));
      
      // Check if the balance was actually updated
      if (verifyData.length > 0 && verifyData[0].usdc_balance === onChainBalance) {
        console.log("Balance update verified!");
      } else {
        console.warn("Balance may not have been updated correctly - verification data doesn't match expected value");
      }
    }
    
    return {
      success: true,
      newBalance: onChainBalance
    };
  } catch (error) {
    console.error("Error updating balance in Supabase:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main function that handles transaction monitoring
 * This is the function that will be called by Tenderly when the trigger condition is met
 */
async function monitorUSDCTransfers(context, event) {
  console.log("============== USDC MONITOR ==============");
  console.log("Event received at:", new Date().toISOString());
  console.log("Event structure:", JSON.stringify(event, null, 2));
  
  // Check if this is a test run without a transaction
  // Tenderly transaction webhook events don't have a nested transaction property
  // but have the transaction fields directly at the root level
  const isTestRun = !event || (!event.hash && !event.to);
  
  if (isTestRun) {
    console.log("This appears to be a test run without transaction data");
    
    // Debug: Log available secrets
    try {
      console.log("Checking secret access...");
      const supabaseUrl = await context.secrets.get("SUPABASE_URL");
      const supabaseKey = await context.secrets.get("SUPABASE_SERVICE_KEY");
      console.log(`Supabase URL available: ${!!supabaseUrl}, length: ${supabaseUrl?.length || 0}`);
      console.log(`Supabase Key available: ${!!supabaseKey}, length: ${supabaseKey?.length || 0}`);
      
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          status: "TEST_SUCCESS", 
          message: "This was a test execution without transaction data. Secrets are accessible.",
          secretsAvailable: {
            supabaseUrl: !!supabaseUrl,
            supabaseKey: !!supabaseKey
          }
        })
      };
    } catch (e) {
      console.error("Error accessing secrets during test:", e);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          status: "TEST_ERROR", 
          message: "Error accessing secrets during test execution",
          error: e.message
        })
      };
    }
  }
  
  console.log("Transaction hash:", event.hash);
  
  try {
    // Debug: Log available secrets
    try {
      console.log("Checking secrets...");
      const supabaseUrl = await context.secrets.get("SUPABASE_URL");
      const supabaseKey = await context.secrets.get("SUPABASE_SERVICE_KEY");
      console.log(`Supabase URL available: ${!!supabaseUrl}, length: ${supabaseUrl?.length || 0}`);
      console.log(`Supabase Key available: ${!!supabaseKey}, length: ${supabaseKey?.length || 0}`);
    } catch (e) {
      console.log("Error checking secrets:", e.message);
    }
    
    // Verify that this is a transaction to the USDC contract
    if (event.to.toLowerCase() !== USDC_CONTRACT.toLowerCase()) {
      console.log("Transaction is not to USDC contract, skipping");
      return { 
        statusCode: 200, 
        body: JSON.stringify({ status: "SKIPPED", reason: "Not a USDC contract transaction" })
      };
    }
    
    // Try to extract transfer details from the transaction
    // But even if we can't, we'll still update the on-chain balance
    const transferDetails = extractTransferDetails(event);
    
    // If not a transfer to our target wallet, skip further processing
    if (!transferDetails || transferDetails.recipient.toLowerCase() !== TARGET_WALLET.toLowerCase()) {
      console.log("Transaction is not a transfer to our target wallet, but updating balance anyway");
      
      // Update the balance in Supabase with the on-chain value
      const updateResult = await updateBalanceInSupabase(context, TARGET_WALLET.toLowerCase(), 0);
      
      if (!updateResult.success) {
        console.error("Failed to update balance:", updateResult.error);
        return { 
          statusCode: 500, 
          body: JSON.stringify({ 
            status: "ERROR", 
            reason: "Failed to update balance", 
            error: updateResult.error 
          })
        };
      }
      
      console.log(`Successfully updated balance to ${updateResult.newBalance} USDC`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: "SUCCESS",
          walletAddress: TARGET_WALLET,
          newBalance: updateResult.newBalance
        })
      };
    }
    
    console.log("Transfer details:", JSON.stringify(transferDetails));
    
    // Update the balance in Supabase
    const updateResult = await updateBalanceInSupabase(context, TARGET_WALLET.toLowerCase(), transferDetails.amount);
    
    if (!updateResult.success) {
      console.error("Failed to update balance:", updateResult.error);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          status: "ERROR", 
          reason: "Failed to update balance", 
          error: updateResult.error 
        })
      };
    }
    
    console.log(`Successfully updated balance to ${updateResult.newBalance} USDC`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        walletAddress: TARGET_WALLET,
        newBalance: updateResult.newBalance
      })
    };
  } catch (error) {
    console.error("Error in USDC monitor:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "ERROR",
        message: error.message,
        stack: error.stack
      })
    };
  }
}

/**
 * Test function to manually update balance for testing purposes
 */
async function testUpdateBalance(context, event) {
  console.log("============== TEST BALANCE UPDATE ==============");
  console.log("Test triggered at:", new Date().toISOString());
  
  try {
    // Extract test parameters
    const testParams = event?.testParams || {};
    const walletAddress = testParams.walletAddress || TARGET_WALLET;
    
    console.log(`Running test update for wallet ${walletAddress}`);
    
    // Update the balance in Supabase using on-chain data
    const updateResult = await updateBalanceInSupabase(context, walletAddress.toLowerCase(), 0);
    
    if (!updateResult.success) {
      console.error("Failed to update balance:", updateResult.error);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          status: "ERROR", 
          reason: "Failed to update balance", 
          error: updateResult.error 
        })
      };
    }
    
    console.log(`Successfully updated balance to ${updateResult.newBalance} USDC`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        walletAddress: walletAddress,
        onChainBalance: updateResult.newBalance
      })
    };
  } catch (error) {
    console.error("Error in test balance update:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "ERROR",
        message: error.message,
        stack: error.stack
      })
    };
  }
}

// Export the functions for Tenderly Actions
module.exports = {
  monitorUSDCTransfers,
  testUpdateBalance
}; 