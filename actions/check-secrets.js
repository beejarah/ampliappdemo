/**
 * Check Secrets Script for Tenderly
 * 
 * This script checks if the Tenderly action can access the required secrets
 * for Supabase integration.
 */

/**
 * Main function that checks access to secrets
 */
async function checkSecrets(context, event) {
  console.log("============== CHECKING SECRETS ==============");
  console.log("Check triggered at:", new Date().toISOString());
  
  try {
    // Try to list all available secrets
    let allSecrets = [];
    try {
      allSecrets = await context.secrets.list();
      console.log("Available secrets:", allSecrets);
    } catch (e) {
      console.log("Error listing secrets:", e.message);
    }
    
    // Try to access Supabase URL
    let supabaseUrl = null;
    try {
      supabaseUrl = await context.secrets.get("SUPABASE_URL");
      console.log("SUPABASE_URL available:", !!supabaseUrl);
      if (supabaseUrl) {
        console.log("SUPABASE_URL length:", supabaseUrl.length);
        console.log("SUPABASE_URL starts with:", supabaseUrl.substring(0, 10) + "...");
      }
    } catch (e) {
      console.log("Error accessing SUPABASE_URL:", e.message);
    }
    
    // Try to access Supabase Service Key
    let supabaseKey = null;
    try {
      supabaseKey = await context.secrets.get("SUPABASE_SERVICE_KEY");
      console.log("SUPABASE_SERVICE_KEY available:", !!supabaseKey);
      if (supabaseKey) {
        console.log("SUPABASE_SERVICE_KEY length:", supabaseKey.length);
      }
    } catch (e) {
      console.log("Error accessing SUPABASE_SERVICE_KEY:", e.message);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        allSecretsCount: allSecrets.length,
        supabaseUrlAvailable: !!supabaseUrl,
        supabaseKeyAvailable: !!supabaseKey,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error("Error checking secrets:", error);
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
  checkSecrets
}; 