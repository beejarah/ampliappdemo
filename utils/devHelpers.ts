/**
 * Development Helper Utilities
 * 
 * This file contains utilities that are only used in development mode.
 * These functions will not be included in production builds.
 */

import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePrivy } from '@privy-io/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../env';

/**
 * Hook to automatically login during development
 * This will bypass the normal authentication flow when developing
 */
export function useDevAutoLogin() {
  const router = useRouter();
  const { isReady, isAuthenticated, login } = usePrivy();

  useEffect(() => {
    // Only run in development mode when auto-login is enabled
    if (!__DEV__ || !ENV.DEV_AUTO_LOGIN) {
      return;
    }

    const autoLogin = async () => {
      // Only auto-login if not already authenticated and Privy is ready
      if (isReady && !isAuthenticated) {
        try {
          console.log('🔑 [DEV] Auto-login activated');
          
          // Mark user as verified in AsyncStorage (to bypass verification)
          const email = ENV.DEV_TEST_EMAIL;
          await AsyncStorage.setItem(`verified_${email}`, 'true');
          
          // Create mock user data for development
          await AsyncStorage.setItem('user_first_name', 'Dev');
          await AsyncStorage.setItem('user_last_name', 'User');
          
          // Navigate directly to tabs/balance page
          console.log('🔑 [DEV] Auto redirecting to balance page');
          router.replace('/(tabs)');
          
          // Show a notification that we're in dev mode
          if (__DEV__) {
            Alert.alert(
              '🔧 Development Mode', 
              'Auto-login is enabled. To disable, set DEV_AUTO_LOGIN to false in env.js.',
              [{ text: 'OK', style: 'default' }]
            );
          }
        } catch (error) {
          console.error('🔑 [DEV] Auto-login failed:', error);
        }
      }
    };

    // Run auto-login after a short delay to ensure app is fully initialized
    const timer = setTimeout(autoLogin, 500);
    return () => clearTimeout(timer);
  }, [isReady, isAuthenticated, router]);
}

/**
 * Check if we're running in development auto-login mode
 */
export function isDevAutoLoginEnabled() {
  return __DEV__ && ENV.DEV_AUTO_LOGIN;
}

/**
 * Get the development test email
 */
export function getDevTestEmail() {
  return ENV.DEV_TEST_EMAIL;
} 