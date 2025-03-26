import React, { useState, useEffect, createContext, useContext } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme, View, Text, ActivityIndicator, StyleSheet, Button, LogBox } from 'react-native';
import { PrivyProvider, usePrivy } from '@privy-io/expo';
import Constants from 'expo-constants';
import ENV from '../env';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { useDevAutoLogin, isDevAutoLoginEnabled } from '../utils/devHelpers';

// Suppress specific warnings in development
LogBox.ignoreLogs([
  'Using an insecure random number generator',
  // Add any other warnings you want to suppress here
]);

// Get Privy App ID and Client ID from ENV
const PRIVY_APP_ID = ENV.PRIVY_APP_ID;
const PRIVY_CLIENT_ID = ENV.PRIVY_CLIENT_ID;

// Log the Privy App ID and Client ID (only in development)
if (__DEV__) {
  console.log('Privy App ID:', PRIVY_APP_ID);
  console.log('Privy Client ID:', PRIVY_CLIENT_ID);
}

// Create Auth Context
const AuthContext = createContext<{
  walletBalance: number;
  setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
}>({
  walletBalance: 0,
  setWalletBalance: () => {},
  isLoading: false,
});

// Auth Provider Hook
export function useAuth() {
  return useContext(AuthContext);
}

// Simple wrapper to handle Privy initialization
function PrivyInitializer({ children }: { children: React.ReactNode }) {
  const privy = usePrivy();
  
  // Use the development auto-login hook (only active in development mode)
  useDevAutoLogin();
  
  // Override the default error handling to suppress all Privy-related warnings
  useEffect(() => {
    // Create a global error handler for Privy errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      // Check if this is a Privy-related error that we want to suppress
      const errorMessage = args.join(' ');
      if (errorMessage.includes('Already logged in')) {
        // Silently ignore "Already logged in" errors
        if (__DEV__) {
          console.log('Suppressed "Already logged in" warning');
        }
        return;
      }
      
      // For all other errors, use the original console.error
      originalConsoleError.apply(console, args);
    };
    
    // Cleanup function to restore the original console.error
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  // Log Privy state changes only when they actually change and only in development
  useEffect(() => {
    if (__DEV__) {
      console.log('Privy state changed:', { 
        ready: privy.isReady,
        user: privy.user,
        methods: Object.keys(privy),
      });
      
      if (privy.isReady) {
        console.log('Privy is ready!');
        console.log('Available Privy methods:', Object.keys(privy).filter(key => typeof privy[key as keyof typeof privy] === 'function'));
      }
    }
  }, [privy.isReady, privy.user]);
  
  // If Privy is not ready, show loading state
  if (!privy.isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0052B4" />
        <Text style={{ marginTop: 20 }}>Loading Ampli...</Text>
      </View>
    );
  }
  
  return <>{children}</>;
}

export default function RootLayout() {
  // State for wallet balance with auto-incrementing feature
  const [walletBalance, setWalletBalance] = useState(10556.9898);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auto-increment wallet balance at a rate of 10% per year
  // with updates every 0.5 seconds
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
      setWalletBalance(prev => {
        // Calculate the exact increment for the current balance
        // to achieve exactly 10% annual growth
        const increment = calculateIncrement(prev);
        // Ensure we maintain precision to 5 decimal places
        return parseFloat((prev + increment).toFixed(5));
      });
    }, 500); // Update every 0.5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Log component mount and unmount
  useEffect(() => {
    console.log('RootLayout mounted');
    return () => {
      console.log('RootLayout unmounted');
    };
  }, []);

  return (
    <ErrorBoundary>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        clientId={PRIVY_CLIENT_ID}
      >
        <AuthContext.Provider value={{ walletBalance, setWalletBalance, isLoading }}>
          <PrivyInitializer>
            {/* Show dev mode indicator in status bar */}
            {isDevAutoLoginEnabled() && (
              <View style={styles.devModeIndicator}>
                <Text style={styles.devModeText}>DEV MODE - Auto Login Enabled</Text>
              </View>
            )}
            <Stack screenOptions={{ 
              headerShown: false,
              animation: 'none'
            }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="home" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="signin" options={{ headerShown: false }} />
              <Stack.Screen name="verification" options={{ headerShown: false }} />
              <Stack.Screen name="create-password" options={{ headerShown: false }} />
              <Stack.Screen name="user-profile" options={{ headerShown: false }} />
              <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </PrivyInitializer>
        </AuthContext.Provider>
      </PrivyProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#0052B4',
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 10,
    color: '#666666',
    marginBottom: 20,
  },
  debugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#333333',
    marginBottom: 5,
  },
  devModeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6347',
    padding: 4,
    zIndex: 9999,
    alignItems: 'center',
  },
  devModeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
