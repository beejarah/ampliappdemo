const ethers = require('ethers');
const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Validate credentials are available
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials in Tenderly environment variables.');
  console.error('Please add SUPABASE_URL and SUPABASE_SERVICE_KEY in the Tenderly dashboard.');
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Contract ABI for querying balances
const CONTRACT_ABI = [
  // balanceOf
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  // decimals
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  // symbol
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  // ERC20 Transfer event
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" }
    ],
    name: "Transfer",
    type: "event"
  }
];

// Constants
const TARGET_WALLET = "0x2B769d40A46Bde0718f0AB1242c7d5eAe7402e71";
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const STORAGE_KEY = "last_usdc_balance";
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/**
 * Updates the wallet balance in Supabase
 */
async function updateWalletBalanceInSupabase(walletAddress, balance, decimals) {
  try {
    // Format the balance as a decimal string for database storage
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);
    console.log(`Updating Supabase with balance: ${formattedBalance} for wallet: ${walletAddress}`);

    // First, check if the wallet exists in the database
    const { data: existingWallet, error: queryError } = await supabase
      .from('wallet_balances')
      .select('id')
      .eq('wallet_address', walletAddress.toLowerCase())
      .maybeSingle();

    if (queryError) {
      console.error('Error querying wallet in Supabase:', queryError);
      return false;
    }

    let result;
    if (existingWallet) {
      // Update existing wallet
      result = await supabase
        .from('wallet_balances')
        .update({
          usdc_balance: formattedBalance
          // last_updated is handled by a database trigger
        })
        .eq('wallet_address', walletAddress.toLowerCase());
    } else {
      // Insert new wallet
      result = await supabase
        .from('wallet_balances')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          usdc_balance: formattedBalance
        });
    }

    if (result.error) {
      console.error('Error updating wallet balance in Supabase:', result.error);
      return false;
    }

    console.log(`Successfully updated balance in Supabase for ${walletAddress}`);
    return true;
  } catch (error) {
    console.error('Error in updateWalletBalanceInSupabase:', error);
    return false;
  }
}

/**
 * Records a USDC transaction in Supabase
 */
async function recordTransactionInSupabase(txHash, from, to, amount, blockNumber, timestamp, eventId) {
  try {
    // Format the amount as a decimal string
    console.log(`Recording transaction in Supabase: ${from} -> ${to}, Amount: ${amount}`);

    const { data, error } = await supabase
      .from('usdc_transactions')
      .insert({
        tx_hash: txHash,
        from_address: from.toLowerCase(),
        to_address: to.toLowerCase(),
        amount: amount,
        block_number: blockNumber,
        timestamp: new Date(timestamp * 1000).toISOString(),
        tenderly_event_id: eventId || null
      });

    if (error) {
      // If the error is a duplicate entry, it's not actually an error for our purposes
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        console.log(`Transaction ${txHash} already recorded, skipping.`);
        return true;
      }
      
      console.error('Error recording transaction in Supabase:', error);
      return false;
    }

    console.log(`Successfully recorded transaction ${txHash} in Supabase`);
    return true;
  } catch (error) {
    console.error('Error in recordTransactionInSupabase:', error);
    return false;
  }
}

/**
 * Monitors USDC transfers to the target wallet via logs and only processes 
 * transactions where the target wallet is the recipient
 */
const monitorReceiptFilter = async (context, event) => {
  try {
    console.log("=============== TRANSACTION TO USDC CONTRACT DETECTED ===============");
    console.log("Target wallet for monitoring:", TARGET_WALLET);
    console.log("Event time:", new Date().toISOString());
    
    // Early validation - check if this transaction has logs we care about
    if (!event || !event.transaction || !event.transaction.logs) {
      console.log("No transaction logs available, skipping this transaction");
      return {
        statusCode: 200,
        body: JSON.stringify({ status: "SKIPPED", reason: "No transaction logs" })
      };
    }
    
    const tx = event.transaction;
    console.log(`Transaction hash: ${tx.hash}`);
    
    // Search for Transfer events to our target wallet
    console.log("Scanning transaction logs for Transfer events to target wallet...");
    
    let foundTargetTransfer = false;
    let transferAmount = null;
    let transferFrom = null;
    
    // Scan logs for Transfer events where our target wallet is recipient
    for (const log of tx.logs) {
      // Check if log is from USDC contract
      if (log.address && log.address.toLowerCase() === USDC_CONTRACT.toLowerCase()) {
        // Check if it's a Transfer event
        if (log.topics && log.topics[0] === TRANSFER_EVENT_SIGNATURE) {
          // Extract recipient address from topics[2]
          const recipient = '0x' + log.topics[2].slice(26);
          
          // Check if our target wallet is the recipient
          if (recipient.toLowerCase() === TARGET_WALLET.toLowerCase()) {
            foundTargetTransfer = true;
            
            // Extract sender from topics[1]
            transferFrom = '0x' + log.topics[1].slice(26);
            
            // Extract amount from data field
            transferAmount = ethers.BigNumber.from(log.data);
            
            console.log(`✓ Found USDC transfer TO our target wallet!`);
            console.log(`  From: ${transferFrom}`);
            console.log(`  Amount: ${transferAmount.toString()}`);
            break;
          }
        }
      }
    }
    
    // If no transfer to our target wallet, exit early
    if (!foundTargetTransfer) {
      console.log("✗ No USDC transfers to target wallet in this transaction, skipping");
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: "SKIPPED", 
          reason: "No transfers to target wallet",
          transactionHash: tx.hash
        })
      };
    }
    
    // We've confirmed this is a transfer to our target wallet, now get current balance
    console.log("Confirmed transfer to target wallet, checking current balance...");
    
    // Initialize provider for Base chain
    const provider = new ethers.providers.JsonRpcProvider(
      'https://mainnet.base.org',
      { name: 'base', chainId: 8453 }
    );
    
    // Create USDC contract instance
    const usdcContract = new ethers.Contract(USDC_CONTRACT, CONTRACT_ABI, provider);
    
    // Get USDC token info and balance
    const [balance, decimals, symbol] = await Promise.all([
      usdcContract.balanceOf(TARGET_WALLET),
      usdcContract.decimals(),
      usdcContract.symbol()
    ]);
    
    // Format amounts
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);
    const formattedTransferAmount = ethers.utils.formatUnits(transferAmount, decimals);
    
    // Record the transaction in Supabase
    await recordTransactionInSupabase(
      tx.hash,
      transferFrom,
      TARGET_WALLET,
      formattedTransferAmount,
      tx.blockNumber,
      tx.timestamp,
      event.id
    );
    
    // Update the wallet balance in Supabase
    await updateWalletBalanceInSupabase(TARGET_WALLET, balance, decimals);
    
    // Check if we have a stored previous balance
    let previousBalanceData = null;
    try {
      previousBalanceData = await context.storage.getJson(STORAGE_KEY);
    } catch (e) {
      console.log("No previous balance data found, this is the first check");
    }
    
    // Create result object
    const result = {
      event: "USDC Transfer To Target Wallet",
      checkTime: new Date().toISOString(),
      wallet: TARGET_WALLET,
      transfer: {
        from: transferFrom,
        amount: transferAmount.toString(),
        formattedAmount: formattedTransferAmount,
        symbol
      },
      currentBalance: {
        raw: balance.toString(),
        formatted: formattedBalance,
        symbol
      },
      transactionDetails: {
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp
      },
      supabaseUpdated: true
    };
    
    // Compare with previous balance if available
    if (previousBalanceData) {
      const prevRawBalance = previousBalanceData.balance;
      const balanceDiff = balance.sub(ethers.BigNumber.from(prevRawBalance));
      const formattedDiff = ethers.utils.formatUnits(balanceDiff, decimals);
      
      result.previousBalance = {
        raw: prevRawBalance,
        formatted: ethers.utils.formatUnits(prevRawBalance, decimals),
        time: previousBalanceData.time
      };
      
      result.change = {
        raw: balanceDiff.toString(),
        formatted: formattedDiff
      };
    }
    
    // Store the current balance for next comparison
    await context.storage.putJson(STORAGE_KEY, {
      balance: balance.toString(),
      time: new Date().toISOString()
    });
    
    console.log(`Transfer confirmed: ${formattedTransferAmount} ${symbol} from ${transferFrom}`);
    console.log(`Current USDC Balance: ${formattedBalance} ${symbol}`);
    console.log("Supabase database updated with transfer and new balance");
    console.log("=============== END OF TRANSFER NOTIFICATION ===============");
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error("Error in monitorReceiptFilter:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

module.exports = { monitorReceiptFilter }; 