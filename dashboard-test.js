/**
 * Simple test function for Tenderly dashboard
 * Copy and paste this into the Tenderly dashboard when creating a new action
 */

// This format is specifically for the dashboard
exports.handler = async (context, event) => {
  console.log("=============== DASHBOARD TEST ===============");
  console.log("Running test at:", new Date().toISOString());
  
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
        message: "Successfully accessed secrets",
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
}; 