import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Platform, ActivityIndicator, Animated, Easing, SafeAreaView } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect } from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { Linking } from 'react-native';
import { useAuth } from '../_layout';
import { usePrivy } from '@privy-io/expo';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useRouter } from 'expo-router';

// Custom warning icon component
const WarningIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.64388 1.82054C6.99629 1.10673 7.88905 0.800388 8.63791 1.1363C8.90835 1.2576 9.1335 1.45271 9.2858 1.69537L9.35576 1.82054L14.857 12.9634C15.2094 13.6772 14.888 14.5281 14.1392 14.864C13.9795 14.9357 13.8081 14.9797 13.633 14.9945L13.5011 15H2.49858C1.67094 15 1 14.3605 1 13.5716C1 13.4034 1.03117 13.2368 1.09173 13.0795L1.14264 12.9634L6.64388 1.82054Z"
      fill="#F27F0D"
    />
    <Path d="M8 5V11M8 12.9333V13" stroke="#F2F2F2" strokeLinecap="round" />
  </Svg>
);

// Custom spinner component
const LoadingSpinner = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startRotation = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startRotation());
    };

    startRotation();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Svg width="24" height="24" viewBox="0 0 24 24">
        <Circle
          cx="12"
          cy="12"
          r="10"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="50 100"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
};

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { isReady, isAuthenticated, login, user } = usePrivy();
  const router = useRouter();

  // Log component mount
  useEffect(() => {
    console.log('AuthScreen mounted, isReady:', isReady, 'isAuthenticated:', isAuthenticated, 'user:', user);
    return () => {
      console.log('AuthScreen unmounted');
    };
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    console.log('Auth state changed - isReady:', isReady, 'isAuthenticated:', isAuthenticated);
    
    if (isReady) {
      setIsInitializing(false);
      
      if (isAuthenticated) {
        console.log('User is authenticated, redirecting to home');
        router.replace('/home');
      }
    }
  }, [isReady, isAuthenticated, router]);

  // Show loading state while Privy is initializing
  if (isInitializing) {
    console.log('Privy is initializing, showing loading state');
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0052B4" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </SafeAreaView>
    );
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignIn = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      console.log('Attempting to login with email:', email);
      await login({ 
        loginMethod: 'email', 
        email,
        createUser: true // Allow creating a new user if they don't exist
      });
      console.log('Login request sent successfully');
    } catch (error) {
      console.error('Error during login:', error);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Branding */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ampli</Text>
          <Text style={styles.logoArrow}>^</Text>
        </View>
        
        {/* Tagline */}
        <Text style={styles.tagline}>Money elevated</Text>
        
        {/* Auth Form Container */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Sign In / Sign Up</Text>
            <Text style={styles.formSubtitle}>Enter your email to continue</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Continue with Email</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Terms and Privacy */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By continuing, you agree to Ampli's{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text 
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://ampli.money/privacy-policy.html')}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0052B4',
  },
  logoArrow: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0052B4',
    marginLeft: 2,
    marginTop: -8,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0052B4',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorContainer: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  button: {
    backgroundColor: '#0052B4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#0052B4',
    fontWeight: '600',
  },
}); 