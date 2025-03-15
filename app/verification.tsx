import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePrivyEmailVerification } from '../hooks/usePrivyEmailVerification';
import Svg, { Path } from 'react-native-svg';

// Error Icon component
const ErrorIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1Z"
      fill="#E61A1A"
    />
    <Path
      d="M8 4V10M8 11.9333V12"
      stroke="#F2F2F2"
      strokeLinecap="round"
    />
  </Svg>
);

// Spinner component
const Spinner = ({ color = "white" }) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none">
    <Path 
      d="M23.5 12C23.5 5.92487 18.5751 1 12.5 1C6.42487 1 1.5 5.92487 1.5 12C1.5 18.0751 6.42487 23 12.5 23" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </Svg>
);

export default function VerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isCodeIncorrect, setIsCodeIncorrect] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { 
    isLoading, 
    error, 
    verifyCode, 
    resendVerificationCode, 
    authState,
    debugState,
    checkIfUserExists,
    markUserAsVerified
  } = usePrivyEmailVerification();
  
  // Log debug info on mount
  useEffect(() => {
    if (__DEV__) {
      console.log('VerificationScreen mounted with email:', email);
      console.log('Current auth state on mount:', authState);
      // Log debug info
      debugState();
    }
  }, []);
  
  // Focus first input on mount
  useEffect(() => {
    // Short delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Set up keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Handle input change for each digit
  const handleCodeChange = (text: string, index: number) => {
    // Reset error state when user starts typing again
    if (isCodeIncorrect) {
      setIsCodeIncorrect(false);
    }

    if (text.length > 1) {
      // If pasting multiple digits, distribute them
      const digits = text.split('').slice(0, 6);
      const newCode = [...code];

      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });

      setCode(newCode);

      // Focus on the next empty input or the last one
      const nextIndex = Math.min(index + digits.length, 5);
      if (nextIndex < 6) {
        inputRefs.current[nextIndex]?.focus();
        setFocusedIndex(nextIndex);
      } else {
        // If all digits are filled, verify the code
        verifyEnteredCode(newCode.join(''));
      }
    } else {
      // Handle single digit input
      const newCode = [...code];

      // Always replace the current digit (even if it already has a value)
      newCode[index] = text;
      setCode(newCode);

      // Auto-advance to next input
      if (text !== '' && index < 5) {
        inputRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      } else if (text !== '' && index === 5) {
        // If the last digit is entered, verify the code
        verifyEnteredCode(newCode.join(''));
      }
    }
  };

  // Handle backspace key press - delete current character and move to previous field
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newCode = [...code];
      
      // If current field has a value, clear it
      if (code[index] !== '') {
        newCode[index] = '';
        setCode(newCode);
      } 
      // If current field is empty and not the first field, move to previous field AND clear it
      else if (index > 0) {
        // Clear the previous field
        newCode[index - 1] = '';
        setCode(newCode);
        
        // Move focus to the previous field
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    }
  };

  // Handle focus change
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    
    // Don't clear the field when it receives focus
    // This allows users to see what they typed and make corrections
  };

  // Verify the entered code
  const verifyEnteredCode = async (fullCode: string) => {
    if (__DEV__) {
      console.log('verifyEnteredCode called with code:', fullCode, 'for email:', email);
      console.log('Current auth state before verification:', authState);
      // Log debug info before verification
      debugState();
    }
    
    // Reset error state before verification
    setIsCodeIncorrect(false);
    
    if (fullCode.length === 6 && email) {
      try {
        setIsVerifying(true);
        
        // STRICT CHECK: Only allow test code "123456" in development mode
        if (__DEV__ && fullCode === "123456") {
          if (__DEV__) console.log('Valid test code "123456" detected, proceeding to create password screen');
          // Simulate a delay to show the spinner
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Only dismiss keyboard on successful verification
          Keyboard.dismiss();
          
          // Check if user already exists (returning user)
          try {
            // We'll add a simple check using the auth state to determine if this is a returning user
            const isReturningUser = await checkIfUserExists(email);
            
            if (isReturningUser) {
              if (__DEV__) console.log('Detected returning user, skipping password creation');
              // Navigate directly to balance page in tabs for returning users
              router.replace('/(tabs)');
            } else {
              if (__DEV__) console.log('New user detected, proceeding to create password');
              // Navigate to create password screen for new users
              router.push({
                pathname: '/create-password',
                params: { email }
              });
            }
          } catch (err) {
            if (__DEV__) console.log('Error checking user status:', err);
            // Default to password creation flow if check fails
            router.push({
              pathname: '/create-password',
              params: { email }
            });
          }
          return;
        }
        
        // For real verification with Privy (only if it's not the test code)
        if (fullCode !== "123456") {
          if (__DEV__) console.log('Attempting to verify code with Privy:', fullCode);
          const success = await verifyCode(email, fullCode);
          if (__DEV__) {
            console.log('Verification result:', success);
            console.log('Auth state after verification:', authState);
            console.log('Error after verification:', error);
            // Log debug info after verification
            debugState();
          }
          
          if (success) {
            if (__DEV__) console.log('Verification successful, proceeding to next screen');
            
            // Mark this user as verified in our local store (for future reference)
            await markUserAsVerified(email);
            
            // Only dismiss keyboard on successful verification
            Keyboard.dismiss();
            
            // Check if user already exists (returning user)
            try {
              // We'll add a simple check using the auth state to determine if this is a returning user
              const isReturningUser = await checkIfUserExists(email);
              
              if (isReturningUser) {
                if (__DEV__) console.log('Detected returning user, skipping password creation');
                // Navigate directly to balance page in tabs for returning users
                router.replace('/(tabs)');
              } else {
                if (__DEV__) console.log('New user detected, proceeding to create password');
                // Navigate to create password screen for new users
                router.push({
                  pathname: '/create-password',
                  params: { email }
                });
              }
            } catch (err) {
              if (__DEV__) console.log('Error checking user status:', err);
              // Default to password creation flow if check fails
              router.push({
                pathname: '/create-password',
                params: { email }
              });
            }
          } else {
            // Show inline error for incorrect code
            if (__DEV__) console.log('Verification failed with error:', error);
            setIsCodeIncorrect(true);
            
            // CRITICAL FIX: Ensure keyboard stays visible on error
            // Focus on the last input field to keep keyboard visible
            if (inputRefs.current[5]) {
              setTimeout(() => {
                inputRefs.current[5].focus();
              }, 100);
            }
          }
        } else {
          // If we get here with code "123456" but not in development mode, reject it
          setIsCodeIncorrect(true);
          if (__DEV__) console.log('Test code "123456" used outside of development mode, rejecting');
          
          // Keep keyboard visible
          if (inputRefs.current[5]) {
            setTimeout(() => {
              inputRefs.current[5].focus();
            }, 100);
          }
        }
      } catch (err: any) {
        if (__DEV__) {
          console.error('Error in verifyEnteredCode:', err);
          console.error('Error details:', JSON.stringify(err, null, 2));
        }
        setIsCodeIncorrect(true);
        
        // CRITICAL FIX: Ensure keyboard stays visible on error
        // Focus on the last input field to keep keyboard visible
        if (inputRefs.current[5]) {
          setTimeout(() => {
            inputRefs.current[5].focus();
          }, 100);
        }
      } finally {
        setIsVerifying(false);
      }
    } else {
      if (__DEV__) console.log('Invalid code length or missing email');
      if (!email) {
        Alert.alert('Error', 'Email is missing. Please go back and try again.');
      } else if (fullCode.length !== 6) {
        setIsCodeIncorrect(true);
      }
    }
  };

  // Handle resend code button press
  const handleResendCode = async () => {
    if (__DEV__) {
      console.log('handleResendCode called for email:', email);
      console.log('Current auth state before resend:', authState);
      // Log debug info before resend
      debugState();
    }
    
    // Reset error state when resending code
    setIsCodeIncorrect(false);
    
    if (email) {
      try {
        setIsResending(true);
        
        const success = await resendVerificationCode(email);
        console.log('Resend result:', success);
        console.log('Auth state after resend:', authState);
        console.log('Error after resend:', error);
        
        if (__DEV__) {
          // Log debug info after resend
          debugState();
        }
        
        if (success) {
          // Check if we're in development mode
          if (error && error.includes('development mode') && __DEV__) {
            console.log('Development mode detected, would show resend info in dev environment');
          } else {
            Alert.alert('Success', 'A new verification code has been sent to your email.');
          }
        } else {
          Alert.alert(
            'Resend Error',
            error || 'Failed to resend verification code. Please try again.',
            [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
          );
        }
      } catch (err: any) {
        console.error('Error in handleResendCode:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        Alert.alert(
          'Error',
          err.message || 'An unexpected error occurred',
          [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
        );
      } finally {
        setIsResending(false);
      }
    } else {
      Alert.alert('Error', 'Email is missing. Please go back and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Enter confirmation code sent to:</Text>
          <Text style={styles.email}>{email}</Text>
          
          <Text style={styles.codeLabel}>Code</Text>
          
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[
                  styles.codeInput,
                  focusedIndex === index && !isCodeIncorrect && styles.codeInputFocused,
                  isCodeIncorrect && styles.codeInputError
                ]}
                value={digit}
                onChangeText={text => handleCodeChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                onFocus={() => handleFocus(index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                editable={!isLoading && !isVerifying && !isResending}
                caretHidden={true}
              />
            ))}
          </View>
          
          {isCodeIncorrect && (
            <View style={styles.errorMessageContainer}>
              <ErrorIcon />
              <Text style={styles.errorMessageText}>Incorrect code. Please try again.</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.resendButton}
            onPress={handleResendCode}
            disabled={isLoading || isVerifying || isResending}
          >
            {isResending ? (
              <View style={styles.spinnerContainer}>
                <Spinner color="#333333" />
              </View>
            ) : (
              <Text style={styles.resendButtonText}>Resend code</Text>
            )}
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    color: '#005BB2', // Brand-500 color
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 26,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  email: {
    color: '#005BB2', // Brand-500 color
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 26,
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'left',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '500',
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  codeInputFocused: {
    borderColor: '#005BB2', // Blue border for focused input
    borderWidth: 2,
  },
  codeInputError: {
    borderColor: '#E61A1A', // Red border for error state
    borderWidth: 2,
  },
  errorMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorMessageText: {
    color: '#333333',
    fontSize: 14,
    marginLeft: 8,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButton: {
    marginTop: 24,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#E5E5E5', // Grey background
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
  },
  resendButtonText: {
    color: '#333333', // Darker text for better contrast on grey
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 