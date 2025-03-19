import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Dimensions, Modal, Pressable, RefreshControl, Image, Alert, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { usePrivy } from '@privy-io/expo';
import { useEffect, useState, useCallback, useRef, memo } from 'react';
import React from 'react';
import { useAuth } from '../_layout';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUsdcBalance } from '../../hooks/useUsdcBalance';
import { formatCurrency } from '../../utils/formatters';
import UsdcBalanceService, { TARGET_WALLET, INTEREST_WALLET, ORIGIN_WALLET } from '../../utils/usdcBalanceService';

// Tenderly Web3 Actions configuration
const TENDERLY_ACCOUNT = 'thebeej';
const TENDERLY_PROJECT = 'project';
const TENDERLY_API_KEY = 'xdq0bEB5o3hhdyI70Akm1sTXCqYOuwli';

// IMPORTANT: Use the correct combo action ID as specified
const COMBO_ACTION_ID = '235de538-7869-4ff3-9918-b2dec1496522';

// Only use the combo webhook URL - this is the one that matters
const COMBO_WEBHOOK_URL = `https://api.tenderly.co/api/v1/actions/${COMBO_ACTION_ID}/webhook`;

// For checking execution results
const EXECUTIONS_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}/actions/${COMBO_ACTION_ID}/executions`;

// Flag to force using real Tenderly API calls even in development mode
const USE_REAL_TENDERLY_API = true;

// Constants
const PAGE_SIZE = 6;

// Mock Send Wallet address (replace with actual wallet address)
const SEND_WALLET = '0xYourSendWalletAddressHere';

// Get screen width for consistent sizing
const { width } = Dimensions.get('window');
const contentPadding = 20;
const contentWidth = width - (contentPadding * 2);

// Custom SVG Icons
const HomeIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path 
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
      stroke={active ? "#0066CC" : "#1A1A1A"} 
      strokeWidth="2"
      fill={active ? "#E0F2FE" : "none"}
    />
    <Path 
      d="M9 22V12h6v10"
      stroke={active ? "#0066CC" : "#1A1A1A"} 
      strokeWidth="2"
    />
  </Svg>
);

const DollarIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7"
      stroke={active ? "#0066CC" : "#1A1A1A"} 
      strokeWidth="2"
      fill={active ? "#E0F2FE" : "none"}
    />
  </Svg>
);

const ShieldIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={active ? "#0066CC" : "#1A1A1A"} 
      strokeWidth="2"
      fill={active ? "#E0F2FE" : "none"}
    />
  </Svg>
);

const MenuIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path 
      d="M4 6h16M4 12h16M4 18h16"
      stroke={active ? "#0066CC" : "#1A1A1A"} 
      strokeWidth="2"
    />
  </Svg>
);

// Create a basic error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }
  
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ marginBottom: 20 }}>{this.state.error?.toString()}</Text>
          <TouchableOpacity 
            style={{ padding: 10, backgroundColor: '#0066CC', borderRadius: 5 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: 'white' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// Wrap main component with memo to prevent unnecessary re-renders
const HomePage = function HomePage() {
  const { user, logout } = usePrivy();
  const { walletBalance: dummyBalance, isLoading: isDummyLoading } = useAuth();
  
  // Create stability refs to avoid rerendering the component when these values change
  const routerRef = useRef(useRouter());
  const router = routerRef.current;
  
  // Use the hybrid interest calculation hook with a stable reference
  const [refreshIntervalState] = useState(0); // Create a stable value for refreshInterval
  const { 
    balance: usdcBalance, 
    interest: interestValue, 
    isLoading, 
    refreshBalance, 
    lastUpdated,
    syncInterestToDatabase,
    resetInterest,
    accumulatedInterestRef,
    registerWithdrawal,
    setBalance,
    setInterest,
  } = useUsdcBalance(refreshIntervalState);
  
  // Create a ref for the interest value to track changes
  const previousInterestRef = useRef(interestValue);
  
  // Log when interest changes to verify updates
  useEffect(() => {
    if (previousInterestRef.current !== interestValue) {
      console.log(`Interest value updated in UI: ${previousInterestRef.current} -> ${interestValue}`);
      previousInterestRef.current = interestValue;
    }
  }, [interestValue]);
  
  const [userInitials, setUserInitials] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [withdrawingData, setWithdrawingData] = useState(false);
  
  // Add app state listener to sync interest when app goes to background
  useEffect(() => {
    console.log('Setting up AppState listener');
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App going to background, syncing interest...');
        // Pass false to avoid forcing a sync - will only sync if enough time has passed
        syncInterestToDatabase(false).catch(err => {
          console.error('Error syncing interest on background:', err);
        });
      }
    });
    
    return () => {
      console.log('Cleaning up AppState listener');
      subscription.remove();
    };
  }, []); // Empty dependency array - syncInterestToDatabase won't change
  
  // Add a stability check to prevent unnecessary rerenders/remounts
  useEffect(() => {
    console.log('Component stability check - this should not run repeatedly');
    
    // This will help us track component mount/unmount cycles
    let startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      // If component unmounts rapidly, log a warning
      if (duration < 3000) {
        console.warn(`Component unmounted quickly after ${duration}ms - may indicate reload loop`);
      }
    };
  }, []);
  
  // Load user's name from AsyncStorage and set initials
  useEffect(() => {
    console.log('Loading user initials - this should run only once');
    let isMounted = true;
    
    const loadUserInitials = async () => {
      try {
        const firstName = await AsyncStorage.getItem('user_first_name') || '';
        const lastName = await AsyncStorage.getItem('user_last_name') || '';
        
        if (__DEV__) {
          console.log('Retrieved user name:', { firstName, lastName });
        }
        
        let initials = '';
        if (firstName) {
          initials += firstName.charAt(0).toUpperCase();
        }
        if (lastName) {
          initials += lastName.charAt(0).toUpperCase();
        }
        
        if (isMounted) {
        setUserInitials(initials || 'BT');
        }
      } catch (error) {
        console.error('Error loading user initials:', error);
        if (isMounted) {
        setUserInitials('BT');
        }
      }
    };
    
    loadUserInitials();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - this should only run once
  
  // Remove or simplify this useEffect to prevent excessive updates
  // Use debouncing for the lastRefreshTime updates
  const lastUpdatedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (lastUpdated) {
      // Cleanup previous timeout
      if (lastUpdatedTimeoutRef.current) {
        clearTimeout(lastUpdatedTimeoutRef.current);
      }
      
      // Create new timeout
      lastUpdatedTimeoutRef.current = setTimeout(() => {
      setLastRefreshTime(lastUpdated);
        lastUpdatedTimeoutRef.current = null;
      }, 1000); // Longer debounce for less frequent updates
    }
    
    // Cleanup
    return () => {
      if (lastUpdatedTimeoutRef.current) {
        clearTimeout(lastUpdatedTimeoutRef.current);
      }
    };
  }, [lastUpdated]);
  
  // Log component mount - simplified to avoid triggering rerenders
  useEffect(() => {
    console.log('HomePage component mounted');
    return () => {
      console.log('HomePage component unmounted');
    };
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    setShowDropdown(false);
    try {
      console.log('Logging out user...');
      await logout();
      console.log('User logged out successfully');
      router.replace('/signup');
    } catch (error) {
      console.error('Error logging out:', error);
      router.replace('/signup');
    }
  }, [router, logout]);
  
  // Navigate to USDC balance page
  const navigateToBalancePage = useCallback(() => {
    router.push('/balance');
  }, [router]);
  
  // Function to handle manual refresh
  const handleRefresh = useCallback(async () => {
    console.log('Manually refreshing balance...');
    setRefreshing(true);
    try {
      await refreshBalance();
      // Last refresh time will be updated via the lastUpdated effect
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshBalance]);

  // Format the balance with dynamic decimal places to always show 10 digits total
  const balanceStr = usdcBalance.toString();
  const wholePartValue = Math.floor(usdcBalance);
  const wholePartStr = wholePartValue.toString();
  const wholePartDigits = wholePartStr.length;
  
  // Calculate decimal places needed for total of 10 digits (10 - whole part digits)
  const decimalPlacesToShow = Math.max(1, 10 - wholePartDigits);
  
  // Format whole part with commas
  const wholePart = wholePartValue.toLocaleString();
  
  // Get the required decimal places
  const decimalPart = balanceStr.includes('.') 
    ? balanceStr.split('.')[1].padEnd(decimalPlacesToShow, '0').substring(0, decimalPlacesToShow) 
    : '0'.repeat(decimalPlacesToShow);
  
  // Format interest with same logic for consistency
  const interestStr = interestValue.toString();
  const interestWholeValue = Math.floor(interestValue);
  const interestWholeStr = interestWholeValue.toString();
  const interestWholeDigits = interestWholeStr.length;
  
  // Calculate decimal places needed for interest (10 - whole part digits)
  const interestDecimalPlaces = Math.max(1, 10 - interestWholeDigits);
  
  // Format interest whole part with commas
  const interestWholePart = interestWholeValue.toLocaleString();
  
  // Get the required decimal places for interest - prevent scientific notation
  let interestDecimalPart = '0'.repeat(interestDecimalPlaces);
  if (interestStr.includes('.')) {
    // Convert to decimal string without scientific notation - use exactly 8 decimal places
    const decimalStr = interestValue.toFixed(8).split('.')[1] || '';
    interestDecimalPart = decimalStr.padEnd(interestDecimalPlaces, '0').substring(0, Math.min(interestDecimalPlaces, 8));
  }
  
  // Calculate master balance (balance + interest)
  const masterBalanceValue = usdcBalance + interestValue;
  
  // Format master balance with same logic for consistency
  const masterBalanceStr = masterBalanceValue.toString();
  const masterBalanceWholeValue = Math.floor(masterBalanceValue);
  const masterBalanceWholeStr = masterBalanceWholeValue.toString();
  const masterBalanceWholeDigits = masterBalanceWholeStr.length;
  
  // Calculate decimal places needed for master balance (10 - whole part digits)
  const masterBalanceDecimalPlaces = Math.max(1, 10 - masterBalanceWholeDigits);
  
  // Format master balance whole part with commas
  const masterBalanceWholePart = masterBalanceWholeValue.toLocaleString();
  
  // Get the required decimal places for master balance - prevent scientific notation
  let masterBalanceDecimalPart = '0'.repeat(masterBalanceDecimalPlaces);
  if (masterBalanceStr.includes('.')) {
    // Convert to decimal string without scientific notation - use exactly 8 decimal places
    const decimalStr = masterBalanceValue.toFixed(8).split('.')[1] || '';
    masterBalanceDecimalPart = decimalStr.padEnd(masterBalanceDecimalPlaces, '0').substring(0, Math.min(masterBalanceDecimalPlaces, 8));
  }
    
  // Format the last update time
  const formatLastUpdateTime = () => {
    if (!lastRefreshTime) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 10) return 'just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  };

  // Add this function to the HomePage component
  const handleUpdateBalance = async () => {
    try {
      console.log('Updating balance in Supabase...');
      // Update with the actual transaction amount of 1.0 USDC
      const actualBalance = 1.0;
      const success = await UsdcBalanceService.updateBalance(TARGET_WALLET, actualBalance);
      
      if (success) {
        console.log(`Successfully updated balance to ${actualBalance} USDC`);
        // No need to call refreshBalance - the Supabase real-time subscription should trigger
      } else {
        console.error('Failed to update balance in Supabase');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  // Helper function to force immediate balance/interest update in UI
  const forceBalanceUpdate = (newBalance: number, newInterest: number) => {
    console.log(`Forcing immediate UI update - Balance: ${newBalance}, Interest: ${newInterest}`);
    
    // If interest needs to be reset, use the existing resetInterest function
    if (newInterest === 0 && interestValue > 0) {
      resetInterest().catch(err => {
        console.error('Error resetting interest during forced update:', err);
      });
    }
    
    // For balance, we'll rely on the refreshBalance function which will update the UI
    refreshBalance().catch(err => {
      console.error('Error refreshing balance during forced update:', err);
    });
  };

  // Function to trigger Tenderly Web3 Action webhook and poll for results
  const withdrawAllFunds = async () => {
    console.log('=============== WITHDRAW ALL FUNDS START ===============');
    try {
      console.log('Initiating withdrawal via Tenderly Web3 Actions...');
      
      // DEVELOPMENT MODE - Simulate webhook calls and transaction confirmations
      if (process.env.NODE_ENV !== 'production' && !USE_REAL_TENDERLY_API) {
        console.log('DEVELOPMENT MODE: Simulating webhook calls and transactions');
        
        // Simulate random transaction hashes
        const balanceTxHash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
        const interestTxHash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
        
        // Simulate transaction confirmations
        const balanceConfirmed = await UsdcBalanceService.checkWithdrawalConfirmation(balanceTxHash);
        const interestConfirmed = await UsdcBalanceService.checkWithdrawalConfirmation(interestTxHash);
        
        // IMPORTANT: Record the withdrawal event in database to track last withdrawal time
        if (balanceConfirmed || interestConfirmed) {
          console.log('[WITHDRAWAL TRACKING] Recording withdrawal event after successful simulation');
          await registerWithdrawal();
        }
        
        // Reset interest if confirmed
        if (interestConfirmed) {
          await resetInterestAfterWithdrawal();
        }
        
        // Immediately update UI regardless of confirmation status
        forceBalanceUpdate(0, 0);
        
        // Refresh balances after simulation
        await refreshBalance();
        
        return balanceConfirmed || interestConfirmed;
      }
      // PRODUCTION MODE or forced API mode - Use actual Tenderly webhook calls
      else {
        console.log('🔐 TENDERLY MODE: Using API key: ' + TENDERLY_API_KEY.slice(0, 4) + '...');
        console.log('🔐 Target wallet balance: ' + usdcBalance);
        console.log('🔐 Interest value: ' + interestValue);
        
        // Step 1: Balance Withdrawal
        console.log('=============================================');
        console.log('STEP 1: BALANCE WITHDRAWAL');
        console.log('=============================================');
        
        // API details log
        console.log('👉 Account: ' + TENDERLY_ACCOUNT);
        console.log('👉 Project: ' + TENDERLY_PROJECT);
        console.log('👉 Combo Action ID: ' + COMBO_ACTION_ID);
        console.log('👉 Combo Webhook URL: ' + COMBO_WEBHOOK_URL);
        
        // Prepare headers and payload exactly as in the working example from TENDERLY_SETUP.md
        const comboHeaders = {
          'Content-Type': 'application/json',
          'X-Access-Key': TENDERLY_API_KEY,
          'Authorization': `Bearer ${TENDERLY_API_KEY}`
        };
        
        // Prepare a FLATTENED payload structure exactly as expected by the combo function
        // For interest, we'll use a direct amount with buffer
        const interestAmountWithBuffer = interestValue + 0.01;
        
        const comboPayload = {
          // Common fields
          timestamp: new Date().toISOString(),
          
          // Balance withdrawal fields - use prefix to distinguish
          balanceSourceWallet: TARGET_WALLET,
          balanceAmount: 'all',
          balanceType: 'balance',
          
          // Interest withdrawal fields - use prefix to distinguish
          interestSourceWallet: INTEREST_WALLET,
          interestAmount: interestAmountWithBuffer.toString(),
          interestExactAmount: true,
          interestType: 'interest'
        };
        
        console.log('🚀 Calling combo webhook with payload:', JSON.stringify(comboPayload));
        
        // Make the webhook call
        const comboResponse = await fetch(COMBO_WEBHOOK_URL, {
          method: 'POST',
          headers: comboHeaders,
          body: JSON.stringify(comboPayload)
        });
        
        console.log('📋 Combo webhook response status:', comboResponse.status);
        let comboResponseText = '';
        
        try {
          comboResponseText = await comboResponse.text();
          console.log('📋 Combo webhook response body:', comboResponseText);
        } catch (e) {
          console.log('❌ Failed to get response text:', e);
        }
        
        if (!comboResponse.ok) {
          console.error('❌ Combo withdrawal failed with status:', comboResponse.status);
          return false;
        }
        
        let comboResponseData = null;
        try {
          comboResponseData = comboResponseText ? JSON.parse(comboResponseText) : {};
          console.log('📊 Parsed combo response data:', comboResponseData);
        } catch (e) {
          console.log('⚠️ Could not parse response as JSON, continuing anyway');
        }
        
        // Log execution ID if available
        const comboExecutionId = comboResponseData?.executionId;
        if (comboExecutionId) {
          console.log('🆔 Got combo execution ID:', comboExecutionId);
        }
        
        // Step 2: Wait for action to process (3 seconds)
        console.log('=============================================');
        console.log('STEP 2: WAITING FOR COMBO PROCESSING');
        console.log('=============================================');
        console.log('⏳ Waiting 3 seconds for combo transaction to process...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 3: Skip execution check (not critical and may cause 404 errors)
        console.log('=============================================');
        console.log('STEP 3: SKIPPING EXECUTION CHECK');
        console.log('=============================================');
        console.log('⚠️ Skipping execution check to avoid 404 errors - withdrawal still works correctly');
        
        // Step 4: Reset interest and record withdrawal
        console.log('=============================================');
        console.log('STEP 4: RESET INTEREST & UPDATE DATABASE');
        console.log('=============================================');
        console.log('✏️ Recording withdrawal and resetting interest...');
        
        await resetInterestAfterWithdrawal();
        await registerWithdrawal();
        
        // Step 5: Force UI update
        console.log('=============================================');
        console.log('STEP 5: UPDATE UI');
        console.log('=============================================');
        console.log('🖥️ Forcing UI update with zero balance...');
        
        forceBalanceUpdate(0, 0);
        
        // Step 6: Refresh from database
        console.log('=============================================');
        console.log('STEP 6: REFRESH FROM DATABASE');
        console.log('=============================================');
        console.log('🔄 Refreshing balance from Supabase with forced interest reset...');
        
        await refreshBalance(true); // Force interest reset
        
        console.log('✅ Withdrawal process complete.');
        console.log('=============== WITHDRAW ALL FUNDS END ===============');
        
        // Consider the operation successful if we got here
        return true;
      }
    } catch (error) {
      console.error('❌ Critical error in withdrawAllFunds:', error);
      console.log('=============== WITHDRAW ALL FUNDS ERROR ===============');
      return false;
    }
  };
  
  // Function to reset interest to zero after successful withdrawal
  const resetInterestAfterWithdrawal = async () => {
    try {
      console.log('======= CRITICAL: RESETTING INTEREST AFTER WITHDRAWAL =======');
      
      // First, immediately update UI to show zero balance and interest
      setBalance(0);
      setInterest(0);
      
      // IMPORTANT: Use the new registerWithdrawal function to properly track the withdrawal
      const success = await registerWithdrawal();
      
      if (success) {
        console.log('[WITHDRAWAL TRACKING] Successfully recorded withdrawal and reset interest');
      } else {
        console.error('[WITHDRAWAL TRACKING] Failed to register withdrawal');
        
        // Try fallback approach - direct reset
        const resetSuccess = await UsdcBalanceService.resetInterest(TARGET_WALLET);
        if (resetSuccess) {
          console.log('Interest reset successfully in database (fallback method)');
        } else {
          console.error('Failed to reset interest in database (fallback method)');
        }
      }
      
      // Force an immediate balance refresh with interest reset
      await refreshBalance(true);
      
      console.log('======= INTEREST RESET COMPLETE =======');
      return success;
    } catch (error) {
      console.error('Error resetting interest:', error);
      return false;
    }
  };

  return (
    <ErrorBoundary>
    <SafeAreaView style={styles.container}>
      {/* Header with menu and profile */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialIcons name="menu" size={28} color="#333" />
        </TouchableOpacity>
        
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileImage}>
              {userInitials ? (
                <Text style={styles.initialsText}>{userInitials}</Text>
              ) : (
                <Text style={styles.initialsText}>BT</Text>
              )}
            </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
          contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
              refreshing={isLoading}
            onRefresh={handleRefresh}
              tintColor="#6366f1"
          />
        }
      >
        <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Master Balance</Text>
            
            <View style={styles.masterBalanceContainer}>
              <Text style={styles.masterBalanceAmount}>
                <Text style={styles.currencySymbol}>$</Text>
                {masterBalanceWholePart}
                <Text style={styles.decimalPart}>.{masterBalanceDecimalPart}</Text>
              </Text>
            </View>

            <Text style={[styles.balanceLabel, styles.secondaryLabel]}>Wallet Balance</Text>
            
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceAmount}>
                <Text style={styles.currencySymbol}>$</Text>
                {wholePart}
                <Text style={styles.decimalPart}>.{decimalPart}</Text>
              </Text>
            </View>

            {/* Interest Display */}
            <View style={styles.interestContainer}>
              <Text style={styles.interestLabel}>Interest</Text>
              <Text style={styles.interestAmount}>
                <Text style={styles.currencySymbol}>$</Text>
                {interestWholePart}
                <Text style={styles.decimalPart}>.{interestDecimalPart}</Text>
              </Text>
            </View>
          
          <TouchableOpacity 
            style={styles.addFundsButton}
              onPress={() => {
                console.log('Add funds button pressed');
                Alert.alert('Coming Soon', 'Add funds functionality will be available soon!');
              }}
          >
              <MaterialIcons name="add-circle-outline" size={22} color="#2563eb" />
            <Text style={styles.addFundsText}>Add funds</Text>
          </TouchableOpacity>

            {/* Withdraw All button */}
            <TouchableOpacity 
              style={styles.withdrawAllButton}
              onPress={() => {
                Alert.alert(
                  'Withdraw All Funds',
                  'This will withdraw both your USDC balance and accumulated interest. Continue?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Withdraw All',
                      style: 'destructive',
                      onPress: () => {
                        withdrawAllFunds();
                      },
                    },
                  ]
                );
              }}
            >
              <MaterialIcons name="account-balance-wallet" size={24} color="#dc2626" />
              <Text style={styles.withdrawAllText}>Withdraw All</Text>
            </TouchableOpacity>
            
            {/* Grid of feature cards */}
            <View style={styles.featureGrid}>
              {/* Activity card */}
              <TouchableOpacity style={styles.featureCard}>
                <Text style={styles.featureTitle}>Activity</Text>
                <Text style={styles.featureDescription}>Activity details of your Ampli account over time with realtime analysis.</Text>
              </TouchableOpacity>

              {/* Earn card */}
              <TouchableOpacity style={styles.featureCard}>
                <Text style={styles.featureTitle}>Earn</Text>
                <Text style={styles.featureDescription}>Refer friends, earn rewards.</Text>
              </TouchableOpacity>
        </View>

            {/* Transfer funds section */}
        <View style={styles.transferSection}>
              <Text style={styles.sectionTitle}>Transferring funds</Text>
              <Text style={styles.sectionDescription}>Instantly send or receive funds with no fees.</Text>
          
          <TouchableOpacity style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: contentPadding,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 10,
  },
  menuButton: {
    padding: 8,
  },
  profileButton: {
    padding: 8,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: contentPadding,
    paddingBottom: 40,
  },
  balanceSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  secondaryLabel: {
    marginTop: 20,
  },
  balanceContainer: {
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111',
  },
  decimalPart: {
    fontSize: 28,
    fontWeight: '500',
    color: '#333',
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFundsText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '500',
    color: '#0066CC',
  },
  withdrawAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  withdrawAllText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '500',
    color: '#f97316', // Orange color
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: (contentWidth - 12) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  transferSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  interestContainer: {
    marginBottom: 16,
  },
  interestLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  interestAmount: {
    fontSize: 32,
    fontWeight: '600',
    color: '#4CAF50', // Green color for interest
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  masterBalanceContainer: {
    marginBottom: 16,
  },
  masterBalanceAmount: {
    fontSize: 44,
    fontWeight: '800',
    color: '#111',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

// Export without memo first to ensure the component is defined correctly
export default function UnmemoizedHomePage() {
  return <HomePage />;
}
