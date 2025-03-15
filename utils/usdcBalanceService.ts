import supabase from './supabase';
import { ethers } from 'ethers';

// Constants
export const TARGET_WALLET = "0x2B769d40A46Bde0718f0AB1242c7d5eAe7402e71";
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

/**
 * Service for handling USDC balance operations with Supabase
 */
export class UsdcBalanceService {
  /**
   * Fetches the latest balance from Supabase for the wallet
   */
  static async getLatestBalance(walletAddress = TARGET_WALLET): Promise<{
    balance: number;
    lastUpdated: Date | null;
    success: boolean;
    error?: string;
    data?: any; // Add raw data for debugging
  }> {
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('usdc_balance, last_updated')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (error) {
        console.error('Error fetching balance from Supabase:', error);
        throw error;
      }

      return {
        balance: parseFloat(data.usdc_balance),
        lastUpdated: data.last_updated ? new Date(data.last_updated) : null,
        success: true,
        data // Include raw data for debugging
      };
    } catch (error) {
      console.error('Error in getLatestBalance:', error);
      return {
        balance: 0,
        lastUpdated: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Manually update the wallet balance in Supabase (for testing purposes)
   */
  static async updateBalance(walletAddress = TARGET_WALLET, balance = 123.45678): Promise<boolean> {
    try {
      // Convert wallet address to lowercase for consistency
      const normalizedAddress = walletAddress.toLowerCase();
      
      console.log(`Attempting to update balance for ${normalizedAddress} to ${balance}...`);
      
      // Check if wallet exists in the database
      const { data: existingWallet, error: queryError } = await supabase
        .from('wallet_balances')
        .select('id, usdc_balance')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();
      
      if (queryError) {
        console.error('Error checking wallet in Supabase:', queryError);
        return false;
      }
      
      console.log('Current wallet data:', existingWallet);
      
      // Prepare timestamp
      const now = new Date().toISOString();
      
      let result;
      if (existingWallet) {
        // Update existing wallet - use UPSERT instead of UPDATE
        result = await supabase
          .from('wallet_balances')
          .upsert({
            id: existingWallet.id,
            wallet_address: normalizedAddress,
            usdc_balance: balance,
            last_updated: now
          }, {
            onConflict: 'wallet_address'
          });
      } else {
        // Insert new wallet
        result = await supabase
          .from('wallet_balances')
          .insert({
            wallet_address: normalizedAddress,
            usdc_balance: balance,
            last_updated: now,
            created_at: now
          });
      }
      
      if (result.error) {
        console.error('Error updating wallet balance in Supabase:', result.error);
        return false;
      }
      
      console.log(`Update result:`, result);
      
      // Verify the update actually worked
      const { data: verifyData, error: verifyError } = await supabase
        .from('wallet_balances')
        .select('usdc_balance')
        .eq('wallet_address', normalizedAddress)
        .single();
        
      if (verifyError) {
        console.error('Error verifying update:', verifyError);
        return false;
      }
      
      const actualBalance = parseFloat(verifyData.usdc_balance);
      if (actualBalance !== balance) {
        console.error(`Update didn't take effect! Expected ${balance} but got ${actualBalance}`);
        return false;
      }
      
      console.log(`Successfully updated balance for ${normalizedAddress} to ${balance}`);
      return true;
    } catch (error) {
      console.error('Error in updateBalance:', error);
      return false;
    }
  }

  /**
   * Subscribes to real-time balance updates from Supabase
   */
  static subscribeToBalanceUpdates(
    walletAddress = TARGET_WALLET,
    callback: (balance: number, lastUpdated: Date) => void
  ) {
    // Convert wallet address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase();

    // Create subscription to the wallet_balances table
    const subscription = supabase
      .channel('wallet_balance_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallet_balances',
          filter: `wallet_address=eq.${normalizedAddress}`
        },
        (payload) => {
          console.log('Received balance update from Supabase:', payload);
          
          // Extract the updated balance and timestamp
          const newBalance = parseFloat(payload.new.usdc_balance);
          const lastUpdated = new Date(payload.new.last_updated);
          
          // Call the provided callback with the new data
          callback(newBalance, lastUpdated);
        }
      )
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
      });

    // Return the subscription so it can be unsubscribed later
    return subscription;
  }

  /**
   * Subscribes to real-time transaction updates from Supabase
   */
  static subscribeToTransactionUpdates(
    walletAddress = TARGET_WALLET,
    callback: () => void
  ) {
    // Convert wallet address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase();

    // Create subscription to the usdc_transactions table
    const subscription = supabase
      .channel('usdc_transaction_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'usdc_transactions',
          filter: `or(from_address.eq.${normalizedAddress},to_address.eq.${normalizedAddress})`
        },
        (payload) => {
          console.log('Received transaction update from Supabase:', payload);
          
          // Call the provided callback when a transaction is updated
          callback();
        }
      )
      .subscribe((status) => {
        console.log('Supabase transaction subscription status:', status);
      });

    // Return the subscription so it can be unsubscribed later
    return subscription;
  }

  /**
   * Fetches recent USDC transactions for a wallet
   */
  static async getRecentTransactions(
    walletAddress = TARGET_WALLET,
    limit = 10
  ) {
    try {
      // Convert wallet address to lowercase for consistency
      const normalizedAddress = walletAddress.toLowerCase();

      const { data, error } = await supabase
        .from('usdc_transactions')
        .select('*')
        .or(`from_address.eq.${normalizedAddress},to_address.eq.${normalizedAddress}`)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions from Supabase:', error);
        throw error;
      }

      return {
        transactions: data,
        success: true
      };
    } catch (error) {
      console.error('Error in getRecentTransactions:', error);
      return {
        transactions: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default UsdcBalanceService; 