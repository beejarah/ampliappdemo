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
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check Icon component with different states
const CheckIcon = ({ isMet, hasAttemptedSubmit = false }) => {
  // Default state (black)
  let strokeColor = "#1A1A1A";
  
  // If requirement is met (green)
  if (isMet) {
    strokeColor = "#007C29";
  } 
  // If requirement is not met and user has attempted to submit (red)
  else if (hasAttemptedSubmit) {
    strokeColor = "#BA1515";
  }
  
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <G clipPath="url(#clip0_121_13508)">
        <Path 
          d="M14.6668 7.38662V7.99995C14.666 9.43757 14.2005 10.8364 13.3397 11.9878C12.4789 13.1393 11.269 13.9816 9.8904 14.3892C8.51178 14.7968 7.03834 14.7479 5.68981 14.2497C4.34128 13.7515 3.18993 12.8307 2.40747 11.6247C1.62501 10.4186 1.25336 8.99199 1.34795 7.55749C1.44254 6.12299 1.9983 4.7575 2.93235 3.66467C3.8664 2.57183 5.12869 1.81021 6.53096 1.49338C7.93322 1.17656 9.40034 1.32151 10.7135 1.90662M14.6668 2.66661L8.00017 9.33995L6.00017 7.33995" 
          stroke={strokeColor}
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_121_13508">
          <Rect width="16" height="16" fill="white"/>
        </ClipPath>
      </Defs>
    </Svg>
  );
};

// Eye Icon component for password visibility toggle
const EyeIcon = ({ visible }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {visible ? (
      <>
        <Path
          d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z"
          stroke="#333333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
          stroke="#333333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <>
        <Path
          d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z"
          stroke="#333333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
          stroke="#333333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M4 20L20 4"
          stroke="#333333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )}
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

export default function CreatePasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  
  // Password validation states
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpperLower: false,
    hasSymbol: false,
    hasNumber: false
  });
  
  // Focus password input on mount
  useEffect(() => {
    // Short delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Validate password on change
  useEffect(() => {
    validatePassword(password);
  }, [password]);
  
  // Password validation function
  const validatePassword = (value: string) => {
    const newValidations = {
      minLength: value.length >= 8,
      hasUpperLower: /(?=.*[a-z])(?=.*[A-Z])/.test(value),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value),
      hasNumber: /\d/.test(value)
    };
    
    console.log('Password validation updated:', newValidations);
    setValidations(newValidations);
  };
  
  // Check if all validations pass
  const isPasswordValid = () => {
    return Object.values(validations).every(v => v === true);
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  // Handle password change
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // This will trigger the useEffect that calls validatePassword
  };
  
  // Handle continue button press
  const handleContinue = async () => {
    // Mark that user has attempted to submit
    setHasAttemptedSubmit(true);
    
    if (!isPasswordValid()) {
      Alert.alert('Invalid Password', 'Please ensure your password meets all requirements.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Password is valid, proceeding to user profile');
      
      // Here you would typically call your API to set the user's password
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to the user profile screen
      console.log('Navigating to user profile screen');
      router.replace('/user-profile');
    } catch (error) {
      console.error('Error setting password:', error);
      Alert.alert('Error', 'Failed to set password. Please try again.');
    } finally {
      setIsLoading(false);
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
          <Text style={styles.title}>Create a password</Text>
          
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>New password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                ref={passwordInputRef}
                style={styles.passwordInput}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!isPasswordVisible}
                placeholder="Password"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.visibilityToggle}
                onPress={togglePasswordVisibility}
                disabled={isLoading}
              >
                <EyeIcon visible={isPasswordVisible} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.requirementsContainer}>
            <View style={styles.requirementRow}>
              <CheckIcon isMet={validations.minLength} hasAttemptedSubmit={hasAttemptedSubmit} />
              <Text style={[
                styles.requirementText,
                (hasAttemptedSubmit && !validations.minLength) ? styles.requirementTextError : null
              ]}>
                A minimum of 8 characters
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <CheckIcon isMet={validations.hasUpperLower} hasAttemptedSubmit={hasAttemptedSubmit} />
              <Text style={[
                styles.requirementText,
                (hasAttemptedSubmit && !validations.hasUpperLower) ? styles.requirementTextError : null
              ]}>
                Lower and uppercase letters
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <CheckIcon isMet={validations.hasSymbol} hasAttemptedSubmit={hasAttemptedSubmit} />
              <Text style={[
                styles.requirementText,
                (hasAttemptedSubmit && !validations.hasSymbol) ? styles.requirementTextError : null
              ]}>
                At least one symbol
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <CheckIcon isMet={validations.hasNumber} hasAttemptedSubmit={hasAttemptedSubmit} />
              <Text style={[
                styles.requirementText,
                (hasAttemptedSubmit && !validations.hasNumber) ? styles.requirementTextError : null
              ]}>
                At least one number
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.continueButton,
              isPasswordValid() ? styles.continueButtonActive : styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!isPasswordValid() || isLoading}
          >
            {isLoading ? (
              <View style={styles.spinnerContainer}>
                <Spinner color="white" />
              </View>
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
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
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'left',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333333',
  },
  visibilityToggle: {
    padding: 8,
  },
  requirementsContainer: {
    marginBottom: 40,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  requirementText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  requirementTextError: {
    color: '#BA1515', // Red color for unmet requirements after submission attempt
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  continueButtonActive: {
    backgroundColor: '#005BB2', // Blue for active button
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC', // Grey for disabled button
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 