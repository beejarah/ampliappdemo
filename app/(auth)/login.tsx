import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator, SafeAreaView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { usePrivy, useLoginWithEmail, hasError } from '@privy-io/expo';

// Add a debug flag for development
const DEBUG_MODE = true;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // Use Privy hooks - this is the recommended way for Expo apps
  const { isReady, isAuthenticated, user } = usePrivy();
  
  // DEBUG: Log all available Privy methods
  useEffect(() => {
    console.log('==== DEBUG: Privy SDK State ====');
    console.log('isReady:', isReady);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('============================');
  }, [isReady, isAuthenticated, user]);
  
  // Use Privy's email login hook directly - this is the proper hook for Expo apps
  const { 
    sendCode, 
    loginWithCode, 
    state: loginState
  } = useLoginWithEmail({
    onSendCodeSuccess: (emailData) => {
      console.log('DEBUG: onSendCodeSuccess callback triggered with:', emailData);
      setIsCodeSent(true);
      setIsLoading(false);
    },
    onLoginSuccess: (user, isNewUser) => {
      console.log('DEBUG: onLoginSuccess callback triggered, user:', user);
      console.log('Is new user:', isNewUser);
      // Privy will handle the rest of the authentication flow
    },
    onError: (err) => {
      console.error('DEBUG: Privy onError callback triggered:', err);
      setError(err.message || 'Authentication failed');
      setIsLoading(false);
    }
  });
  
  // DEBUG: Log whenever loginState changes
  useEffect(() => {
    console.log('DEBUG: loginState changed to:', loginState);
  }, [loginState]);
  
  // Monitor Privy state
  useEffect(() => {
    console.log('LoginScreen mounted, isReady:', isReady, 'isAuthenticated:', isAuthenticated);
    console.log('Login state:', loginState);
    
    // If user is already authenticated, redirect to home
    if (isReady && isAuthenticated) {
      console.log('User is already authenticated, redirecting to home');
      router.replace('/home');
    }
  }, [isReady, isAuthenticated, router, loginState]);
  
  // Monitor login state changes
  useEffect(() => {
    console.log('Login state changed:', loginState);
    
    // Update UI based on login state
    if (loginState.status === 'sending-code') {
      setIsLoading(true);
    } else if (loginState.status === 'awaiting-code-input') {
      setIsCodeSent(true);
      setIsLoading(false);
    } else if (loginState.status === 'submitting-code') {
      setIsLoading(true);
    } else if (loginState.status === 'done') {
      setIsLoading(false);
      // The onLoginSuccess callback will handle navigation
    } else if (hasError(loginState)) {
      console.error('Login error:', loginState.error);
      setError(loginState.error?.message || 'Authentication failed');
      setIsLoading(false);
    }
  }, [loginState]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendCode = async () => {
    console.log('DEBUG: handleSendCode function called');
    console.log('DEBUG: Current email value:', email);
    
    // Immediate visual feedback - set this as early as possible
    setIsLoading(true);
    
    // Validate input
    if (!email.trim()) {
      console.log('DEBUG: Email validation failed - email is empty');
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      console.log('DEBUG: Email validation failed - invalid format');
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    console.log('DEBUG: Email validation passed for:', email);
    
    // Clear previous errors
    setError('');
    
    // DIRECT UI UPDATE - Don't wait for callbacks
    setTimeout(() => {
      alert('Attempting to send code to: ' + email);
    }, 100);
    
    try {
      console.log('DEBUG: Checking if sendCode is available...');
      
      // Check if sendCode method exists
      if (typeof sendCode !== 'function') {
        console.error('DEBUG: CRITICAL ERROR - sendCode is not a function!', sendCode);
        setError('Authentication system not properly initialized');
        setIsLoading(false);
        alert('ERROR: sendCode function not available!');
        return;
      }
      
      console.log('DEBUG: sendCode function is available, proceeding...');
      console.log('DEBUG: Current login state before sendCode:', loginState);
      
      // SIMPLIFIED - Use a basic try/catch approach with direct state updates
      try {
        console.log('DEBUG: Calling sendCode directly with:', { email });
        const result = await sendCode({ email });
        console.log('DEBUG: sendCode call completed, result:', result);
        
        // IMPORTANT: Update UI state directly regardless of callback
        setIsCodeSent(true);
        setIsLoading(false);
        
        console.log('DEBUG: UI state updated directly after sendCode');
      } catch (innerError) {
        console.error('DEBUG: Inner error in sendCode call:', innerError);
        setError(innerError.message || 'Failed to send code');
        setIsLoading(false);
        alert('Error: ' + (innerError.message || 'Failed to send code'));
      }
    } catch (outerError) {
      console.error('DEBUG: Outer error in handleSendCode:', outerError);
      console.error('DEBUG: Error stack:', outerError.stack);
      setError(outerError.message || 'Error processing request');
      setIsLoading(false);
      alert('Error: ' + (outerError.message || 'Unknown error'));
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Verification code is required');
      return;
    }

    console.log('Verifying code:', verificationCode, 'for email:', email);
    
    setError('');
    setIsLoading(true);
    
    try {
      // Special handling for test code in development
      if (__DEV__ && verificationCode === "123456") {
        console.log('Development mode test code detected');
        // In a real app, you'd navigate to the authenticated area here
        router.replace('/home');
        return;
      }
      
      console.log('Attempting to verify with Privy loginWithCode');
      
      // Use Privy's loginWithCode method from useLoginWithEmail hook
      await loginWithCode({ 
        code: verificationCode, 
        email // Explicitly passing email as recommended in the docs
      });
      
      // The onLoginSuccess callback will handle navigation
    } catch (error: any) {
      console.error('Error verifying code:', error);
      setError(error.message || 'Invalid verification code. Please try again.');
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ampli</Text>
          <Text style={styles.logoArrow}>^</Text>
        </View>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your Ampli account</Text>
          
          {!isCodeSent ? (
            // Email Input Form
            <>
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
                onPress={(e) => {
                  console.log('DEBUG: Continue button pressed directly');
                  // Display immediate visual feedback
                  setIsLoading(true);
                  // Add a timeout to ensure UI updates before processing
                  setTimeout(() => {
                    try {
                      handleSendCode();
                    } catch (err) {
                      console.error('ERROR in button handler:', err);
                      alert('Error in button handler: ' + (err.message || 'Unknown error'));
                      setIsLoading(false);
                    }
                  }, 100);
                }}
                disabled={isLoading}
                activeOpacity={0.7}
                testID="continue-button"
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
              
              {/* Add alternative button as fallback */}
              {!isLoading && (
                <TouchableOpacity 
                  style={[styles.alternativeButton]} 
                  onPress={() => {
                    console.log('DEBUG: Alternative button pressed');
                    if (!validateEmail(email)) {
                      alert('Please enter a valid email address');
                      return;
                    }
                    
                    alert('Sending verification code via alternative button');
                    
                    try {
                      // Direct call to Privy's sendCode
                      if (typeof sendCode === 'function') {
                        sendCode({ email });
                        setIsCodeSent(true);
                      } else {
                        alert('sendCode function is not available');
                      }
                    } catch (err) {
                      console.error('ERROR in alternative button:', err);
                      alert('Error: ' + (err.message || 'Unknown error'));
                    }
                  }}
                >
                  <Text style={styles.alternativeButtonText}>Try Alternate Method</Text>
                </TouchableOpacity>
              )}

              {/* Add force verification button for testing */}
              {DEBUG_MODE && !isCodeSent && (
                <TouchableOpacity 
                  style={styles.debugButton} 
                  onPress={() => {
                    console.log('DEBUG: Force verification button pressed');
                    // Force transition to verification screen
                    setIsCodeSent(true);
                    alert('Forced navigation to verification screen');
                  }}
                >
                  <Text style={styles.debugButtonText}>Force Verification Screen</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            // Verification Code Input Form
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <Text style={styles.verificationText}>
                  We've sent a verification code to {email}
                </Text>
                <TextInput
                  style={[styles.input, error ? styles.inputError : null]}
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChangeText={(text) => {
                    setVerificationCode(text);
                    if (error) setError('');
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
              </View>
              
              <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]} 
                onPress={handleVerifyCode}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.resendContainer}
                onPress={() => {
                  setVerificationCode('');
                  handleSendCode();
                }}
                disabled={isLoading}
              >
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}
          
          {/* Sign Up Link */}
          <View style={styles.signupOptions}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <Link href="/" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
          
          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2023 Ampli money</Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Terms</Text>
            <Text style={styles.footerLink}>About</Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0052B4',
  },
  logoArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0052B4',
  },
  mainContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0052B4',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
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
  verificationText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
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
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#0052B4',
    fontWeight: '600',
  },
  signupOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
    color: '#666666',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0052B4',
    marginLeft: 8,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#0052B4',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  copyright: {
    fontSize: 12,
    color: '#666',
  },
  footerLinks: {
    flexDirection: 'row',
    marginTop: 8,
  },
  footerLink: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
  },
  alternativeButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  alternativeButtonText: {
    color: '#0052B4',
    fontSize: 14,
    fontWeight: '600',
  },
  debugButton: {
    marginTop: 10,
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#721c24',
    fontSize: 12,
    fontWeight: '600',
  },
}); 