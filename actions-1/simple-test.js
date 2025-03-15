/**
 * Simple test function to verify Tenderly actions are working properly
 * without requiring external dependencies
 */

// Simple test function that just logs and returns a success response
const basicTestFunction = async (context, event) => {
  console.log("=============== BASIC TENDERLY TEST ===============");
  console.log("Running test at:", new Date().toISOString());
  
  try {
    // Log some basic information
    console.log("Event type:", event.type);
    console.log("Context available:", !!context);
    
    // Check if environment variables are accessible
    const supabaseUrl = process.env.SUPABASE_URL || "Not set";
    const supabaseKeyPartial = process.env.SUPABASE_SERVICE_KEY 
      ? process.env.SUPABASE_SERVICE_KEY.substring(0, 10) + "..." 
      : "Not set";
    
    console.log("SUPABASE_URL:", supabaseUrl.includes("supabase.co") ? "Valid URL detected" : "Invalid or missing URL");
    console.log("SUPABASE_SERVICE_KEY:", supabaseKeyPartial === "Not set" ? "Not set" : "Key is set (starts with: " + supabaseKeyPartial + ")");
    
    // Return success
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        message: "Basic Tenderly test completed successfully",
        timestamp: new Date().toISOString(),
        environmentVarsDetected: {
          supabaseUrl: !!process.env.SUPABASE_URL,
          supabaseKey: !!process.env.SUPABASE_SERVICE_KEY
        }
      })
    };
  } catch (error) {
    console.error("Error in test function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: "ERROR", 
        message: error.message || "Unknown error"
      })
    };
  }
};

module.exports = {
  basicTestFunction
}; 