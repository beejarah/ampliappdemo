import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Image, ActivityIndicator } from 'react-native';
import { Link, useRouter, useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/expo';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MainHomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isReady, isAuthenticated, logout, user } = usePrivy();
  const [isLoading, setIsLoading] = useState(true);
  const [isComingFromPasswordCreation, setIsComingFromPasswordCreation] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [preventRedirect, setPreventRedirect] = useState(true); // Default to preventing redirect initially

  // Log component mount and state
  useEffect(() => {
    console.log('HomeScreen mounted, isReady:', isReady, 'isAuthenticated:', isAuthenticated, 'user:', user);
    
    // Check if we're coming from password creation and if terms have been accepted
    const checkFlags = async () => {
      try {
        console.log('Checking for password creation flag and terms acceptance...');
        const passwordCreationFlag = await AsyncStorage.getItem('coming_from_password_creation');
        const termsAcceptedFlag = await AsyncStorage.getItem('has_accepted_terms');
        
        console.log('Password creation flag value:', passwordCreationFlag);
        console.log('Terms accepted flag value:', termsAcceptedFlag);
        
        // Check if user has accepted terms
        if (isAuthenticated && termsAcceptedFlag !== 'true') {
          console.log('User is authenticated but has not accepted terms, redirecting to terms of service');
          // Instead of navigating to terms-of-service, we'll show the modal in user-profile
          router.replace('/user-profile');
          return;
        } else if (isAuthenticated && termsAcceptedFlag === 'true') {
          // If user is authenticated and has accepted terms, redirect to wallet balance page
          console.log('User is authenticated and has accepted terms, redirecting to wallet balance page');
          router.replace('/(tabs)');
          return;
        }
        
        if (passwordCreationFlag === 'true') {
          console.log('Coming from password creation, will stay on home screen');
          setIsComingFromPasswordCreation(true);
          // Clear the flag so it's only used once
          await AsyncStorage.removeItem('coming_from_password_creation');
        }
        
        // After a delay, allow the redirect check to proceed
        // This gives AsyncStorage and navigation state time to settle
        setTimeout(() => {
          setInitialCheckComplete(true);
          // After 2 seconds, we'll allow redirects if needed
          setTimeout(() => {
            setPreventRedirect(false);
          }, 2000);
        }, 500);
        
      } catch (error) {
        console.warn('Error checking flags:', error);
        setInitialCheckComplete(true);
        // After 2 seconds, we'll allow redirects if needed
        setTimeout(() => {
          setPreventRedirect(false);
        }, 2000);
      }
    };
    
    checkFlags();
    
    return () => {
      console.log('HomeScreen unmounted');
    };
  }, [isAuthenticated, router]);

  // Handle authentication state changes - only after initial check is complete
  useEffect(() => {
    // Skip this effect until the initial check is complete
    if (!initialCheckComplete) {
      return;
    }
    
    // If we're preventing redirects, don't check auth state yet
    if (preventRedirect) {
      console.log('Preventing redirect check temporarily');
      setIsLoading(false);
      return;
    }
    
    console.log('Auth state check - isReady:', isReady, 'isAuthenticated:', isAuthenticated);
    console.log('Coming from password creation:', isComingFromPasswordCreation);

    if (isReady) {
      if (!isAuthenticated && !isComingFromPasswordCreation) {
        console.log('User is not authenticated and not coming from password creation, redirecting to signup');
        router.replace('/signup');
      } else {
        console.log('User is authenticated or coming from password creation, showing home screen');
        setIsLoading(false);
      }
    }
  }, [isReady, isAuthenticated, router, isComingFromPasswordCreation, initialCheckComplete, preventRedirect]);

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await logout();
      console.log('Logged out successfully');
      router.replace('/signup');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#005BB2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleProfilePress = () => {
    console.log('Profile button pressed');
    // Navigate to profile screen (to be implemented)
    // router.push('/profile');
  };

  // Extract user name if available
  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  console.log('Rendering HomeScreen with user:', userName);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ampli</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleProfilePress}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome, {userName.split(' ')[0]}
          </Text>
          <Text style={styles.subtitleText}>Your all-in-one financial platform</Text>
        </View>

        {/* Main Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Main Features</Text>
          
          <View style={styles.featuresGrid}>
            {/* Wallet Feature - Links to your existing app */}
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E6F0FF' }]}>
                <MaterialIcons name="account-balance-wallet" size={28} color="#0052B4" />
              </View>
              <Text style={styles.featureTitle}>Wallet</Text>
              <Text style={styles.featureDescription}>Manage your funds and transactions</Text>
            </TouchableOpacity>

            {/* Investments Feature - Placeholder for future feature */}
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#E6FFF0' }]}>
                <MaterialIcons name="trending-up" size={28} color="#00B473" />
              </View>
              <Text style={styles.featureTitle}>Investments</Text>
              <Text style={styles.featureDescription}>Grow your wealth with smart investments</Text>
            </TouchableOpacity>

            {/* Payments Feature - Placeholder for future feature */}
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF0E6' }]}>
                <MaterialIcons name="payment" size={28} color="#FF7A00" />
              </View>
              <Text style={styles.featureTitle}>Payments</Text>
              <Text style={styles.featureDescription}>Send and receive money easily</Text>
            </TouchableOpacity>

            {/* Analytics Feature - Placeholder for future feature */}
            <TouchableOpacity style={styles.featureCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#F0E6FF' }]}>
                <MaterialIcons name="insert-chart" size={28} color="#7A00FF" />
              </View>
              <Text style={styles.featureTitle}>Analytics</Text>
              <Text style={styles.featureDescription}>Track your financial performance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickActionButton}>
              <MaterialIcons name="add" size={24} color="#0052B4" />
              <Text style={styles.quickActionText}>Add Funds</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <MaterialIcons name="send" size={24} color="#0052B4" />
              <Text style={styles.quickActionText}>Send Money</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <MaterialIcons name="qr-code-scanner" size={24} color="#0052B4" />
              <Text style={styles.quickActionText}>Scan QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0052B4',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0052B4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
  },
  featuresSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  quickActionsSection: {
    marginBottom: 30,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 14,
    color: '#0052B4',
    marginTop: 5,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 