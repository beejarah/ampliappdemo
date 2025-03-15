import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { usePrivy, useLoginWithEmail } from '@privy-io/expo';

export default function SigninScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Use Privy's email login hook directly
  const { 
    sendCode, 
    loginWithCode, 
    state: loginState
  } = useLoginWithEmail({
    onSendCodeSuccess: (emailData) => {
      console.log('DEBUG: onSendCodeSuccess callback triggered with:', emailData);
      // Handle transition to verification screen
      router.push({
        pathname: '/verification',
        params: { email: email }
      });
    },
    onError: (err) => {
      console.error('DEBUG: Privy onError callback triggered:', err);
      setError(err.message || 'Authentication failed');
      setIsLoading(false);
      alert('Error: ' + (err.message || 'Authentication failed'));
    }
  });
  
  // Debug logging
  useEffect(() => {
    console.log('DEBUG: SigninScreen mounted');
    console.log('DEBUG: sendCode availability:', typeof sendCode === 'function');
  }, []);
  
  // Monitor login state changes
  useEffect(() => {
    console.log('DEBUG: loginState changed:', loginState);
  }, [loginState]);
  
  const handleContinue = async () => {
    console.log('DEBUG: Continue button pressed');
    
    // Immediate feedback
    setIsLoading(true);
    
    // Validate email
    if (!email.trim()) {
      console.log('DEBUG: Email validation failed - empty');
      setError('Please enter your email');
      setIsLoading(false);
      return;
    }
    
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      console.log('DEBUG: Email validation failed - invalid format');
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    
    console.log('DEBUG: Email validation passed for:', email);
    setError('');
    
    try {
      console.log('DEBUG: Attempting to send verification code...');
      
      // Check sendCode availability
      if (typeof sendCode !== 'function') {
        console.error('DEBUG: sendCode function not available!');
        alert('Authentication system not available');
        setIsLoading(false);
        return;
      }
      
      // Visual confirmation
      alert('Sending verification code to: ' + email);
      
      // Send verification code
      console.log('DEBUG: Calling sendCode with:', email);
      const result = await sendCode({ email });
      console.log('DEBUG: sendCode result:', result);
      
      // The callback should handle navigation, but provide fallback
      setTimeout(() => {
        if (isLoading) {
          console.log('DEBUG: Fallback - direct navigation');
          setIsLoading(false);
          router.push({
            pathname: '/verification',
            params: { email: email }
          });
        }
      }, 3000);
      
    } catch (error) {
      console.error('DEBUG: Error sending verification code:', error);
      setError(error.message || 'Failed to send verification code');
      setIsLoading(false);
      alert('Error: ' + (error.message || 'Failed to send verification code'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Sign in to your account</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor="#666666"
            />
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
            
            <TouchableOpacity 
              style={[styles.continueButton, isLoading && styles.disabledButton]} 
              onPress={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#333333" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
            
            {/* Debug button */}
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={() => {
                console.log('DEBUG: Debug button pressed');
                alert('Debug button pressed - email: ' + email);
                // Force navigate to verification
                router.push({
                  pathname: '/verification',
                  params: { email: email }
                });
              }}
            >
              <Text style={styles.debugButtonText}>Debug: Go to Verification</Text>
            </TouchableOpacity>
            
            <Text style={styles.orText}>or</Text>
            
            <TouchableOpacity style={styles.socialButton}>
              <AntDesign name="apple1" size={20} color="black" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Login with Apple</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton}>
              <View style={styles.googleIconContainer}>
                <Text style={styles.googleLetter}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Login with Google</Text>
            </TouchableOpacity>
            
            <Text style={styles.termsText}>
              By signing in you agree to Ampli's{' '}
              <Text style={styles.termsLink}>Terms of Use</Text>
              {' '}and{' '}
              <Text 
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://ampli.money/privacy-policy.html')}
              >
                Privacy Policy
              </Text>.
            </Text>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.footerContent}>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
              
              <View style={styles.signInContainer}>
                <Text style={styles.alreadyUserText}>New user?</Text>
                <Link href="/signup" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signInLink}> Sign up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
            
            <Text style={styles.copyrightText}>© 2025 Ampli.money</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    color: '#005BB2',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 26,
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 28,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 16,
    color: '#333333',
  },
  continueButton: {
    height: 56,
    backgroundColor: '#F0F0F0',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  disabledButton: {
    opacity: 0.7,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 8,
    fontSize: 14,
  },
  orText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 16,
  },
  socialButton: {
    height: 56,
    backgroundColor: '#F0F0F0',
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  socialIcon: {
    marginRight: 8,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  googleLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  termsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',
    marginTop: 8,
    lineHeight: 20,
  },
  termsLink: {
    color: '#0052B4',
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#666666',
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alreadyUserText: {
    fontSize: 14,
    color: '#666666',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0052B4',
  },
  copyrightText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  debugButton: {
    marginTop: 10,
    backgroundColor: '#f8d7da',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#721c24',
    fontSize: 12,
    fontWeight: '500',
  },
}); 