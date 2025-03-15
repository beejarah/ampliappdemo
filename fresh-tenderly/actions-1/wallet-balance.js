const ethers = require('ethers');

// Simple ERC20 ABI for token balance checks
const ERC20_ABI = [
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
  // transfer event
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  }
];

// Constants for our specific monitoring
const WALLET_ADDRESS = "0x2B769d40A46Bde0718f0AB1242c7d5eAe7402e71";
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

/**
 * Monitors USDC transfers to a specific wallet and fetches its USDC balance
 */
const getBaseWalletBalance = async (context, event) => {
  try {
    // Log detailed information about the triggering event
    console.log("======= USDC TRANSFER DETECTION =======");
    console.log("Transaction hash:", event.transaction?.hash);
    console.log("Transaction to:", event.transaction?.to);
    console.log("From address:", event.transaction?.from);
    console.log("Target wallet for monitoring:", WALLET_ADDRESS);
    
    // If this was actually triggered by a block rather than a transaction
    if (event.block && !event.transaction) {
      console.log("WARNING: Triggered by block event, not transaction");
      return {
        statusCode: 200,
        body: JSON.stringify({
          warning: "Triggered by block, not a USDC transfer",
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // Connect to Base chain (Mainnet)
    // Base chain ID is 8453
    const provider = new ethers.providers.JsonRpcProvider(
      'https://mainnet.base.org',
      { name: 'base', chainId: 8453 }
    );

    // Create USDC contract instance
    const usdcContract = new ethers.Contract(USDC_CONTRACT, ERC20_ABI, provider);
    
    // Get USDC token info and balance
    const [balance, decimals, symbol] = await Promise.all([
      usdcContract.balanceOf(WALLET_ADDRESS),
      usdcContract.decimals(),
      usdcContract.symbol()
    ]);

    // Format the balance
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);
    
    // Prepare result with only USDC balance
    const result = {
      event: "USDC Transfer Detected",
      transactionHash: event.transaction?.hash,
      wallet: WALLET_ADDRESS,
      usdc: {
        address: USDC_CONTRACT,
        symbol,
        decimals,
        balance: {
          raw: balance.toString(),
          formatted: formattedBalance
        }
      },
      timestamp: new Date().toISOString()
    };

    console.log(`USDC Balance for ${WALLET_ADDRESS}: ${formattedBalance} ${symbol}`);
    console.log("======= END OF DETECTION =======");
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error in getBaseWalletBalance:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

module.exports = { getBaseWalletBalance }; 