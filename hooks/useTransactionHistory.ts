import { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import UsdcBalanceService, { TARGET_WALLET } from '../utils/usdcBalanceService';
import { Transaction } from '../components/ui/TransactionHistory';

/**
 * Hook to fetch and monitor USDC transaction history
 */
export function useTransactionHistory(limit = 10) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Hold the subscription reference to clean it up later
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Set up the Supabase real-time subscription
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch of transactions
    const fetchTransactions = async () => {
      if (!isMountedRef.current) return;
      
      try {
        console.log('Fetching transaction history...');
        const result = await UsdcBalanceService.getRecentTransactions(TARGET_WALLET, limit);
        
        if (result.success && isMountedRef.current) {
          // Map the data to match our Transaction interface
          const formattedTransactions = result.transactions.map((tx: any) => ({
            id: tx.id || tx.hash,
            hash: tx.hash,
            from_address: tx.from_address,
            to_address: tx.to_address,
            amount: tx.amount,
            timestamp: tx.timestamp,
            block_number: tx.block_number,
            status: tx.status || 'confirmed',
          }));
          
          console.log(`Fetched ${formattedTransactions.length} transactions`);
          setTransactions(formattedTransactions);
          setError(null);
        } else {
          throw new Error(result.error || 'Failed to fetch transactions');
        }
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error(err?.message || 'Failed to fetch transactions'));
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    // Set up subscription to transaction updates
    const setupSubscription = () => {
      try {
        // Clear any existing subscription
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
        
        // Create new subscription to transaction updates
        subscriptionRef.current = UsdcBalanceService.subscribeToTransactionUpdates(
          TARGET_WALLET,
          async () => {
            // When a new transaction is detected, refresh the entire list
            if (isMountedRef.current) {
              await fetchTransactions();
            }
          }
        );
        
        console.log('Set up Supabase real-time subscription for transaction updates');
      } catch (err) {
        console.error('Error setting up transaction subscription:', err);
      }
    };
    
    // Initial fetch and subscription setup
    fetchTransactions();
    setupSubscription();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up useTransactionHistory hook');
      isMountedRef.current = false;
      
      // Unsubscribe from Supabase channel
      if (subscriptionRef.current) {
        console.log('Unsubscribing from Supabase real-time updates');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [limit]); // Rerun if limit changes

  // Function to manually refresh transactions
  const refreshTransactions = async () => {
    if (isLoading) return; // Prevent multiple simultaneous refreshes
    
    setIsLoading(true);
    try {
      console.log('Manually refreshing transaction history...');
      const result = await UsdcBalanceService.getRecentTransactions(TARGET_WALLET, limit);
      
      if (result.success && isMountedRef.current) {
        // Map the data to match our Transaction interface
        const formattedTransactions = result.transactions.map((tx: any) => ({
          id: tx.id || tx.hash,
          hash: tx.hash,
          from_address: tx.from_address,
          to_address: tx.to_address,
          amount: tx.amount,
          timestamp: tx.timestamp,
          block_number: tx.block_number,
          status: tx.status || 'confirmed',
        }));
        
        console.log(`Refreshed ${formattedTransactions.length} transactions`);
        setTransactions(formattedTransactions);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to refresh transactions');
      }
    } catch (err: any) {
      console.error('Error refreshing transactions:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(err?.message || 'Failed to refresh transactions'));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return {
    transactions,
    isLoading,
    error,
    refreshTransactions
  };
} 