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

// Static reference to the current global subscription
let GLOBAL_SUBSCRIPTION: RealtimeChannel | null = null;

/**
 * Hook to fetch and monitor USDC balance using a hybrid approach:
 * - Initial interest is loaded from the database (accumulated while app was closed)
 * - Real-time interest updates are calculated on the client while the app is running
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
  
  // Track accumulated interest for client-side calculation
  const accumulatedInterestRef = useRef<number>(0);
  
  // Track app session start time
  const sessionStartTimeRef = useRef<Date>(new Date());
  
  // Track time of last database sync to limit frequency
  const lastDatabaseSyncRef = useRef<Date>(new Date());
  
  // Minimum time between database syncs (15 minutes instead of 5)
  const MIN_SYNC_INTERVAL_MS = 15 * 60 * 1000;
  
  // Hold the subscription reference to clean it up later
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef<boolean>(true);
  
  // Track if client-side calculation is active
  const clientCalculationActiveRef = useRef<boolean>(false);
  const clientCalculationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Define startClientInterestCalculation as a stable function with useCallback
  const startClientInterestCalculation = useCallback((currentBalance: number) => {
    if (clientCalculationActiveRef.current) {
      // Already running
      return;
    }
    
    console.log('Starting client-side interest calculation...');
    clientCalculationActiveRef.current = true;
    
    const calculateIncrement = (balance: number) => {
      // Restore original 10% annual rate
      const annualRate = 0.10;
      
      // Calculate how much the balance should increase per update
      // for a 10% annual increase
      const annualIncrease = balance * annualRate;
      
      // Updates per year (2 updates per second * seconds in a year)
      // Restore original 2 updates per second
      const updatesPerYear = 2 * 60 * 60 * 24 * 365;
      
      // Increase per update
      return annualIncrease / updatesPerYear;
    };
    
    clientCalculationIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (clientCalculationIntervalRef.current) {
          clearInterval(clientCalculationIntervalRef.current);
          clientCalculationIntervalRef.current = null;
          clientCalculationActiveRef.current = false;
        }
        return;
      }
      
      // Calculate the exact increment for the current balance
      // to achieve exactly 10% annual growth
      const increment = calculateIncrement(currentBalance);
      
      // Accumulate interest
      accumulatedInterestRef.current += increment;
      
      // Update the interest value state, ensuring precision
      // Keep only the 8 decimal formatting for display consistency
      setInterest(Number(accumulatedInterestRef.current.toFixed(8)));
    }, 500); // Restore original 0.5 seconds interval
  }, []);
  
  // Function to stop client-side calculation - stabilized with useCallback
  const stopClientInterestCalculation = useCallback(async (forceDatabaseSync = false) => {
    if (!clientCalculationActiveRef.current) {
      return;
    }
    
    console.log('Stopping client-side interest calculation...');
    
    if (clientCalculationIntervalRef.current) {
      clearInterval(clientCalculationIntervalRef.current);
      clientCalculationIntervalRef.current = null;
    }
    
    clientCalculationActiveRef.current = false;
    
    // Only sync back to database if forced or it's been long enough since the last sync
    if (!isMountedRef.current) {
      console.log('Component unmounted, skipping database sync');
      return;
    }
    
    const now = new Date();
    const timeSinceLastSync = now.getTime() - lastDatabaseSyncRef.current.getTime();
    
    if (forceDatabaseSync || timeSinceLastSync > MIN_SYNC_INTERVAL_MS) {
      // Sync the accumulated interest back to the database
      try {
        console.log('Syncing client-calculated interest to database...');
        await UsdcBalanceService.syncInterest(TARGET_WALLET, accumulatedInterestRef.current);
        lastDatabaseSyncRef.current = now;
      } catch (error) {
        console.error('Failed to sync interest to database:', error);
      }
    } else {
      console.log(`Skipping database sync - only ${Math.round(timeSinceLastSync / 1000)}s since last sync`);
    }
  }, []);

  // Load the last withdrawal timestamp - stabilized with useCallback
  const loadLastWithdrawalTimestamp = useCallback(async () => {
    try {
      const timestamp = await UsdcBalanceService.getLastWithdrawalTimestamp(TARGET_WALLET);
      if (timestamp) {
        console.log(`[WITHDRAWAL TRACKING] Last withdrawal occurred at: ${timestamp.toISOString()}`);
        if (isMountedRef.current) {
          setLastWithdrawalTime(timestamp);
        }
        return timestamp;
      }
      return null;
    } catch (error) {
      console.error('[WITHDRAWAL TRACKING] Error loading last withdrawal timestamp:', error);
      return null;
    }
  }, []);

  // Record a withdrawal event - stabilized with useCallback
  const recordWithdrawal = useCallback(async () => {
    try {
      const success = await UsdcBalanceService.recordWithdrawal(TARGET_WALLET);
      if (success) {
        // Update the local timestamp
        const now = new Date();
        if (isMountedRef.current) {
          setLastWithdrawalTime(now);
          
          // Reset interest locally
          setInterest(0);
          accumulatedInterestRef.current = 0;
        }
        
        console.log('[WITHDRAWAL TRACKING] Withdrawal recorded successfully');
        return true;
      } else {
        console.error('[WITHDRAWAL TRACKING] Failed to record withdrawal');
        return false;
      }
    } catch (error) {
      console.error('[WITHDRAWAL TRACKING] Error recording withdrawal:', error);
      return false;
    }
  }, []);

  // Check if interest should be reset based on withdrawal history - memoized to avoid recreating on every render
  const shouldResetInterestDueToWithdrawal = useCallback((dbInterest: number) => {
    if (!lastWithdrawalTime) return false;
    
    const now = new Date();
    const timeSinceWithdrawal = now.getTime() - lastWithdrawalTime.getTime();
    
    // If we have database interest that's higher than what could have accumulated since withdrawal
    // or if the withdrawal happened after we started accumulating, reset
    if (dbInterest > 0) {
      // Calculate roughly how much interest could have accrued since the withdrawal
      const hoursSinceWithdrawal = timeSinceWithdrawal / (1000 * 60 * 60);
      const annualRate = 0.10; // 10%
      const dailyRate = annualRate / 365;
      const hourlyRate = dailyRate / 24;
      
      // Rough calculation of max possible interest since withdrawal
      const maxPossibleInterest = balance * hourlyRate * hoursSinceWithdrawal;
      
      console.log(`[WITHDRAWAL TRACKING] Hours since withdrawal: ${hoursSinceWithdrawal}`);
      console.log(`[WITHDRAWAL TRACKING] Max possible interest since withdrawal: ${maxPossibleInterest}`);
      console.log(`[WITHDRAWAL TRACKING] Database interest: ${dbInterest}`);
      
      // If database interest is more than possible, reset
      if (dbInterest > maxPossibleInterest) {
        console.log('[WITHDRAWAL TRACKING] Interest is higher than possible - resetting');
        return true;
      }
      
      // If withdrawal happened after session start, also reset
      if (lastWithdrawalTime > sessionStartTimeRef.current) {
        console.log('[WITHDRAWAL TRACKING] Withdrawal occurred after session start - resetting');
        return true;
      }
    }
    
    return false;
  }, [lastWithdrawalTime, balance]);

  // Set up the Supabase real-time subscription only once
  useEffect(() => {
    // Add a reload counter to detect and prevent reload loops
    console.log('useUsdcBalance hook initialized');
    const startTime = Date.now();
    HOOK_INIT_COUNT++;
    
    // Check for reload loops
    if (startTime - LAST_HOOK_INIT_TIME < RELOAD_TIME_WINDOW) {
      // If we've reinitialized too many times in a short period, log a warning
      if (HOOK_INIT_COUNT > RELOAD_COUNT_THRESHOLD) {
        console.warn(`Possible reload loop detected - hook initialized ${HOOK_INIT_COUNT} times in ${(startTime - LAST_HOOK_INIT_TIME) / 1000}s`);
        
        // If we detect a reload loop, wait a bit before continuing
        // This helps break the loop
        if (HOOK_INIT_COUNT > RELOAD_COUNT_THRESHOLD * 2) {
          console.error(`Severe reload loop detected (${HOOK_INIT_COUNT} reinits) - adding delay to break cycle`);
          // Only set loading without doing any actual work
          // Return early but provide a cleanup function
          return () => {
            console.log(`Early cleanup of useUsdcBalance due to reload loop detection`);
          };
        }
      }
    } else {
      // Reset counter if we're outside the time window
      HOOK_INIT_COUNT = 1;
    }
    
    LAST_HOOK_INIT_TIME = startTime;
    
    let refreshTimeoutId: NodeJS.Timeout | null = null;
    isMountedRef.current = true;
    sessionStartTimeRef.current = new Date();
    lastDatabaseSyncRef.current = new Date();

    // Initial fetch of balance from Supabase/blockchain
    const fetchInitialBalance = async () => {
      if (!isMountedRef.current) return;
      
      try {
        console.log('Fetching initial balance and server-calculated interest...');
        
        // IMPORTANT: First, check for the last withdrawal timestamp
        const lastWithdrawal = await loadLastWithdrawalTimestamp();
        
        // First try to get the balance from Supabase with server-calculated interest
        const supabaseResult = await UsdcBalanceService.getLatestBalance(TARGET_WALLET);
        
        if (!isMountedRef.current) return;
        
        if (supabaseResult.success) {
          console.log('Initial balance from Supabase:', supabaseResult.balance);
          console.log('Initial server-calculated interest:', supabaseResult.interest);
          
          // IMPORTANT: Check if we should reset interest due to a recent withdrawal
          const shouldReset = shouldResetInterestDueToWithdrawal(supabaseResult.interest);
          
          // IMPORTANT: Reset interest calculation when initial interest is 0 or very small
          // OR if there was a recent withdrawal
          if (supabaseResult.interest === 0 || supabaseResult.interest < 0.000001 || shouldReset) {
            console.log('Initial interest is zero, negligible, or reset needed - ensuring client-side accumulator is reset');
            
            // If should reset due to withdrawal but database interest isn't zero, reset it
            if (shouldReset && supabaseResult.interest > 0.000001) {
              console.log('[WITHDRAWAL TRACKING] Resetting database interest due to withdrawal history');
              await UsdcBalanceService.resetInterest(TARGET_WALLET);
            }
            
            if (isMountedRef.current) {
              setInterest(0);
              accumulatedInterestRef.current = 0;
            }
          } else {
            // Only set interest if there's a meaningful value in the database
            const initialInterest = supabaseResult.interest || 0;
            if (isMountedRef.current) {
              setInterest(initialInterest);
              
              // Initialize the accumulated interest ref with the server value
              accumulatedInterestRef.current = initialInterest;
            }
          }
          
          // Check if the balance is zero - if so, reset interest to zero
          if (supabaseResult.balance === 0) {
            console.log('Initial wallet balance is zero, resetting interest to zero');
            
            if (isMountedRef.current) {
              setInterest(0);
              accumulatedInterestRef.current = 0;
            }
            
            // Also reset interest in the database if it's not already zero
            if (supabaseResult.interest > 0) {
              try {
                await UsdcBalanceService.resetInterest(TARGET_WALLET);
                console.log('Successfully reset interest in database due to zero balance');
              } catch (resetError) {
                console.error('Failed to reset interest in database:', resetError);
              }
            }
          }
          
          // Set the balance from Supabase
          if (isMountedRef.current) {
            setBalance(supabaseResult.balance);
            setLastUpdated(supabaseResult.lastUpdated);
            
            // Start client-side interest calculation now that we have the initial values
            startClientInterestCalculation(supabaseResult.balance);
          }
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
            
            // If blockchain balance is zero, ensure interest is zero
            if (blockchainResult.balance === 0) {
              console.log('Initial blockchain balance is zero, ensuring interest is zero');
              setInterest(0);
              accumulatedInterestRef.current = 0;
              
              // Also reset in database
              try {
                await UsdcBalanceService.resetInterest(TARGET_WALLET);
                console.log('Successfully reset interest in database due to zero blockchain balance');
              } catch (resetError) {
                console.error('Failed to reset interest in database:', resetError);
              }
            } else {
              // We won't have interest from blockchain, so keep at 0 or fetch from database
              setInterest(0);
              accumulatedInterestRef.current = 0;
            }
            
            setLastUpdated(new Date());
            
            // Start client-side interest calculation with blockchain balance
            startClientInterestCalculation(blockchainResult.balance);
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
    
    // Add debouncing to prevent excessive calls
    let setupTimeoutId: NodeJS.Timeout | null = null;
    let initialFetchTimeoutId: NodeJS.Timeout | null = null;
    
    // Setup a global subscription - only create it once per app session, not on every hook instance
    const setupSubscription = () => {
      // If there's already a global subscription active, just use it
      if (GLOBAL_SUBSCRIPTION && SUBSCRIPTION_ACTIVE) {
        console.log('Reusing existing global subscription');
        subscriptionRef.current = GLOBAL_SUBSCRIPTION;
        return;
      }
      
      try {
        // Clear any existing subscription
        if (GLOBAL_SUBSCRIPTION) {
          console.log('Cleaning up previous global subscription before creating a new one');
          GLOBAL_SUBSCRIPTION.unsubscribe();
          GLOBAL_SUBSCRIPTION = null;
          SUBSCRIPTION_ACTIVE = false;
        }
        
        // Create new subscription to wallet balance changes
        console.log('Creating new Supabase real-time subscription');
        GLOBAL_SUBSCRIPTION = UsdcBalanceService.subscribeToBalanceUpdates(
          TARGET_WALLET,
          async (newBalance, updatedAt) => {
            if (!isMountedRef.current) {
              console.log('Received balance update but component unmounted - ignoring');
              return;
            }
            
            console.log('Balance updated via subscription:', newBalance);
            
            // Track the old balance to check for significant changes
            const oldBalance = balance;
            
            // Stop current calculation and force sync to database since balance changed
            await stopClientInterestCalculation(true); 
            
            if (!isMountedRef.current) return;
            
            // Update balance state
            setBalance(newBalance);
            setLastUpdated(updatedAt);
            
            // IMPORTANT: If balance is zero, immediately reset interest to zero
            if (newBalance === 0) {
              console.log('Balance is now zero - immediately resetting interest to zero');
              accumulatedInterestRef.current = 0;
              setInterest(0);
              
              // Also reset interest in the database
              try {
                await UsdcBalanceService.resetInterest(TARGET_WALLET);
                console.log('Successfully reset interest in database due to zero balance');
              } catch (resetError) {
                console.error('Failed to reset interest in database:', resetError);
              }
              
              // Don't restart interest calculation since balance is zero
              setIsLoading(false);
              return;
            }
            
            // IMPORTANT: If balance changed significantly (more than 1%), reset interest
            // This helps prevent continuing with old interest after withdrawals/deposits
            if (Math.abs(newBalance - oldBalance) > (oldBalance * 0.01)) {
              console.log('Balance changed significantly, resetting interest calculation');
              
              // IMPORTANT: Check if this might be a withdrawal
              // If balance decreased significantly, treat it as a withdrawal and record it
              if (newBalance < oldBalance && (oldBalance - newBalance) > 0.1) {
                console.log('[WITHDRAWAL TRACKING] Detected significant balance decrease - likely a withdrawal');
                await recordWithdrawal();
              }
              
              if (!isMountedRef.current) return;
              
              // First check the database interest value
              try {
                const currentInterest = await UsdcBalanceService.getLatestBalance(TARGET_WALLET);
                
                if (!isMountedRef.current) return;
                
                // If database has zero or very small interest, reset the client-side too
                if (!currentInterest.success || currentInterest.interest === 0 || currentInterest.interest < 0.000001) {
                  console.log('Database interest is zero or missing, resetting client-side interest');
                  accumulatedInterestRef.current = 0;
                  setInterest(0);
                } else {
                  // Otherwise use the database value
                  console.log('Using database interest value:', currentInterest.interest);
                  accumulatedInterestRef.current = currentInterest.interest;
                  setInterest(currentInterest.interest);
                }
              } catch (error) {
                console.error('Error checking database interest, resetting to be safe:', error);
                if (isMountedRef.current) {
                  accumulatedInterestRef.current = 0;
                  setInterest(0);
                }
              }
            }
            
            // Restart client-side calculation with new balance
            if (isMountedRef.current) {
              startClientInterestCalculation(newBalance);
              setIsLoading(false);
            }
          }
        );
        
        // Set the reference
        subscriptionRef.current = GLOBAL_SUBSCRIPTION;
        SUBSCRIPTION_ACTIVE = true;
        
        console.log('Set up Supabase real-time subscription for balance updates');
      } catch (err) {
        console.error('Error setting up balance subscription:', err);
      }
    };
    
    // Fetch the initial balance with a small delay to prevent rapid cycling
    initialFetchTimeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        fetchInitialBalance().catch(err => {
          console.error('Error in fetchInitialBalance:', err);
        });
      }
    }, 500); // Increased delay to help prevent reload loops
    
    // Set up the real-time subscription with a delay
    setupTimeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setupSubscription();
      }
    }, 1500); // Increased delay to help prevent reload loops
    
    // Periodically refresh the balance ONLY as a fallback (if enabled)
    if (stableRefreshInterval.current > 0) {
      console.log(`Setting up fallback refresh every ${stableRefreshInterval.current}ms`);
      const scheduleRefresh = () => {
        refreshTimeoutId = setTimeout(async () => {
          if (!isMountedRef.current) return;
          
          console.log('Performing fallback refresh...');
          await refreshBalanceInternal();
          
          // Schedule next refresh
          if (isMountedRef.current) {
            scheduleRefresh();
          }
        }, stableRefreshInterval.current);
      };
      
      // Delay the first refresh to avoid conflicts with initial fetch
      setTimeout(() => {
        if (isMountedRef.current) {
          scheduleRefresh();
        }
      }, stableRefreshInterval.current + 2000);
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up useUsdcBalance hook');
      
      // Mark as unmounted first to prevent any new operations
      isMountedRef.current = false;
      
      // Clear all timeouts to prevent memory leaks
      if (initialFetchTimeoutId) clearTimeout(initialFetchTimeoutId);
      if (setupTimeoutId) clearTimeout(setupTimeoutId);
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
      
      // Sync interest to database before unmounting (force sync on unmount)
      stopClientInterestCalculation(true).catch(err => {
        console.error('Error stopping client calculation during cleanup:', err);
      });
      
      // Note that we don't unsubscribe the global subscription as it may be used by other components
      // We just clear our reference
      subscriptionRef.current = null;
    };
  }, []); // Empty dependency array - IMPORTANT: all needed functions are defined with useCallback!

  // Internal refresh function that doesn't affect loading state
  const refreshBalanceInternal = useCallback(async () => {
    try {
      // First, sync any accumulated client-side interest to the database if needed
      // We'll force a sync on explicit refresh requests
      if (clientCalculationActiveRef.current) {
        await stopClientInterestCalculation(true);
      }
      
      if (!isMountedRef.current) return false;
      
      // Check if there's been a withdrawal since the last refresh
      await loadLastWithdrawalTimestamp();
      
      if (!isMountedRef.current) return false;
      
      // Just update the balance state - we'll use the current client-side interest
      // This avoids unnecessary database calls for interest calculation
      const blockchainResult = await getUsdcBalance();
      
      if (!isMountedRef.current) return false;
      
      if (blockchainResult.success) {
        console.log('Refreshed balance from blockchain:', blockchainResult.balance);
        const newBalance = blockchainResult.balance;
        
        // IMPORTANT: Check if this might be a withdrawal
        // If balance decreased significantly, treat it as a withdrawal and record it
        if (balance > 0 && newBalance < balance && (balance - newBalance) > 0.1) {
          console.log('[WITHDRAWAL TRACKING] Detected significant balance decrease on refresh - likely a withdrawal');
          await recordWithdrawal();
        }
        
        if (!isMountedRef.current) return false;
        
        setBalance(newBalance);
        setLastUpdated(new Date());
        setError(null);
        
        // IMPORTANT: If the wallet balance is zero, also zero out the interest
        if (newBalance === 0) {
          console.log('Wallet balance is zero, resetting interest to zero');
          setInterest(0);
          accumulatedInterestRef.current = 0;
          
          // Also reset interest in the database
          try {
            await UsdcBalanceService.resetInterest(TARGET_WALLET);
            console.log('Successfully reset interest in database due to zero balance');
            
            // Return early - don't restart interest calculation for zero balance
            return true;
          } catch (resetError) {
            console.error('Failed to reset interest in database:', resetError);
          }
        }
        
        // Restart client-side calculation with the new balance
        startClientInterestCalculation(newBalance);
        
        return true;
      } else {
        throw new Error(blockchainResult.error || 'Failed to fetch USDC balance');
      }
    } catch (err: any) {
      console.error('Error refreshing USDC balance:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(err?.message || 'Failed to refresh USDC balance'));
      }
      return false;
    }
  }, [balance, loadLastWithdrawalTimestamp, recordWithdrawal, startClientInterestCalculation, stopClientInterestCalculation]);

  // Public refresh function that shows loading state
  const refreshBalance = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous refreshes
    
    setIsLoading(true);
    await refreshBalanceInternal();
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  }, [isLoading, refreshBalanceInternal]);

  // Add a function to manually sync interest back to the database
  // This will be used when the app goes to background/inactive
  const syncInterestToDatabase = useCallback(async (force = true) => {
    if (!isMountedRef.current) {
      console.log('[INTEREST DEBUG] Not syncing - component not mounted');
      return false;
    }
    
    if (!clientCalculationActiveRef.current && !force) {
      console.log('[INTEREST DEBUG] Not syncing - client calculation not active and not forced');
      return false;
    }
    
    // Check if we should actually sync based on time since last sync
    const now = new Date();
    const timeSinceLastSync = now.getTime() - lastDatabaseSyncRef.current.getTime();
    
    if (!force && timeSinceLastSync < MIN_SYNC_INTERVAL_MS) {
      console.log(`[INTEREST DEBUG] Skipping requested sync - only ${Math.round(timeSinceLastSync / 1000)}s since last sync`);
      return false;
    }
    
    // Get the current interest value to sync
    const currentInterest = accumulatedInterestRef.current;
    console.log(`[INTEREST DEBUG] Current interest value to sync: ${currentInterest}`);
    
    // Don't sync if interest is exactly zero and not forced
    if (currentInterest === 0 && !force) {
      console.log('[INTEREST DEBUG] Interest is zero - not syncing to database');
      return true;
    }
    
    console.log('[INTEREST DEBUG] Starting database sync...');
    try {
      // Check current database value
      const dbResult = await UsdcBalanceService.getLatestBalance(TARGET_WALLET);
      
      if (!isMountedRef.current) return false;
      
      if (dbResult.success) {
        console.log(`[INTEREST DEBUG] Current database interest value: ${dbResult.interest}`);
        
        // If database interest is significantly different, log a warning
        if (Math.abs(dbResult.interest - currentInterest) > 0.01) {
          console.warn(`[INTEREST DEBUG] Large difference between client (${currentInterest}) and database (${dbResult.interest}) interest values`);
          
          // IMPORTANT: Check for recent withdrawals that might explain the discrepancy
          await loadLastWithdrawalTimestamp();
          if (lastWithdrawalTime) {
            const timeSinceWithdrawal = now.getTime() - lastWithdrawalTime.getTime();
            if (timeSinceWithdrawal < 60 * 60 * 1000) { // less than 1 hour
              console.log('[WITHDRAWAL TRACKING] Recent withdrawal detected, using client-side interest');
            } else {
              console.log('[WITHDRAWAL TRACKING] No recent withdrawal, investigating discrepancy');
              
              // If db interest is higher than what we can calculate, something's wrong - use the lower value
              if (dbResult.interest > currentInterest) {
                if (await shouldResetInterestDueToWithdrawal(dbResult.interest)) {
                  console.log('[WITHDRAWAL TRACKING] Resetting interest due to withdrawal history analysis');
                  await UsdcBalanceService.resetInterest(TARGET_WALLET);
                  
                  if (!isMountedRef.current) return false;
                  
                  accumulatedInterestRef.current = 0;
                  setInterest(0);
                  return true;
                }
              }
            }
          }
        }
      }
      
      // Throttle database updates for non-forced syncs
      if (!force) {
        const now = Date.now();
        if (now - LAST_INTEREST_SYNC_TIME < INTEREST_SYNC_THROTTLE) {
          console.log(`[INTEREST DEBUG] Throttling database sync - last sync was ${(now - LAST_INTEREST_SYNC_TIME) / 1000}s ago`);
          return false;
        }
        LAST_INTEREST_SYNC_TIME = now;
      }
      
      // Perform the sync
      const syncResult = await UsdcBalanceService.syncInterest(TARGET_WALLET, currentInterest);
      lastDatabaseSyncRef.current = now;
      
      if (syncResult) {
        console.log('[INTEREST DEBUG] Interest sync successful');
      } else {
        console.error('[INTEREST DEBUG] Interest sync failed');
      }
      
      return syncResult;
    } catch (error) {
      console.error('[INTEREST DEBUG] Failed to sync interest to database:', error);
      return false;
    }
  }, [lastWithdrawalTime, loadLastWithdrawalTimestamp, shouldResetInterestDueToWithdrawal]);
  
  // Utility function to manually reset interest
  const resetInterest = useCallback(async () => {
    console.log('Manually resetting interest...');
    
    // Stop interest calculation if it's running
    if (clientCalculationActiveRef.current) {
      if (clientCalculationIntervalRef.current) {
        clearInterval(clientCalculationIntervalRef.current);
        clientCalculationIntervalRef.current = null;
      }
      clientCalculationActiveRef.current = false;
    }
    
    // Reset local interest value
    if (isMountedRef.current) {
      setInterest(0);
      accumulatedInterestRef.current = 0;
    }
    
    // Also record this as a withdrawal event to update the last withdrawal timestamp
    try {
      const withdrawalRecorded = await recordWithdrawal();
      if (!withdrawalRecorded) {
        console.warn('[WITHDRAWAL TRACKING] Failed to record withdrawal during interest reset');
        
        // Still try to reset interest in the database even if recording withdrawal failed
        try {
          const success = await UsdcBalanceService.resetInterest(TARGET_WALLET);
          if (success) {
            console.log('Successfully reset interest in database');
          } else {
            console.error('Failed to reset interest in database');
            Alert.alert('Error', 'Failed to reset interest in database. Please try again.');
            return false;
          }
        } catch (error) {
          console.error('Error resetting interest:', error);
          Alert.alert('Error', 'An error occurred while resetting interest.');
          return false;
        }
      } else {
        console.log('[WITHDRAWAL TRACKING] Successfully recorded withdrawal during interest reset');
      }
      
      // Restart interest calculation with current balance
      if (isMountedRef.current) {
        startClientInterestCalculation(balance);
      }
      
      return true;
    } catch (error) {
      console.error('[WITHDRAWAL TRACKING] Error during interest reset:', error);
      
      // Still restart interest calculation with current balance
      if (isMountedRef.current) {
        startClientInterestCalculation(balance);
      }
      
      Alert.alert('Warning', 'Interest reset may not have been fully recorded. Please try again.');
      return false;
    }
  }, [balance, recordWithdrawal, startClientInterestCalculation]);

  // Function to manually trigger a withdrawal event (for the withdrawal button)
  const registerWithdrawal = useCallback(async () => {
    try {
      const success = await recordWithdrawal();
      if (success) {
        console.log('[WITHDRAWAL TRACKING] Withdrawal registered successfully');
        
        // Reset interest calculation
        if (isMountedRef.current) {
          setInterest(0);
          accumulatedInterestRef.current = 0;
        }
        
        // Restart interest calculation
        if (clientCalculationActiveRef.current) {
          if (clientCalculationIntervalRef.current) {
            clearInterval(clientCalculationIntervalRef.current);
            clientCalculationIntervalRef.current = null;
          }
          clientCalculationActiveRef.current = false;
        }
        
        if (isMountedRef.current) {
          startClientInterestCalculation(balance);
        }
        
        return true;
      } else {
        console.error('[WITHDRAWAL TRACKING] Failed to register withdrawal');
        return false;
      }
    } catch (error) {
      console.error('[WITHDRAWAL TRACKING] Error registering withdrawal:', error);
      return false;
    }
  }, [balance, recordWithdrawal, startClientInterestCalculation]);

  return {
    balance,
    interest,
    isLoading,
    error,
    lastUpdated,
    lastWithdrawalTime,
    refreshBalance,
    syncInterestToDatabase,
    resetInterest,
    registerWithdrawal,
    accumulatedInterestRef
  };
} 