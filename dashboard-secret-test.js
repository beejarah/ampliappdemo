/**
 * Simple Secret Test for Tenderly Dashboard
 * This script tests access to the SUPABASE_URL and SUPABASE_SERVICE_KEY secrets
 */

exports.handler = async (context, event) => {
  console.log("============== SECRET TEST ==============");
  console.log("Running secret test at:", new Date().toISOString());
  
  try {
    // Log all available secrets (just the names, not values)
    try {
      const secretNames = await context.secrets.list();
      console.log("Available secrets:", secretNames);
    } catch (e) {
      console.log("Could not list secrets:", e.message);
    }
    
    // Try to access Supabase secrets
    const supabaseUrl = await context.secrets.get('SUPABASE_URL');
    const supabaseKey = await context.secrets.get('SUPABASE_SERVICE_KEY');
    
    // Log info about each secret without revealing values
    console.log("SUPABASE_URL available:", !!supabaseUrl);
    if (supabaseUrl) {
      console.log("SUPABASE_URL length:", supabaseUrl.length);
      console.log("SUPABASE_URL starts with:", supabaseUrl.substring(0, 10) + "...");
    }
    
    console.log("SUPABASE_SERVICE_KEY available:", !!supabaseKey);
    if (supabaseKey) {
      console.log("SUPABASE_SERVICE_KEY length:", supabaseKey.length);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        message: "Secret test completed",
        secretsAvailable: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey
        }
      })
    };
  } catch (error) {
    console.error("Error in secret test:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "ERROR",
        message: error.message
      })
    };
  }
}; 