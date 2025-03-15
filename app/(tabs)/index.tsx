import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Dimensions, Modal, Pressable, RefreshControl, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePrivy } from '@privy-io/expo';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../_layout';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUsdcBalance } from '../../hooks/useUsdcBalance';
import { formatCurrency } from '../../utils/formatters';
import UsdcBalanceService, { TARGET_WALLET } from '../../utils/usdcBalanceService';

// Define webhook URL for Tenderly Web3 Action (will be configured later)
const TENDERLY_WEBHOOK_URL = 'https://api.tenderly.co/api/v1/actions-gateway/webhook/YOUR_WEBHOOK_ID';
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

function HomePage() {
  const { user, logout } = usePrivy();
  const { walletBalance: dummyBalance, isLoading: isDummyLoading } = useAuth();
  // Disable automatic polling - only update when Supabase real-time event occurs
  const { balance: usdcBalance, isLoading, refreshBalance, lastUpdated } = useUsdcBalance(0); 
  const [interestValue, setInterestValue] = useState(0);
  const accumulatedInterestRef = useRef(0); // Track accumulated interest
  const router = useRouter();
  const [userInitials, setUserInitials] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  // Interest calculation based on current balance
  useEffect(() => {
    const calculateIncrement = (balance: number) => {
      // 10% annual rate
      const annualRate = 0.10;
      
      // Calculate how much the balance should increase per update
      // for a 10% annual increase
      const annualIncrease = balance * annualRate;
      
      // Updates per year (2 updates per second * seconds in a year)
      const updatesPerYear = 2 * 60 * 60 * 24 * 365;
      
      // Increase per update
      return annualIncrease / updatesPerYear;
    };
    
    const interval = setInterval(() => {
      // Calculate the exact increment for the current balance
      // to achieve exactly 10% annual growth
      const increment = calculateIncrement(usdcBalance);
      
      // Accumulate interest
      accumulatedInterestRef.current += increment;
      
      // Update the interest value state, ensuring precision
      // Use Number instead of parseFloat to prevent scientific notation
      setInterestValue(accumulatedInterestRef.current);
    }, 500); // Update every 0.5 seconds
    
    // Reset accumulated interest when balance changes
    accumulatedInterestRef.current = 0;
    setInterestValue(0);
    
    return () => clearInterval(interval);
  }, [usdcBalance]); // Re-run when balance changes
  
  // Load user's name from AsyncStorage and set initials
  useEffect(() => {
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
        
        setUserInitials(initials || 'BT');
      } catch (error) {
        console.error('Error loading user initials:', error);
        setUserInitials('BT');
      }
    };
    
    loadUserInitials();
    
    // Fetch USDC balance on load
    refreshBalance();
  }, []);
  
  useEffect(() => {
    if (lastUpdated) {
      setLastRefreshTime(lastUpdated);
    }
  }, [lastUpdated]);
  
  // Log component mount
  useEffect(() => {
    if (__DEV__) console.log('TabsIndex mounted, user:', user);
    return () => {
      if (__DEV__) console.log('TabsIndex unmounted');
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      // Actually log out the user using Privy's logout function
      console.log('Logging out user...');
      await logout();
      console.log('User logged out successfully');
      
      // Navigate to the create account page after logging out
      router.replace('/signup');
    } catch (error) {
      console.error('Error logging out:', error);
      // Still navigate to signup page even if logout fails
      router.replace('/signup');
    }
  };
  
  // Navigate to USDC balance page
  const navigateToBalancePage = () => {
    router.push('/balance');
  };
  
  // Function to handle manual refresh
  const handleRefresh = useCallback(async () => {
    console.log('Manually refreshing balance...');
    setRefreshing(true);
    try {
      await refreshBalance();
      setLastRefreshTime(new Date());
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
    // Convert to decimal string without scientific notation
    const decimalStr = interestValue.toFixed(20).split('.')[1] || '';
    interestDecimalPart = decimalStr.padEnd(interestDecimalPlaces, '0').substring(0, interestDecimalPlaces);
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
    // Convert to decimal string without scientific notation
    const decimalStr = masterBalanceValue.toFixed(20).split('.')[1] || '';
    masterBalanceDecimalPart = decimalStr.padEnd(masterBalanceDecimalPlaces, '0').substring(0, masterBalanceDecimalPlaces);
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

  // Function to trigger Tenderly Web3 Action webhook for withdrawing all USDC
  const withdrawAllFunds = async () => {
    try {
      console.log('Initiating withdrawal via Tenderly Web3 Action...');
      console.log(`From: ${TARGET_WALLET} to ${SEND_WALLET}`);
      
      // In production, this would be an actual API call to Tenderly
      // For now, we'll simulate the process
      
      // Prepare the webhook payload
      const payload = {
        sourceWallet: TARGET_WALLET,
        destinationWallet: SEND_WALLET,
        amount: 'all', // Withdraw all USDC
        timestamp: new Date().toISOString()
      };
      
      // For development, log the payload that would be sent
      console.log('Webhook payload:', JSON.stringify(payload, null, 2));
      
      /* 
      // Uncomment this code when Tenderly webhook is configured
      const response = await fetch(TENDERLY_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('Tenderly response:', data);
      
      if (response.ok) {
        // Update UI or show success message
        console.log('Withdrawal initiated successfully');
        return true;
      } else {
        console.error('Failed to initiate withdrawal:', data);
        return false;
      }
      */
      
      // For development, simulate a successful response
      console.log('Simulated successful withdrawal initiation');
      // In production, we'd refresh the balance after confirmation
      // setTimeout(() => refreshBalance(), 5000); 
      return true;
    } catch (error) {
      console.error('Error initiating withdrawal:', error);
      return false;
    }
  };

  return (
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
            onRefresh={handleUpdateBalance}
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
              console.log('Withdraw All button pressed');
              Alert.alert(
                'Withdraw All',
                'Are you sure you want to withdraw all USDC from your account?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Withdraw',
                    onPress: () => {
                      console.log('Withdraw confirmed - will trigger Tenderly Web3 Action');
                      // Call the function to trigger Tenderly webhook
                      withdrawAllFunds().then(success => {
                        if (success) {
                          Alert.alert('Processing', 'Withdrawal request has been submitted. Your balance will update shortly.');
                        } else {
                          Alert.alert('Error', 'Failed to initiate withdrawal. Please try again later.');
                        }
                      });
                    },
                  },
                ]
              );
            }}
          >
            <MaterialIcons name="account-balance-wallet" size={22} color="#f97316" />
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
  );
}

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

export default HomePage;
