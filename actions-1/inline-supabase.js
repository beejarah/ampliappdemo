/**
 * Standalone action that includes inline implementation of Supabase client
 * to avoid dependency issues
 */

const https = require('https');

// Target wallet address
const TARGET_WALLET = "0x2B769d40A46Bde0718f0AB1242c7d5eAe7402e71";

/**
 * Simple function to make HTTP requests to Supabase
 */
async function makeSupabaseRequest(url, apiKey, path, method, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    
    const fullUrl = `${url}${path}`;
    console.log(`Making ${method} request to: ${fullUrl}`);
    
    const req = https.request(fullUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          console.log('Response status:', res.statusCode);
          resolve({
            data: parsedData,
            status: res.statusCode,
            error: res.statusCode >= 400 ? { message: 'Error response from Supabase', status: res.statusCode } : null
          });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Updates the wallet balance in Supabase using direct REST API calls
 */
async function updateWalletBalance(supabaseUrl, supabaseKey, walletAddress, balance) {
  try {
    const normalizedAddress = walletAddress.toLowerCase();
    const timestamp = new Date().toISOString();
    
    console.log(`Updating wallet balance for ${normalizedAddress} to ${balance}`);
    
    // First check if the wallet exists
    const checkResult = await makeSupabaseRequest(
      supabaseUrl,
      supabaseKey,
      '/rest/v1/wallet_balances?wallet_address=eq.' + encodeURIComponent(normalizedAddress) + '&select=id',
      'GET'
    );
    
    let upsertResult;
    if (checkResult.data && checkResult.data.length > 0) {
      console.log('Wallet exists, updating record');
      // Update existing record
      upsertResult = await makeSupabaseRequest(
        supabaseUrl,
        supabaseKey,
        '/rest/v1/wallet_balances?wallet_address=eq.' + encodeURIComponent(normalizedAddress),
        'PATCH',
        {
          usdc_balance: balance,
          last_updated: timestamp
        }
      );
    } else {
      console.log('Wallet does not exist, creating new record');
      // Insert new record
      upsertResult = await makeSupabaseRequest(
        supabaseUrl,
        supabaseKey,
        '/rest/v1/wallet_balances',
        'POST',
        {
          wallet_address: normalizedAddress,
          usdc_balance: balance,
          last_updated: timestamp,
          created_at: timestamp
        }
      );
    }
    
    if (upsertResult.error) {
      console.error('Error updating wallet balance:', upsertResult.error);
      return false;
    }
    
    console.log('Successfully updated wallet balance');
    return true;
  } catch (error) {
    console.error('Error in updateWalletBalance:', error);
    return false;
  }
}

/**
 * Main action function that tests Supabase connectivity without external dependencies
 */
const inlineSupabaseTest = async (context, event) => {
  console.log("=============== INLINE SUPABASE TEST ===============");
  console.log("Running test at:", new Date().toISOString());
  
  try {
    // Get credentials from Tenderly secrets instead of environment variables
    console.log("Retrieving Supabase secrets from Tenderly...");
    
    // Access the secrets using the context object
    const SUPABASE_URL = await context.secrets.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = await context.secrets.get('SUPABASE_SERVICE_KEY');
    
    console.log("Supabase URL secret retrieved:", !!SUPABASE_URL);
    console.log("Supabase Service Key secret retrieved:", !!SUPABASE_SERVICE_KEY);
    
    if (!SUPABASE_URL) {
      throw new Error("SUPABASE_URL secret is missing. Please check your Tenderly Secrets configuration.");
    }
    
    if (!SUPABASE_SERVICE_KEY) {
      throw new Error("SUPABASE_SERVICE_KEY secret is missing. Please check your Tenderly Secrets configuration.");
    }
    
    // Generate a test balance (random between 10-100)
    const testBalance = (10 + Math.random() * 90).toFixed(6);
    console.log(`Test balance to update: ${testBalance}`);
    
    // Update the wallet balance
    const updateResult = await updateWalletBalance(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      TARGET_WALLET,
      testBalance
    );
    
    if (!updateResult) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          status: "ERROR", 
          message: "Failed to update wallet balance" 
        })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        message: "Supabase test completed successfully using inline HTTP requests",
        updatedBalance: testBalance
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

// Also export a basic test function that just verifies secret access
const testSecrets = async (context, event) => {
  console.log("=============== TESTING SECRETS ACCESS ===============");
  try {
    // Try to access the secrets
    const supabaseUrl = await context.secrets.get('SUPABASE_URL');
    const supabaseKey = await context.secrets.get('SUPABASE_SERVICE_KEY');
    
    // Log info without revealing the actual values
    console.log("SUPABASE_URL available:", !!supabaseUrl);
    console.log("SUPABASE_URL starts with:", supabaseUrl ? supabaseUrl.substring(0, 12) + "..." : "N/A");
    
    console.log("SUPABASE_SERVICE_KEY available:", !!supabaseKey);
    console.log("SUPABASE_SERVICE_KEY length:", supabaseKey ? supabaseKey.length : 0);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        message: "Successfully accessed Tenderly secrets",
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

module.exports = {
  inlineSupabaseTest,
  testSecrets
}; 