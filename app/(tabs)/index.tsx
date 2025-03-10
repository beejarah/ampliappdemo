import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Dimensions, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { usePrivy } from '@privy-io/expo';
import { useEffect, useState } from 'react';
import { useAuth } from '../_layout';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get screen width for consistent sizing
const { width } = Dimensions.get('window');
const contentPadding = 24;
const contentWidth = width - (contentPadding * 2);

// Custom SVG Icons
const HomeIcon = ({ active = false }) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none">
    <Path 
      d="M9.125 22V12H15.125V22M3.125 9L12.125 2L21.125 9V20C21.125 20.5304 20.9143 21.0391 20.5392 21.4142C20.1641 21.7893 19.6554 22 19.125 22H5.125C4.59457 22 4.08586 21.7893 3.71079 21.4142C3.33571 21.0391 3.125 20.5304 3.125 20V9Z" 
      stroke={active ? "#0857A6" : "#1A1A1A"} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

const DollarIcon = ({ active = false }) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none">
    <Path 
      d="M12.375 2V22M17.375 5H9.875C8.94674 5 8.0565 5.36875 7.40013 6.02513C6.74375 6.6815 6.375 7.57174 6.375 8.5C6.375 9.42826 6.74375 10.3185 7.40013 10.9749C8.0565 11.6313 8.94674 12 9.875 12H14.875C15.8033 12 16.6935 12.3687 17.3499 13.0251C18.0063 13.6815 18.375 14.5717 18.375 15.5C18.375 16.4283 18.0063 17.3185 17.3499 17.9749C16.6935 18.6313 15.8033 19 14.875 19H7.375" 
      stroke={active ? "#0857A6" : "#1A1A1A"} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

const ShieldIcon = ({ active = false }) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none">
    <Path 
      d="M20.625 5V12C20.625 16.0419 16.9946 19.1762 14.625 20.7915L12.625 22L10.8423 20.9378C8.48478 19.3703 4.625 16.1676 4.625 12V5L12.625 2L20.625 5Z" 
      stroke={active ? "#0857A6" : "#1A1A1A"} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

const MenuIcon = ({ active = false }) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none">
    <Path 
      d="M3.875 18H3.885M8.875 6H21.875M8.875 12H21.875M8.875 18H21.875M3.875 6H3.885M3.875 12H3.885" 
      stroke={active ? "#0857A6" : "#1A1A1A"} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

export default function HomePage() {
  const { user, logout } = usePrivy();
  const { walletBalance, isLoading } = useAuth();
  const router = useRouter();
  const [buttonWidth, setButtonWidth] = useState(0);
  const [userInitials, setUserInitials] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
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
  }, []);
  
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
  
  // Format the balance with 5 decimal places
  const formattedBalance = Math.floor(walletBalance).toLocaleString();
  const decimalPart = (walletBalance % 1).toFixed(5).substring(2);

  // Function to measure the width of the Send & Receive buttons container
  const onSendReceiveLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    const { width } = event.nativeEvent.layout;
    setButtonWidth(width);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with menu and profile */}
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialIcons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.profile}>
          <TouchableOpacity 
            style={styles.profileInitials}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.profileInitialsText}>{userInitials}</Text>
          </TouchableOpacity>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownMenu}>
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={handleLogout}
                >
                  <MaterialIcons name="logout" size={18} color="#333" />
                  <Text style={styles.dropdownItemText}>Log out</Text>
                </TouchableOpacity>
              </View>
              
              {/* Overlay to capture touches outside the dropdown */}
              <Pressable 
                style={styles.overlay} 
                onPress={() => setShowDropdown(false)}
              />
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Send & Receive Section - Rendered first but invisible to measure width */}
        <View 
          style={[styles.sendReceiveContainer, { opacity: 0, position: 'absolute' }]}
          onLayout={onSendReceiveLayout}
        >
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Receive</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>
            <Text style={styles.currencySymbol}>$</Text>
            {formattedBalance}
            <Text style={styles.cents}>.{decimalPart}</Text>
          </Text>
          
          <TouchableOpacity 
            style={[
              styles.addFundsButton, 
              { width: buttonWidth > 0 ? buttonWidth : '100%' }
            ]}
          >
            <Text style={styles.addFundsText}>Add funds</Text>
          </TouchableOpacity>
        </View>

        {/* Activity and Earn Cards */}
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity</Text>
            <Text style={styles.cardDescription}>
              Activity details of your Ampli account over time with realtime analysis.
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardLink}>See all</Text>
              <MaterialIcons name="chevron-right" size={20} color="#005BB2" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Earn</Text>
            <Text style={styles.cardDescription}>
              Refer friends, earn rewards.
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardLink}>Learn more</Text>
              <MaterialIcons name="chevron-right" size={20} color="#005BB2" />
            </View>
          </View>
        </View>

        {/* Send & Receive Section - Visible version */}
        <View style={styles.sendReceiveContainer}>
          <Text style={styles.sendReceiveTitle}>Send & Receive</Text>
          <Text style={styles.sendReceiveDescription}>
            Instantly send or receive funds with no fees.
          </Text>
          
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Receive</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <HomeIcon active={true} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <DollarIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <ShieldIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MenuIcon />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 10,
  },
  profileInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitialsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  balanceContainer: {
    marginTop: 20,
    marginBottom: 30,
    marginHorizontal: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  balanceLabel: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
  },
  cents: {
    fontSize: 32,
    fontWeight: '400',
    color: '#000',
  },
  addFundsButton: {
    backgroundColor: '#005BB2',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  addFundsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 15,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#005BB2',
    marginRight: 4,
  },
  sendReceiveContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginHorizontal: 24,
  },
  sendReceiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  sendReceiveDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#005BB2',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    width: '48%',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    width: 150,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
});
