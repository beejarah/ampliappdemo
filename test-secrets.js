/**
 * Simple test action that verifies access to Tenderly secrets
 */

/**
 * Main test function 
 */
const testSecretsAccess = async (context, event) => {
  console.log("=============== TEST SECRETS ACCESS ===============");
  console.log("Running test at:", new Date().toISOString());
  
  try {
    // Try to access secrets
    const supabaseUrl = await context.secrets.get('SUPABASE_URL');
    const supabaseKey = await context.secrets.get('SUPABASE_SERVICE_KEY');
    
    // Log info without revealing values
    console.log("SUPABASE_URL available:", !!supabaseUrl);
    console.log("SUPABASE_URL starts with:", supabaseUrl ? supabaseUrl.substring(0, 12) + "..." : "N/A");
    console.log("SUPABASE_SERVICE_KEY available:", !!supabaseKey);
    console.log("SUPABASE_SERVICE_KEY length:", supabaseKey ? supabaseKey.length : 0);
    
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
        message: error.message || "Unknown error accessing secrets",
        stack: error.stack
      })
    };
  }
};

module.exports = {
  testSecretsAccess
}; 