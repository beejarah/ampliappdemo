/**
 * USDC Monitor Action for Tenderly
 * 
 * This action monitors USDC transfers to a specific wallet address
 * and updates the balance in Supabase when a transfer is detected.
 */

const TARGET_WALLET = "0x2B769d40A46Bde0718f0AB1242c7d5eAe7402e71";
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base

/**
 * Extracts the recipient and amount from a USDC transfer transaction
 */
function extractTransferDetails(transaction) {
  try {
    // Get the decoded input data
    const inputData = transaction.transaction.input_data;
    
    if (!inputData || !inputData.decoded || !inputData.decoded.params) {
      console.log("No decoded input data found");
      return null;
    }
    
    // Extract recipient (to) and amount from the transfer method parameters
    const params = inputData.decoded.params;
    const recipient = params.find(p => p.name === "_to" || p.name === "to" || p.name === "recipient" || p.name === "0")?.value;
    const amount = params.find(p => p.name === "_value" || p.name === "value" || p.name === "amount" || p.name === "1")?.value;
    
    if (!recipient || !amount) {
      console.log("Could not find recipient or amount in transaction parameters");
      return null;
    }
    
    // For USDC, we need to adjust the decimals (USDC has 6 decimals on Base)
    const amountInUSDC = parseFloat(amount) / 1000000;
    
    return {
      recipient: recipient.toLowerCase(),
      amount: amountInUSDC
    };
  } catch (error) {
    console.error("Error extracting transfer details:", error);
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
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found in secrets");
    }
    
    console.log(`Supabase URL available: ${!!supabaseUrl}`);
    console.log(`Supabase Key available: ${!!supabaseKey}`);
    
    // Simple HTTP request to fetch current balance
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
    console.log("Current balance data:", JSON.stringify(balanceData));
    
    let newBalance = amount;
    let method = 'POST';
    let endpoint = `${supabaseUrl}/rest/v1/wallet_balances`;
    
    // If the wallet already exists, update it instead of creating a new record
    if (balanceData && balanceData.length > 0) {
      newBalance = parseFloat(balanceData[0].usdc_balance || 0) + amount;
      method = 'PATCH';
      endpoint = `${supabaseUrl}/rest/v1/wallet_balances?wallet_address=eq.${walletAddress}`;
    }
    
    console.log(`Updating balance to ${newBalance} using method ${method}`);
    
    // Update the balance
    const updateResponse = await fetch(endpoint, {
      method: method,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
        usdc_balance: newBalance,
        updated_at: new Date().toISOString()
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update balance: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    const updatedData = await updateResponse.json();
    console.log("Updated balance data:", JSON.stringify(updatedData));
    
    return {
      success: true,
      newBalance
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
 */
async function monitorUSDCTransfers(context, event) {
  console.log("============== USDC MONITOR ==============");
  console.log("Event received at:", new Date().toISOString());
  console.log("Transaction hash:", event.transaction.hash);
  
  try {
    // Verify that this is a transaction to the USDC contract
    if (event.transaction.to.toLowerCase() !== USDC_CONTRACT.toLowerCase()) {
      console.log("Transaction is not to USDC contract, skipping");
      return { 
        statusCode: 200, 
        body: JSON.stringify({ status: "SKIPPED", reason: "Not a USDC contract transaction" })
      };
    }
    
    // Extract transfer details
    const transferDetails = extractTransferDetails(event);
    
    if (!transferDetails) {
      console.log("Could not extract transfer details, skipping");
      return { 
        statusCode: 200, 
        body: JSON.stringify({ status: "SKIPPED", reason: "Could not extract transfer details" })
      };
    }
    
    console.log("Transfer details:", JSON.stringify(transferDetails));
    
    // Check if the recipient is our target wallet
    if (transferDetails.recipient.toLowerCase() !== TARGET_WALLET.toLowerCase()) {
      console.log("Transfer is not to target wallet, skipping");
      return { 
        statusCode: 200, 
        body: JSON.stringify({ status: "SKIPPED", reason: "Not to target wallet" })
      };
    }
    
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
        amountReceived: transferDetails.amount,
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

// Export the function for Tenderly Actions
module.exports = {
  monitorUSDCTransfers
}; 