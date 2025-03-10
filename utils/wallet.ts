// Alchemy Base API configuration
const ALCHEMY_API_KEY = process.env.EXPO_PUBLIC_ALCHEMY_API_KEY || 'demo';
const BASE_RPC_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// USDC contract address on Base
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6; // USDC has 6 decimal places

async function getEthPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    if (__DEV__) console.error('Error fetching ETH price:', error);
    return 0;
  }
}

export async function getWalletBalance(address: string): Promise<number> {
  try {
    // Basic address validation
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      if (__DEV__) console.error('Invalid address format');
      return 0;
    }

    // Create the balanceOf function call data
    // Function selector for balanceOf(address) = 0x70a08231
    // The address parameter needs to be padded to 32 bytes (64 characters)
    const paddedAddress = address.toLowerCase().slice(2).padStart(64, '0');
    const balanceOfData = `0x70a08231${paddedAddress}`;

    if (__DEV__) {
      console.log('Fetching USDC balance for address:', address);
      console.log('Balance call data:', balanceOfData);
    }

    const response = await fetch(BASE_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: USDC_CONTRACT,
            data: balanceOfData,
          },
          'latest'
        ],
      }),
    });

    const data = await response.json();
    if (__DEV__) console.log('API Response:', data);
    
    if (data.error) {
      if (__DEV__) console.error('RPC error:', data.error);
      return 0;
    }

    // Convert hex balance to decimal and adjust for decimals
    const balanceHex = data.result;
    // Remove '0x' prefix and convert to BigInt to handle large numbers
    const balanceInt = BigInt(`0x${balanceHex.slice(2)}`);
    // Convert to number and adjust for USDC's 6 decimals
    const balanceInUSDC = Number(balanceInt) / Math.pow(10, USDC_DECIMALS);
    
    if (__DEV__) {
      console.log('Raw balance (hex):', balanceHex);
      console.log('Raw balance (BigInt):', balanceInt.toString());
      console.log('USDC Balance:', balanceInUSDC);
    }
    
    return Number(balanceInUSDC.toFixed(5));
  } catch (error) {
    if (__DEV__) console.error('Error fetching USDC balance:', error);
    return 0;
  }
} 