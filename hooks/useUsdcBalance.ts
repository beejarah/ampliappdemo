import { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import UsdcBalanceService, { TARGET_WALLET } from '../utils/usdcBalanceService';
import getUsdcBalance from '../app/api/usdc-balance';

/**
 * Hook to fetch and monitor USDC balance using Supabase real-time updates
 * @param refreshInterval - Optional interval for fallback refreshes in milliseconds. Set to 0 to disable polling.
 */
export function useUsdcBalance(refreshInterval = 0) { // Set default to 0 to disable polling
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Hold the subscription reference to clean it up later
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Set up the Supabase real-time subscription only once
  useEffect(() => {
    let refreshTimeoutId: NodeJS.Timeout | null = null;
    isMountedRef.current = true;

    // Initial fetch of balance from Supabase/blockchain
    const fetchInitialBalance = async () => {
      if (!isMountedRef.current) return;
      
      try {
        console.log('Fetching initial balance...');
        // First try to get the balance from Supabase
        const supabaseResult = await UsdcBalanceService.getLatestBalance(TARGET_WALLET);
        
        if (supabaseResult.success && isMountedRef.current) {
          console.log('Initial balance from Supabase:', supabaseResult.balance);
          
          // For testing only: If balance is 0, set a mock balance
          const mockBalance = supabaseResult.balance === 0 ? 123.45678 : supabaseResult.balance;
          
          setBalance(mockBalance);
          setLastUpdated(supabaseResult.lastUpdated);
        } else {
          // If Supabase fails, fall back to direct blockchain query
          console.log('Supabase query failed, fetching from blockchain...');
          const blockchainResult = await getUsdcBalance();
          
          if (!blockchainResult.success) {
            throw new Error(blockchainResult.error || 'Failed to fetch USDC balance');
          }
          
          if (isMountedRef.current) {
            console.log('Initial balance from blockchain:', blockchainResult.balance);
            setBalance(blockchainResult.balance);
            setLastUpdated(new Date());
          }
        }
      } catch (err: any) {
        console.error('Error fetching initial USDC balance:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error(err?.message || 'Failed to fetch USDC balance'));
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    // Set up Supabase real-time subscription
    const setupSubscription = () => {
      try {
        // Clear any existing subscription
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
        
        // Create new subscription to wallet balance changes
        subscriptionRef.current = UsdcBalanceService.subscribeToBalanceUpdates(
          TARGET_WALLET,
          (newBalance, updatedAt) => {
            if (isMountedRef.current) {
              console.log('Balance updated via subscription:', newBalance);
              setBalance(newBalance);
              setLastUpdated(updatedAt);
              setIsLoading(false);
            }
          }
        );
        
        console.log('Set up Supabase real-time subscription for balance updates');
      } catch (err) {
        console.error('Error setting up balance subscription:', err);
      }
    };
    
    // Fetch the initial balance
    fetchInitialBalance();
    
    // Set up the real-time subscription
    setupSubscription();
    
    // Periodically refresh the balance ONLY as a fallback (if enabled)
    if (refreshInterval > 0) {
      console.log(`Setting up fallback refresh every ${refreshInterval}ms`);
      const scheduleRefresh = () => {
        refreshTimeoutId = setTimeout(async () => {
          if (!isMountedRef.current) return;
          
          console.log('Performing fallback refresh...');
          await refreshBalanceInternal();
          
          // Schedule next refresh
          if (isMountedRef.current) {
            scheduleRefresh();
          }
        }, refreshInterval);
      };
      
      scheduleRefresh();
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up useUsdcBalance hook');
      isMountedRef.current = false;
      
      // Clear any pending timeout
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }
      
      // Unsubscribe from Supabase channel
      if (subscriptionRef.current) {
        console.log('Unsubscribing from Supabase real-time updates');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [refreshInterval]); // Only refreshInterval in deps, not isLoading

  // Internal refresh function that doesn't affect loading state
  const refreshBalanceInternal = async () => {
    try {
      // First try to get the balance from Supabase
      const supabaseResult = await UsdcBalanceService.getLatestBalance(TARGET_WALLET);
      
      if (supabaseResult.success && isMountedRef.current) {
        console.log('Refreshed balance from Supabase:', supabaseResult.balance);
        
        // For testing only: If balance is 0, set a mock balance
        const mockBalance = supabaseResult.balance === 0 ? 123.45678 : supabaseResult.balance;
        
        setBalance(mockBalance);
        setLastUpdated(supabaseResult.lastUpdated);
        setError(null);
        return true;
      } else {
        // Fall back to direct blockchain query
        console.log('Supabase refresh failed, fetching from blockchain...');
        const blockchainResult = await getUsdcBalance();
        
        if (!blockchainResult.success) {
          throw new Error(blockchainResult.error || 'Failed to fetch USDC balance');
        }
        
        if (isMountedRef.current) {
          console.log('Refreshed balance from blockchain:', blockchainResult.balance);
          setBalance(blockchainResult.balance);
          setLastUpdated(new Date());
          setError(null);
          return true;
        }
      }
    } catch (err: any) {
      console.error('Error refreshing USDC balance:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(err?.message || 'Failed to refresh USDC balance'));
      }
      return false;
    }
    
    return false;
  };

  // Public refresh function that shows loading state
  const refreshBalance = async () => {
    if (isLoading) return; // Prevent multiple simultaneous refreshes
    
    setIsLoading(true);
    await refreshBalanceInternal();
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  };

  return {
    balance,
    isLoading,
    error,
    lastUpdated,
    refreshBalance
  };
} 