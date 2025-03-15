/**
 * Inline Supabase test to verify connectivity without external dependencies
 */
async function inlineSupabaseTest(context, event) {
  console.log("============== INLINE SUPABASE TEST ==============");
  console.log("Running Supabase test at:", new Date().toISOString());
  
  try {
    // Get Supabase credentials from secrets
    const supabaseUrl = await context.secrets.get("SUPABASE_URL");
    const supabaseKey = await context.secrets.get("SUPABASE_SERVICE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found in secrets");
    }
    
    console.log(`Supabase URL available: ${!!supabaseUrl}`);
    console.log(`Supabase Key available: ${!!supabaseKey}`);
    
    // Wallet address to query
    const walletAddress = "0x2B769d40A46Bde0718f0AB1242c7d5eAe7402e71";
    
    // Simple HTTP request to fetch balance
    const response = await fetch(`${supabaseUrl}/rest/v1/wallet_balances?wallet_address=eq.${walletAddress}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Wallet balance data:", JSON.stringify(data));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        walletAddress: walletAddress,
        balanceData: data,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error("Error in Supabase test:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "ERROR",
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}

/**
 * Test function to verify secret access only
 */
async function testSecrets(context, event) {
  console.log("============== SECRET ACCESS TEST ==============");
  console.log("Testing secret access at:", new Date().toISOString());
  
  try {
    // Try to access secrets
    const supabaseUrl = await context.secrets.get('SUPABASE_URL');
    const supabaseKey = await context.secrets.get('SUPABASE_SERVICE_KEY');
    
    // Log info without revealing values
    console.log("SUPABASE_URL available:", !!supabaseUrl);
    if (supabaseUrl) {
      console.log("SUPABASE_URL starts with:", supabaseUrl.substring(0, 12) + "...");
    }
    
    console.log("SUPABASE_SERVICE_KEY available:", !!supabaseKey);
    if (supabaseKey) {
      console.log("SUPABASE_SERVICE_KEY length:", supabaseKey.length);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        message: "Secret access test completed",
        secretsAvailable: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey
        }
      })
    };
  } catch (error) {
    console.error("Error accessing secrets:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "ERROR",
        message: error.message || "Unknown error accessing secrets"
      })
    };
  }
}

// Export the functions for Tenderly Actions
module.exports = {
  inlineSupabaseTest,
  testSecrets
}; 