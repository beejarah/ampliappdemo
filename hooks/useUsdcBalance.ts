import { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import UsdcBalanceService, { TARGET_WALLET } from '../utils/usdcBalanceService';
import getUsdcBalance from '../app/api/usdc-balance';
import { Alert } from 'react-native';
import { useAuth } from '../app/_layout';

// Static variables to help detect and prevent reload loops
// These are kept outside the hook to persist across component remounts
let LAST_HOOK_INIT_TIME = 0;
let HOOK_INIT_COUNT = 0;
let SUBSCRIPTION_ACTIVE = false;
const RELOAD_COUNT_THRESHOLD = 5; // Alert after this many rapid reinitializations
const RELOAD_TIME_WINDOW = 10000; // 10 seconds window to check for reload loops

// Track when the last balance update was performed
let LAST_BALANCE_UPDATE_TIME = 0;
const BALANCE_UPDATE_THROTTLE = 5000; // 5 seconds minimum between balance updates

// Track when interest was last synced to DB
let LAST_INTEREST_SYNC_TIME = 0;
const INTEREST_SYNC_THROTTLE = 10000; // 10 seconds minimum between DB syncs

// Global API throttling to prevent excessive calls
let RECENT_API_CALLS = 0;
let LAST_API_THROTTLE_RESET = 0;
const API_CALL_THRESHOLD = 10; // Maximum API calls allowed in window
const API_THROTTLE_WINDOW = 5000; // 5 second window for API throttling

// Static reference to the current global subscription
let GLOBAL_SUBSCRIPTION: RealtimeChannel | null = null;

/**
 * Helper function to check if API calls should be throttled
 */
function shouldThrottleApiCalls(): boolean {
  const now = Date.now();
  
  // Reset counter if outside the window
  if (now - LAST_API_THROTTLE_RESET > API_THROTTLE_WINDOW) {
    RECENT_API_CALLS = 0;
    LAST_API_THROTTLE_RESET = now;
    return false;
  }
  
  // Increment counter
  RECENT_API_CALLS++;
  
  // Check if we've exceeded the threshold
  if (RECENT_API_CALLS > API_CALL_THRESHOLD) {
    console.warn(`API call throttling active - exceeded ${API_CALL_THRESHOLD} calls in ${API_THROTTLE_WINDOW}ms window`);
    return true;
  }
  
  return false;
}

/**
 * Hook to fetch and monitor USDC balance and interest
 * Uses hybrid approach: PostgreSQL for source of truth, client-side updates for UI smoothness
 * 
 * @param refreshInterval - Optional interval for fallback refreshes in milliseconds. Set to 0 to disable polling.
 */
export function useUsdcBalance(refreshInterval = 0) {
  const { privateKey } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastWithdrawalTime, setLastWithdrawalTime] = useState<Date | null>(null);
  
  // Reference to track current interest value
  const accumulatedInterestRef = useRef<number>(0);
  
  // Track client-side calculation state
  const clientCalculationActiveRef = useRef<boolean>(false);
  const clientCalculationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hold the subscription reference to clean it up later
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef<boolean>(true);
  
  // Create a stable reference for functions
  const stablePrivateKey = useRef(privateKey);
  const stableRefreshInterval = useRef(refreshInterval);
  
  // Update the stable references when props change
  useEffect(() => {
    stablePrivateKey.current = privateKey;
  }, [privateKey]);
  
  useEffect(() => {
    stableRefreshInterval.current = refreshInterval;
  }, [refreshInterval]);
  
  // Function to start client-side interest calculation for UI updates
  const startClientInterestCalculation = useCallback((currentBalance: number) => {
    // First, ALWAYS clear any existing calculation
    if (clientCalculationIntervalRef.current) {
      clearInterval(clientCalculationIntervalRef.current);
      clientCalculationIntervalRef.current = null;
      clientCalculationActiveRef.current = false;
    }
    
    // CRITICAL: Check for zero or near-zero balance with strict threshold
    // Use a higher threshold (0.0001) to avoid floating point issues
    if (currentBalance <= 0.0001) {
      console.log('Balance is zero or near-zero - not starting interest calculation');
      return;
    }
    
    console.log(`Starting client-side interest calculation with balance: ${currentBalance}`);
    clientCalculationActiveRef.current = true;
    
    // Store the initial balance and interest
    const initialBalance = currentBalance;
    const startingInterest = accumulatedInterestRef.current;
    
    console.log(`Initial interest: ${startingInterest}, initial balance: ${initialBalance}`);
    
    // Calculate how much interest accrues per 0.5 seconds
    const calculateIncrement = () => {
      // 10% annual rate
      const annualRate = 0.10;
      const annualIncrease = initialBalance * annualRate;
      // Updates per year (2 updates per second * seconds in a year)
      const updatesPerYear = 2 * 60 * 60 * 24 * 365;
      // Increase per update
      return annualIncrease / updatesPerYear;
    };
    
    // Calculate increment once (it's constant based on initial balance)
    const increment = calculateIncrement();
    
    // Create a timer that updates every 500ms
    clientCalculationIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current || !clientCalculationActiveRef.current) {
        stopClientInterestCalculation();
        return;
      }
      
      // Use a functional update to ensure we're always working with latest state
      // This is critical - it's the React-recommended way to update state based on previous state
      setInterest(prevInterest => {
        // Calculate new interest value by adding increment to the ref value
        accumulatedInterestRef.current += increment;
        const newInterest = Number(accumulatedInterestRef.current.toFixed(8));
        
        // Only log occasionally to avoid performance impact
        if (Math.floor(accumulatedInterestRef.current * 1000) % 10 === 0) {
          console.log(`Interest now: ${newInterest}`);
        }
        
        return newInterest;
      });
    }, 500);
  }, [stopClientInterestCalculation]);
  
  // Function to stop client-side calculation
  const stopClientInterestCalculation = useCallback(() => {
    if (!clientCalculationActiveRef.current && !clientCalculationIntervalRef.current) {
      return;
    }
    
    console.log('Stopping client-side interest calculation');
    
    if (clientCalculationIntervalRef.current) {
      clearInterval(clientCalculationIntervalRef.current);
      clientCalculationIntervalRef.current = null;
    }
    
    clientCalculationActiveRef.current = false;
  }, []);
  
  // Load the last withdrawal timestamp - stabilized with useCallback
  const loadLastWithdrawalTimestamp = useCallback(async () => {
    try {
      const timestamp = await UsdcBalanceService.getLastWithdrawalTimestamp(TARGET_WALLET);
      if (timestamp) {
        console.log(`Last withdrawal occurred at: ${timestamp.toISOString()}`);
        if (isMountedRef.current) {
          setLastWithdrawalTime(timestamp);
        }
        return timestamp;
      }
      return null;
    } catch (error) {
      console.error('Error loading last withdrawal timestamp:', error);
      return null;
    }
  }, []);

  // Record a withdrawal event - stabilized with useCallback
  const recordWithdrawal = useCallback(async () => {
    try {
      // First stop interest calculation
      await stopClientInterestCalculation();
      
      const success = await UsdcBalanceService.recordWithdrawal(TARGET_WALLET);
      if (success) {
        // Update the local timestamp
        const now = new Date();
        if (isMountedRef.current) {
          setLastWithdrawalTime(now);
          
          // Let PostgreSQL handle interest resetting
          // No need to reset interest locally as it will be handled during the next refresh
          setBalance(0); // Update balance immediately for UI feedback
        }
        
        console.log('Withdrawal recorded successfully');
        return true;
      } else {
        console.error('Failed to record withdrawal');
        return false;
      }
    } catch (error) {
      console.error('Error recording withdrawal:', error);
      return false;
    }
  }, [stopClientInterestCalculation]);

  // Sync the client-calculated interest to PostgreSQL
  const syncInterestToDatabase = useCallback(async (force = false) => {
    // Don't sync too often unless forced
    const now = Date.now();
    if (!force && now - LAST_INTEREST_SYNC_TIME < INTEREST_SYNC_THROTTLE) {
      console.log(`Skipping interest sync - only ${Math.round((now - LAST_INTEREST_SYNC_TIME) / 1000)}s since last sync`);
      return false;
    }
    
    try {
      // ALWAYS get the latest balance from the database for reliability
      // Don't trust the React state which might be stale
      const result = await UsdcBalanceService.getLatestBalance(TARGET_WALLET);
      
      if (!result.success) {
        console.error('Failed to fetch balance data:', result.error);
        return false;
      }
      
      const dbBalance = result.balance;
      const pgInterest = result.interest;
      
      console.log(`Database values - Balance: ${dbBalance}, Interest: ${pgInterest}`);
      
      // CRITICAL: If database balance is zero, use PostgreSQL interest value
      if (dbBalance <= 0.0001) {
        console.log('Database balance is zero - using PostgreSQL interest value');
        accumulatedInterestRef.current = pgInterest;
        setInterest(pgInterest);
        
        LAST_INTEREST_SYNC_TIME = now;
        return true;
      }
      
      // Non-zero balance - handle normally
      const clientInterest = accumulatedInterestRef.current;
      
      console.log(`Interest comparison - Client: ${clientInterest}, PostgreSQL: ${pgInterest}`);
      
      // FIXED LOGIC: Always favor PostgreSQL as source of truth
      // Only keep client interest if significantly higher (>0.001 difference)
      if (pgInterest > clientInterest || Math.abs(pgInterest - clientInterest) < 0.001) {
        console.log(`Using PostgreSQL interest as source of truth: ${pgInterest}`);
        accumulatedInterestRef.current = pgInterest;
        setInterest(pgInterest);
      } else if (pgInterest < clientInterest) {
        // Only keep client interest if it's significantly higher
        const difference = clientInterest - pgInterest;
        if (difference > 0.001) {
          console.log(`Keeping client interest (${clientInterest}) as it's significantly higher than PostgreSQL (${pgInterest})`);
        } else {
          console.log(`Small difference detected, preferring PostgreSQL value: ${pgInterest}`);
          accumulatedInterestRef.current = pgInterest;
          setInterest(pgInterest);
        }
      }
      
      LAST_INTEREST_SYNC_TIME = now;
      return true;
    } catch (error) {
      console.error('Error syncing interest with database:', error);
      return false;
    }
  }, []);

  // Reset interest to zero - stabilized with useCallback
  const resetInterest = useCallback(async () => {
    try {
      const success = await UsdcBalanceService.resetInterest(TARGET_WALLET);
      if (success) {
        if (isMountedRef.current) {
          setInterest(0);
          accumulatedInterestRef.current = 0;
        }
        console.log('Interest reset successfully');
        return true;
      } else {
        console.error('Failed to reset interest');
        return false;
      }
    } catch (error) {
      console.error('Error resetting interest:', error);
      return false;
    }
  }, []);

  // Refresh balance and interest from Supabase
  const refreshBalance = useCallback(async (forceInterestReset = false) => {
    try {
      console.log('Refreshing balance and interest from Supabase...');
      
      // Show loading state
      setIsLoading(true);
      
      // Throttle rapid refreshes
      const now = Date.now();
      const timeSinceLastUpdate = now - LAST_BALANCE_UPDATE_TIME;
      if (!forceInterestReset && timeSinceLastUpdate < BALANCE_UPDATE_THROTTLE) {
        console.log(`Skipping update - only ${timeSinceLastUpdate}ms since last update`);
        setIsLoading(false);
        return { success: true };
      }
      
      LAST_BALANCE_UPDATE_TIME = now;
      
      // Store previous balance to detect zero to non-zero transitions
      const previousBalance = balance;
      
      // ALWAYS stop client-side calculation first to prevent race conditions
      stopClientInterestCalculation();
      
      // Get the latest balance and interest - this will trigger PostgreSQL interest calculation
      const result = await UsdcBalanceService.getLatestBalance(TARGET_WALLET);
      
      if (!result.success) {
        console.error('Failed to fetch balance:', result.error);
        setError(new Error(result.error));
        setIsLoading(false);
        return result;
      }
      
      // Store the fetched data
      const currentBalance = result.balance;
      const pgInterest = result.interest;
      
      console.log(`Fetched balance: ${currentBalance}, PostgreSQL interest: ${pgInterest}`);
      
      // Update balance in state
      if (isMountedRef.current) {
        // First update the balance state
        setBalance(currentBalance);
        setLastUpdated(result.lastUpdated);
        
        // Zero balance path - use PostgreSQL interest value
        if (currentBalance <= 0.0001 || forceInterestReset) {
          console.log(`Zero balance or interest reset forced - using PostgreSQL interest value: ${pgInterest}`);
          
          // Use PostgreSQL interest value directly
          accumulatedInterestRef.current = pgInterest;
          setInterest(pgInterest);
          
          // Only force interest reset if explicitly requested
          if (forceInterestReset) {
            console.log('Interest reset explicitly forced - resetting in database');
            await UsdcBalanceService.resetInterest(TARGET_WALLET);
          }
          
          // Never restart interest calculation for zero balance
        }
        // Non-zero balance path - normal interest handling
        else {
          console.log(`Non-zero balance (${currentBalance}) - normal interest handling`);
          
          // Always use the PostgreSQL interest directly without resetting
          // Even if coming from a zero balance state
          accumulatedInterestRef.current = result.interest;
          setInterest(result.interest);
          
          // Start interest calculation with the current balance
          startClientInterestCalculation(currentBalance);
        }
        
        // Store withdrawal timestamp if available
        if (result.lastWithdrawalTimestamp) {
          setLastWithdrawalTime(result.lastWithdrawalTimestamp);
        }
      }
      
      setIsLoading(false);
      return result;
    } catch (error) {
      console.error('Error refreshing balance:', error);
      setError(error instanceof Error ? error : new Error('Unknown error refreshing balance'));
      setIsLoading(false);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [startClientInterestCalculation, stopClientInterestCalculation]);

  // Set up the Supabase real-time subscription
  useEffect(() => {
    // Add a reload counter to detect and prevent reload loops
    console.log('useUsdcBalance hook initialized');
    
    const now = Date.now();
    const timeSinceLastInit = now - LAST_HOOK_INIT_TIME;
    LAST_HOOK_INIT_TIME = now;
    HOOK_INIT_COUNT++;
    
    if (timeSinceLastInit < RELOAD_TIME_WINDOW) {
      // If we're initializing the hook too frequently, it may indicate a reload loop
      if (HOOK_INIT_COUNT > RELOAD_COUNT_THRESHOLD) {
        console.warn(`Hook initialized ${HOOK_INIT_COUNT} times in ${timeSinceLastInit}ms - possible reload loop!`);
      }
    } else {
      // Reset the counter if we're outside the time window
      HOOK_INIT_COUNT = 1;
    }
    
    isMountedRef.current = true;
    
    // Initial data fetch
    const initialLoad = async () => {
      try {
        // Load last withdrawal timestamp
        await loadLastWithdrawalTimestamp();
        
        // Perform the initial balance refresh
        await refreshBalance();
      } catch (error) {
        console.error('Error during initial load:', error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    // Run the initial load
    initialLoad();
    
    // Set up real-time subscription only if it doesn't exist
    if (!SUBSCRIPTION_ACTIVE && subscriptionRef.current === null) {
      console.log('Creating new Supabase real-time subscription');
      
      // Create subscription to wallet balance updates
      const subscription = UsdcBalanceService.subscribeToBalanceUpdates(
        TARGET_WALLET,
        (newBalance, lastUpdated) => {
          // Skip updates if component is unmounted
          if (!isMountedRef.current) {
            console.log('Skip update - component unmounted');
            return;
          }
          
          if (shouldThrottleApiCalls()) {
            console.log('Throttling real-time update (too frequent)');
            return;
          }
          
          // Enhanced logging to help debug balance updates
          console.log(`Real-time: Balance updated to ${newBalance} at ${new Date().toISOString()}`);
          
          // Check if balance is zero or near-zero (using floating point safety threshold)
          const isZeroBalance = newBalance <= 0.0001;
          const wasZeroBalance = balance <= 0.0001;
          
          // Handle deposit case (zero to non-zero transition)
          if (wasZeroBalance && !isZeroBalance) {
            console.log('Real-time: Deposit detected after zero balance - NOT resetting interest');
          }
          
          // Special handling for zero balance
          if (isZeroBalance) {
            console.log('Real-time: Zero balance detected - using PostgreSQL interest value');
            // No need to manually reset interest here, let PostgreSQL handle it
            // The interest will be correctly retrieved in the syncAfterBalanceUpdate function
          }
          
          // Log and update the state directly with the real-time balance
          console.log(`Balance updated via subscription: ${newBalance}`);
          setBalance(newBalance);
          
          // Only update lastUpdated if we have a valid date
          if (lastUpdated) {
            setLastUpdated(lastUpdated);
          } else {
            setLastUpdated(new Date());
          }
          
          // Properly sync with database after a real-time balance update
          // We need to get the interest value and start/stop calculations
          const syncAfterBalanceUpdate = async () => {
            try {
              // Stop any existing interest calculation
              stopClientInterestCalculation();
              
              // Fetch full balance data including interest
              const result = await UsdcBalanceService.getLatestBalance(TARGET_WALLET);
              if (!result.success) {
                console.log('Failed to fetch complete data after real-time update');
                return;
              }
              
              console.log(`Refreshing with new balance ${result.balance} and interest ${result.interest}`);
              
              // Handle zero balance case - ensure interest is zero
              if (result.balance <= 0.0001) {
                console.log('Zero balance - using PostgreSQL interest value');
                // Use the PostgreSQL interest value directly - it should already be zero for withdrawals
                accumulatedInterestRef.current = result.interest;
                setInterest(result.interest);
              } 
              // Handle non-zero balance - start interest calculation
              else {
                console.log(`Non-zero balance (${result.balance}) - normal interest handling`);
                
                // Always use the PostgreSQL interest directly without resetting
                // Even if coming from a zero balance state
                accumulatedInterestRef.current = result.interest;
                setInterest(result.interest);
                
                // Start interest calculation with the current balance
                startClientInterestCalculation(result.balance);
              }
            } catch (error) {
              console.error('Error in syncAfterBalanceUpdate:', error);
            }
          };
          
          // Call the sync function
          syncAfterBalanceUpdate();
        }
      );
      
      // Store the subscription
      subscriptionRef.current = subscription;
      GLOBAL_SUBSCRIPTION = subscription;
      SUBSCRIPTION_ACTIVE = true;
      
      console.log('Set up Supabase real-time subscription for balance updates');
    } else {
      console.log('Reusing existing Supabase subscription');
    }
    
    // Set up AppState listener to sync interest when app goes to background
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App going to background, syncing interest...');
        
        if (isMountedRef.current) {
          if (typeof syncInterestToDatabase === 'function') {
            await syncInterestToDatabase(true);
          } else {
            console.log('syncInterestToDatabase not available, skipping sync');
          }
        }
      } else if (nextAppState === 'active') {
        // App is coming back into focus, refresh the balance and interest from PostgreSQL
        console.log('App returning to foreground, refreshing from PostgreSQL...');
        
        if (isMountedRef.current) {
          await refreshBalance();
        }
      }
    };
    
    // Try to add app state listener if available
    try {
      const { AppState } = require('react-native');
      AppState.addEventListener('change', handleAppStateChange);
    } catch (e) {
      console.log('AppState not available, skipping listener setup');
    }
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      
      // Stop the client-side interest calculation
      if (clientCalculationIntervalRef.current) {
        clearInterval(clientCalculationIntervalRef.current);
        clientCalculationIntervalRef.current = null;
        clientCalculationActiveRef.current = false;
      }
      
      // Try to remove app state listener if available
      try {
        const { AppState } = require('react-native');
        // @ts-ignore - Clean up the listener
        AppState.removeEventListener('change', handleAppStateChange);
      } catch (e) {
        // Ignore errors
      }
      
      // Don't actually unsubscribe from real-time updates to avoid rapid connect/disconnect
      // This subscription will be reused across component remounts
      console.log('useUsdcBalance cleanup - marking as unmounted');
    };
  }, [loadLastWithdrawalTimestamp, refreshBalance, startClientInterestCalculation, syncInterestToDatabase]);

  // If refresh interval is set, poll for updates
  useEffect(() => {
    if (refreshInterval <= 0) return;
    
    console.log(`Setting up polling every ${refreshInterval}ms`);
    
    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        console.log('Polling for updates...');
        refreshBalance().catch(err => {
          console.error('Error during polling refresh:', err);
        });
      }
    }, refreshInterval);
    
    return () => {
      clearInterval(intervalId);
      console.log('Polling cleanup');
    };
  }, [refreshInterval, refreshBalance]);

  // Return values and functions from the hook
  return {
    balance,
    interest,
    isLoading,
    error,
    lastUpdated,
    refreshBalance,
    resetInterest,
    registerWithdrawal: recordWithdrawal,
    syncInterestToDatabase,
    accumulatedInterestRef
  };
} 