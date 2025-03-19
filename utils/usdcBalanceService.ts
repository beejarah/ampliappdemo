import supabase from './supabase';

// Wallet address constants - correct addresses
export const TARGET_WALLET = "0x20b7bd444aBBDc4B27e399Ad6440c1801e1413cF";
export const INTEREST_WALLET = "0x44089ccdE3Bc3156d43865227fD93cafDD6417a7";
export const ORIGIN_WALLET = "0x97AE9243Fa9E0D1DABed05d42D02edAF62a6C21A";

export default class UsdcBalanceService {
  /**
   * Gets a normalized wallet address (lowercase)
   * 
   * @param walletAddress The blockchain wallet address
   * @returns The normalized wallet address
   */
  static getNormalizedAddress(walletAddress: string): string {
    return walletAddress.toLowerCase();
  }

  /**
   * Gets the latest balance for a wallet from Supabase
   * Ensures interest is calculated by calling the PostgreSQL function first
   * 
   * @param walletAddress The blockchain wallet address
   * @returns The latest balance, interest, and timestamp data
   */
  static async getLatestBalance(walletAddress = TARGET_WALLET) {
    try {
      const normalizedAddress = this.getNormalizedAddress(walletAddress);
      
      console.log(`Fetching balance for wallet: ${normalizedAddress}`);
      
      // First, trigger the calculate_interest function to update interest
      const { data: interestData, error: interestError } = await supabase.rpc('calculate_interest', {
        wallet_address: normalizedAddress,
        calculation_time: new Date().toISOString()
      });
      
      if (interestError) {
        console.error('Error calculating interest:', interestError);
      } else {
        console.log('Interest calculation triggered successfully');
      }
      
      // Then fetch the latest wallet record
      const { data, error } = await supabase
        .from('wallet_balances')
        .select(`
          wallet_address,
          usdc_balance, 
          accumulated_interest,
          last_updated,
          last_interest_update,
          last_withdrawal_timestamp
        `)
        .eq('wallet_address', normalizedAddress)
        .single();
      
      if (error) {
        console.error('Error fetching wallet balance:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
      if (!data) {
        console.log('No wallet balance found, returning zero');
        return {
          success: true,
          balance: 0,
          interest: 0,
          lastUpdated: new Date(),
          lastInterestUpdate: null,
          lastWithdrawalTimestamp: null
        };
      }
      
      console.log('Wallet data from Supabase:', {
        balance: data.usdc_balance,
        interest: data.accumulated_interest,
        lastUpdated: data.last_updated,
        lastInterestUpdate: data.last_interest_update,
        lastWithdrawalTimestamp: data.last_withdrawal_timestamp
      });
      
      return {
        success: true,
        balance: parseFloat(data.usdc_balance) || 0,
        interest: parseFloat(data.accumulated_interest) || 0,
        lastUpdated: data.last_updated ? new Date(data.last_updated) : new Date(),
        lastInterestUpdate: data.last_interest_update ? new Date(data.last_interest_update) : null,
        lastWithdrawalTimestamp: data.last_withdrawal_timestamp ? new Date(data.last_withdrawal_timestamp) : null
      };
    } catch (error) {
      console.error('Unexpected error fetching balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Records a withdrawal for the wallet, which resets the accumulated interest
   * 
   * @param walletAddress The blockchain wallet address
   * @returns Whether the withdrawal was successfully recorded
   */
  static async recordWithdrawal(walletAddress = TARGET_WALLET): Promise<boolean> {
    try {
      console.log('IMPORTANT: Recording withdrawal - SETTING BALANCE AND INTEREST TO ZERO');
      const normalizedAddress = this.getNormalizedAddress(walletAddress);
      const now = new Date().toISOString();

      // Update the wallet record: reset accumulated interest and update withdrawal timestamp
      // CRITICAL: ALSO SET BALANCE TO ZERO during withdrawal to ensure no interest accrues
      const { error } = await supabase
        .from('wallet_balances')
        .update({
          accumulated_interest: 0,
          last_interest_update: now,
          last_withdrawal_timestamp: now,
          usdc_balance: 0 // Force balance to zero during withdrawal
        })
        .eq('wallet_address', normalizedAddress);

      if (error) {
        console.error('Error recording withdrawal:', error);
        return false;
      }

      console.log('WITHDRAWAL RECORDED: Balance and interest are now both ZERO');
      return true;
    } catch (error) {
      console.error('Unexpected error recording withdrawal:', error);
      return false;
    }
  }

  /**
   * Gets the last withdrawal timestamp for a wallet
   * 
   * @param walletAddress The blockchain wallet address
   * @returns The last withdrawal timestamp or null if not found
   */
  static async getLastWithdrawalTimestamp(walletAddress = TARGET_WALLET): Promise<Date | null> {
    try {
      const normalizedAddress = this.getNormalizedAddress(walletAddress);

      const { data, error } = await supabase
        .from('wallet_balances')
        .select('last_withdrawal_timestamp')
        .eq('wallet_address', normalizedAddress)
        .single();

      if (error) {
        console.error('Error fetching last withdrawal timestamp:', error);
        return null;
      }

      return data?.last_withdrawal_timestamp ? new Date(data.last_withdrawal_timestamp) : null;
    } catch (error) {
      console.error('Unexpected error fetching last withdrawal timestamp:', error);
      return null;
    }
  }

  /**
   * Resets the interest for a wallet to zero
   * 
   * @param walletAddress The blockchain wallet address
   * @returns Whether the interest was successfully reset
   */
  static async resetInterest(walletAddress = TARGET_WALLET): Promise<boolean> {
    try {
      const normalizedAddress = this.getNormalizedAddress(walletAddress);
      const now = new Date().toISOString();

      // Reset interest and update the timestamp
      const { error } = await supabase
        .from('wallet_balances')
        .update({
          accumulated_interest: 0,
          last_interest_update: now
        })
        .eq('wallet_address', normalizedAddress);

      if (error) {
        console.error('Error resetting interest:', error);
        return false;
      }

      console.log('Interest reset successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error resetting interest:', error);
      return false;
    }
  }
  
  /**
   * Sets up a real-time subscription for wallet balance updates
   * 
   * @param walletAddress The blockchain wallet address to monitor
   * @param onUpdate Callback function triggered when the balance updates
   * @returns The subscription channel
   */
  static subscribeToBalanceUpdates(
    walletAddress = TARGET_WALLET,
    onUpdate: (balance: number, timestamp: Date) => void
  ) {
    const normalizedAddress = this.getNormalizedAddress(walletAddress);
    
    console.log(`Setting up real-time subscription for wallet: ${normalizedAddress}`);
    
    // Track state to prevent cascading updates
    let lastBalance: number | null = null;
    let lastResetTime = 0;
    let lastUpdateTime = 0;
    const RESET_THROTTLE = 10000; // Only reset once every 10 seconds
    const UPDATE_THROTTLE = 1000; // Only process updates once per second
    
    const channel = supabase
      .channel('wallet_balances_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallet_balances',
          filter: `wallet_address=eq.${normalizedAddress}`
        },
        async (payload) => {
          // Extract the new balance and timestamp
          const newRecord = payload.new;
          if (!newRecord || newRecord.usdc_balance === undefined) {
            return;
          }
          
          const now = Date.now();
          const balance = parseFloat(newRecord.usdc_balance);
          const lastUpdated = newRecord.last_updated ? new Date(newRecord.last_updated) : new Date();
          
          // Throttle rapid updates
          if (now - lastUpdateTime < UPDATE_THROTTLE) {
            console.log('Throttling real-time update (too frequent)');
            return;
          }
          
          // Skip if balance hasn't changed
          if (lastBalance !== null && lastBalance === balance) {
            console.log('Skipping real-time update - balance unchanged');
            return;
          }
          
          lastBalance = balance;
          lastUpdateTime = now;
          
          console.log(`Real-time: Balance updated to ${balance} at ${lastUpdated.toISOString()}`);
          
          // If balance is zero, check when we last reset interest
          if (balance === 0) {
            if (now - lastResetTime > RESET_THROTTLE) {
              console.log('Real-time: Zero balance detected - ensuring interest is reset');
              lastResetTime = now;
              
              try {
                await this.resetInterest(normalizedAddress);
                console.log('Real-time: Interest reset successful');
              } catch (error) {
                console.error('Real-time: Error resetting interest:', error);
              }
            } else {
              console.log('Real-time: Skipping interest reset (throttled)');
            }
          }
          
          // Notify component about the update
          onUpdate(balance, lastUpdated);
        }
      )
      .subscribe();
    
    return channel;
  }
} 