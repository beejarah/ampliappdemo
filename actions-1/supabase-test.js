/**
 * This is a simple test function to verify Tenderly can communicate with Supabase
 * It will run on a scheduled basis (every hour) to update wallet balance
 */
const { createClient } = require('@supabase/supabase-js');

// Target wallet address (same as in your main action)
const TARGET_WALLET = "0x2B769d40A46Bde0718f0AB1242c7d5eAe7402e71";

/**
 * Simple periodic test function to update Supabase
 */
const testSupabaseConnection = async (context, event) => {
  console.log("=============== SUPABASE CONNECTION TEST ===============");
  console.log("Running test at:", new Date().toISOString());
  
  try {
    // Get credentials from secrets or environment variables
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    
    console.log("Supabase credentials available:", !!SUPABASE_URL && !!SUPABASE_SERVICE_KEY);
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase credentials. Please check environment variables.");
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          status: "ERROR", 
          message: "Missing Supabase credentials" 
        })
      };
    }
    
    // Create Supabase client
    console.log("Creating Supabase client...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Generate a test balance (random between 10-100)
    const testBalance = (10 + Math.random() * 90).toFixed(6);
    console.log(`Test balance to update: ${testBalance}`);
    
    // Prepare timestamp
    const timestamp = new Date().toISOString();
    
    // Attempt to update wallet balance
    console.log(`Updating wallet balance for ${TARGET_WALLET}...`);
    
    // Use upsert to handle both insert and update cases
    const result = await supabase
      .from('wallet_balances')
      .upsert({
        wallet_address: TARGET_WALLET.toLowerCase(),
        usdc_balance: testBalance,
        last_updated: timestamp
      }, {
        onConflict: 'wallet_address'
      });
    
    if (result.error) {
      console.error("Error updating wallet balance:", result.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          status: "ERROR", 
          message: "Failed to update wallet balance",
          error: result.error
        })
      };
    }
    
    console.log("Successfully updated wallet balance in Supabase!");
    
    // Verify the update
    console.log("Verifying update...");
    const { data, error: verifyError } = await supabase
      .from('wallet_balances')
      .select('usdc_balance')
      .eq('wallet_address', TARGET_WALLET.toLowerCase())
      .single();
    
    if (verifyError) {
      console.error("Error verifying update:", verifyError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          status: "ERROR", 
          message: "Failed to verify update",
          error: verifyError
        })
      };
    }
    
    console.log("Verification successful!");
    console.log(`Retrieved balance: ${data.usdc_balance}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        message: "Supabase connection test completed successfully",
        updatedBalance: testBalance,
        retrievedBalance: data.usdc_balance
      })
    };
    
  } catch (error) {
    console.error("Error in test function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: "ERROR", 
        message: error.message || "Unknown error",
        stack: error.stack
      })
    };
  }
};

module.exports = {
  testSupabaseConnection
}; 