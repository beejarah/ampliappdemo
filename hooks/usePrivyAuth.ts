import { usePrivy, User } from '@privy-io/expo';
import { useAuth } from '@/app/_layout';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export function usePrivyAuth() {
  const { 
    ready, 
    authenticated, 
    user, 
    login, 
    logout,
    createWallet,
    linkWallet,
    unlinkWallet,
    sendTransaction,
    exportWallet
  } = usePrivy();
  
  const { 
    setIsAuthenticated, 
    setUser, 
    setWalletBalance 
  } = useAuth();

  const router = useRouter();

  // Sync Privy auth state with our app's auth context
  useEffect(() => {
    if (ready) {
      console.log('Privy is ready, authenticated:', authenticated);
      setIsAuthenticated(authenticated);
      
      if (authenticated && user) {
        console.log('User is authenticated, syncing user data');
        syncUserData(user);
      }
    } else {
      console.log('Privy is not ready yet');
    }
  }, [ready, authenticated, user, setIsAuthenticated, setUser]);

  // Function to sync Privy user data with our app's user context
  const syncUserData = (privyUser: User) => {
    console.log('Syncing user data:', privyUser);
    setUser({
      id: privyUser.id,
      email: privyUser.email?.address,
      name: privyUser.name || privyUser.email?.address?.split('@')[0] || 'User'
    });
    
    // In a real app, you would fetch the wallet balance from your backend
    // For demo purposes, we'll set a mock balance
    setWalletBalance(1250.75);
  };

  // Handle navigation after login/logout
  const handleLogin = async (options: any) => {
    console.log('Attempting login with options:', options);
    try {
      await login(options);
      console.log('Login successful');
      // Navigation will be handled by the onSuccess callback in PrivyProvider
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    console.log('Attempting logout');
    try {
      await logout();
      console.log('Logout successful');
      router.replace('/(auth)');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return {
    ready,
    authenticated,
    user,
    login: handleLogin,
    logout: handleLogout,
    createWallet,
    linkWallet,
    unlinkWallet,
    sendTransaction,
    exportWallet
  };
} 