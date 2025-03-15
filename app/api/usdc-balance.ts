import { ethers } from 'ethers';

// Constants
const TARGET_WALLET = "0x2B769d40A46Bde0718f0AB1242c7d5eAe7402e71";
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Simple ABI for USDC token contract (only what we need)
const USDC_ABI = [
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
  }
];

/**
 * Fetches the current USDC balance from the blockchain
 */
export async function getUsdcBalance() {
  try {
    // Initialize provider for Base chain with fallback URLs
    const provider = new ethers.providers.JsonRpcProvider(
      {
        url: 'https://mainnet.base.org',
        skipFetchSetup: true
      },
      { name: 'base', chainId: 8453 }
    );
    
    // Create USDC contract instance
    const usdcContract = new ethers.Contract(USDC_CONTRACT, USDC_ABI, provider);
    
    // Get USDC token decimals and balance
    const [balanceWei, decimals] = await Promise.all([
      usdcContract.balanceOf(TARGET_WALLET),
      usdcContract.decimals()
    ]);
    
    // Format the balance to a number
    const formattedBalance = parseFloat(ethers.utils.formatUnits(balanceWei, decimals));
    
    return {
      success: true,
      balance: formattedBalance,
      timestamp: new Date().toISOString(),
      address: TARGET_WALLET
    };
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch USDC balance',
      timestamp: new Date().toISOString()
    };
  }
}

export default getUsdcBalance; 