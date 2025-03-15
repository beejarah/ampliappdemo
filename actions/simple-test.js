/**
 * Simple test function to verify Tenderly actions are working
 */
async function basicTestFunction(context, event) {
  console.log("============== SIMPLE TEST ==============");
  console.log("Running simple test at:", new Date().toISOString());
  
  try {
    // Log event information
    console.log("Event type:", event.type);
    console.log("Event details:", JSON.stringify(event));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        message: "Simple test executed successfully",
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error("Error in simple test:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: "ERROR",
        message: error.message
      })
    };
  }
}

// Export the function for Tenderly Actions
module.exports = {
  basicTestFunction
}; 