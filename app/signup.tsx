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
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { usePrivyEmailVerification } from '../hooks/usePrivyEmailVerification';

// Apple logo SVG component
const AppleLogo = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.0632 17.5861C19.7608 18.2848 19.4028 18.928 18.988 19.5193C18.4226 20.3255 17.9596 20.8835 17.6028 21.1934C17.0498 21.702 16.4572 21.9625 15.8226 21.9773C15.3671 21.9773 14.8177 21.8477 14.1782 21.5847C13.5367 21.323 12.9471 21.1934 12.4079 21.1934C11.8425 21.1934 11.2361 21.323 10.5875 21.5847C9.93789 21.8477 9.41457 21.9847 9.01446 21.9983C8.40596 22.0242 7.79944 21.7563 7.19403 21.1934C6.80762 20.8563 6.3243 20.2786 5.74531 19.4601C5.12409 18.586 4.61337 17.5725 4.21326 16.417C3.78475 15.1689 3.56995 13.9603 3.56995 12.7902C3.56995 11.4498 3.85957 10.2938 4.43967 9.32509C4.89558 8.54696 5.50211 7.93316 6.26122 7.48255C7.02033 7.03195 7.84055 6.80233 8.72385 6.78763C9.20717 6.78763 9.84098 6.93714 10.6286 7.23096C11.414 7.52576 11.9183 7.67526 12.1394 7.67526C12.3047 7.67526 12.865 7.50045 13.8147 7.15195C14.7128 6.82874 15.4708 6.69492 16.0918 6.74764C17.7744 6.88343 19.0386 7.54675 19.8793 8.74177C18.3744 9.6536 17.63 10.9307 17.6448 12.5691C17.6584 13.8452 18.1213 14.9071 19.0312 15.7503C19.4435 16.1417 19.904 16.4441 20.4163 16.6589C20.3052 16.9812 20.1879 17.2898 20.0632 17.5861ZM16.2041 2.40011C16.2041 3.40034 15.8387 4.33425 15.1103 5.19867C14.2313 6.22629 13.1682 6.8201 12.0152 6.7264C12.0005 6.60641 11.992 6.48011 11.992 6.3474C11.992 5.38718 12.41 4.35956 13.1524 3.51934C13.523 3.09392 13.9943 2.74019 14.5659 2.45801C15.1362 2.18005 15.6757 2.02632 16.1831 2C16.1979 2.13371 16.2041 2.26744 16.2041 2.4001V2.40011Z"
      fill="#1A1A1A"
    />
  </Svg>
);

// Google logo SVG component
const GoogleLogo = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12.1998 10.1817V14.0545H17.5816C17.3453 15.2999 16.6361 16.3545 15.5725 17.0636L18.8179 19.5818C20.7088 17.8364 21.7997 15.2727 21.7997 12.2273C21.7997 11.5182 21.7361 10.8363 21.6179 10.1818L12.1998 10.1817Z"
      fill="#4285F4"
    />
    <Path
      d="M6.59552 13.9034L5.86355 14.4637L3.2726 16.4818C4.91805 19.7454 8.29052 22 12.1996 22C14.8995 22 17.1633 21.109 18.8179 19.5818L15.5725 17.0636C14.6815 17.6636 13.545 18.0273 12.1996 18.0273C9.5996 18.0273 7.39057 16.2728 6.59961 13.9091L6.59552 13.9034Z"
      fill="#34A853"
    />
    <Path
      d="M3.2726 7.51816C2.59082 8.86356 2.19995 10.3818 2.19995 11.9999C2.19995 13.6181 2.59082 15.1364 3.2726 16.4818C3.2726 16.4909 6.59993 13.8999 6.59993 13.8999C6.39993 13.2999 6.28171 12.6635 6.28171 11.9998C6.28171 11.3361 6.39993 10.6998 6.59993 10.0998L3.2726 7.51816Z"
      fill="#FBBC05"
    />
    <Path
      d="M12.1998 5.98181C13.6725 5.98181 14.9816 6.49089 16.0271 7.47272L18.8907 4.60912C17.1543 2.99097 14.8998 2 12.1998 2C8.29073 2 4.91805 4.24542 3.2726 7.51816L6.59993 10.0998C7.39079 7.73611 9.5998 5.98181 12.1998 5.98181Z"
      fill="#EA4335"
    />
  </Svg>
);

// Warning triangle icon component
const WarningIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.64388 1.82054C6.99629 1.10673 7.88905 0.800388 8.63791 1.1363C8.90835 1.2576 9.1335 1.45271 9.2858 1.69537L9.35576 1.82054L14.857 12.9634C15.2094 13.6772 14.888 14.5281 14.1392 14.864C13.9795 14.9357 13.8081 14.9797 13.633 14.9945L13.5011 15H2.49858C1.67094 15 1 14.3605 1 13.5716C1 13.4034 1.03117 13.2368 1.09173 13.0795L1.14264 12.9634L6.64388 1.82054Z"
      fill="#F27F0D"
    />
    <Path
      d="M8 5V11M8 12.9333V13"
      stroke="#F2F2F2"
      strokeLinecap="round"
    />
  </Svg>
);

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const { isLoading, error, sendVerificationCode, authState } = usePrivyEmailVerification();

  // Function to validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle continue button press
  const handleContinue = async () => {
    console.log('Continue button pressed');
    const isValid = validateEmail(email);
    console.log('Email validation result:', isValid, 'for email:', email);
    setIsEmailValid(isValid);
    
    if (isValid) {
      console.log('Email is valid, proceeding to verification');
      
      try {
        // Send verification code using Privy
        console.log('Attempting to send verification code...');
        console.log('Current auth state:', authState);
        const success = await sendVerificationCode(email);
        console.log('Verification code send result:', success);
        console.log('New auth state after sending code:', authState);
        
        if (success) {
          // Check if we're in development mode
          if (error && error.includes('development mode') && __DEV__) {
            console.log('Development mode detected, would show test code info in dev environment');
            console.log('Navigating to verification screen');
            router.push({
              pathname: '/verification',
              params: { email }
            });
          } else {
            console.log('Navigating to verification screen');
            router.push({
              pathname: '/verification',
              params: { email }
            });
          }
        } else {
          console.log('Failed to send verification code');
          // Show an alert with the error message
          Alert.alert(
            'Verification Error',
            error || 'Failed to send verification code. Please try again.',
            [
              {
                text: 'OK',
                onPress: () => console.log('OK Pressed')
              }
            ]
          );
        }
      } catch (err: any) {
        console.error('Error in handleContinue:', err);
        Alert.alert(
          'Error',
          err.message || 'An unexpected error occurred',
          [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
        );
      }
    }
  };

  // Handle Terms of Service link press
  const handleTermsPress = () => {
    setShowTermsModal(true);
  };

  // Handle close button press for Terms modal
  const handleCloseTerms = () => {
    setShowTermsModal(false);
  };

  // Add useEffect to hide the "Already logged in" warning
  useEffect(() => {
    // Add a style to hide the warning message
    if (Platform.OS === 'web') {
      // This is for web only - won't affect native
      const style = document.createElement('style');
      style.textContent = `
        /* Hide the "Already logged in" warning message */
        div[role="alert"] {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

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
            <Text style={styles.title}>Create your account</Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, !isEmailValid && styles.inputError]}
                  placeholder="Your email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setIsButtonActive(text.trim().length > 0);
                    if (!isEmailValid) {
                      setIsEmailValid(true);
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderTextColor="#666666"
                  editable={!isLoading}
                />
                
                {!isEmailValid && (
                  <View style={styles.errorContainer}>
                    <WarningIcon />
                    <Text style={styles.errorText}>Enter a valid email address.</Text>
                  </View>
                )}
                
                {error && (
                  <View style={styles.errorContainer}>
                    <WarningIcon />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.continueButton, 
                  isButtonActive ? styles.continueButtonActive : styles.continueButtonInactive,
                  isLoading && styles.continueButtonDisabled
                ]}
                onPress={handleContinue}
                disabled={isLoading || !isButtonActive}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[
                    styles.continueButtonText,
                    isButtonActive ? styles.continueButtonTextActive : styles.continueButtonTextInactive
                  ]}>Continue</Text>
                )}
              </TouchableOpacity>
              
              <Text style={styles.orText}>or</Text>
              
              <TouchableOpacity style={styles.socialButton}>
                <View style={styles.logoContainer}>
                  <AppleLogo />
                </View>
                <Text style={styles.socialButtonText}>Login with Apple</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialButton}>
                <View style={styles.logoContainer}>
                  <GoogleLogo />
                </View>
                <Text style={styles.socialButtonText}>Login with Google</Text>
              </TouchableOpacity>
              
              <Text style={styles.termsText}>
                By signing in you agree to Ampli's{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={handleTermsPress}
                >
                  Terms of Use
                </Text>
                {' '}and{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={() => Linking.openURL('https://ampli.money/privacy-policy.html')}
                >
                  Privacy Policy
                </Text>.
              </Text>
            </View>
          </View>
          
          <View style={styles.footerWrapper}>
            <View style={styles.footer}>
              <View style={styles.footerContent}>
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
                
                <View style={styles.signInContainer}>
                  <Text style={styles.alreadyUserText}>Already a user?</Text>
                  <Link href="/signin" asChild>
                    <TouchableOpacity>
                      <Text style={styles.signInLink}> Sign in</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.copyrightText}>© 2025 Ampli.money</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms of Service Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTermsModal}
        onRequestClose={handleCloseTerms}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.headerContainer}>
              <Text style={styles.modalTitle}>Terms of service</Text>
              <TouchableOpacity onPress={handleCloseTerms} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.termsContainer}>
              <Text style={styles.termsText}>
                <Text style={styles.termsHeading}>Ampli Terms of Service{'\n\n'}</Text>
                <Text style={styles.termsSubheading}>Introduction{'\n'}</Text>
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("User" or "you") and Ampli ("we," "us," or "our") regarding your use of our services, website, and any other platforms we operate. By accessing or using our services, you agree to be bound by these Terms.
                {'\n\n'}
                <Text style={styles.termsSubheading}>Acceptance of Terms{'\n'}</Text>
                Agreement to Terms: By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use our services.
                {'\n\n'}
                Changes to Terms: We reserve the right to modify these Terms at any time. Your continued use of our services after any changes to these Terms will be considered acceptance of those changes.
                {'\n\n'}
                <Text style={styles.termsSubheading}>Definitions{'\n'}</Text>
                "Services" refers to any service provided by Ampli, including but not limited to access to our website, mobile app, or any other platform.
                {'\n\n'}
                "User" refers to any individual or entity using our services.
                {'\n\n'}
                <Text style={styles.termsSubheading}>User Obligations{'\n'}</Text>
                Use of Services: You agree to use our services only for lawful purposes and in compliance with these Terms.
                {'\n\n'}
                User Conduct: You must not use our services to engage in any activity that is illegal, harmful, or offensive. This includes but is not limited to spamming, harassing other users, or violating intellectual property rights.
                {'\n\n'}
                User-Generated Content: You are responsible for any content you submit or post using our services. You agree that such content does not infringe on the rights of others and complies with applicable laws.
                {'\n\n'}
                <Text style={styles.termsSubheading}>Intellectual Property{'\n'}</Text>
                Ownership: All intellectual property rights in our services, including but not limited to trademarks, copyrights, and trade secrets, are owned by Ampli.
                {'\n\n'}
                License: By using our services, you are granted a non-exclusive, non-transferable license to access and use our services for personal or internal business use only.
                {'\n\n'}
                <Text style={styles.termsSubheading}>Payment Terms{'\n'}</Text>
                Payment Obligations: If you purchase a paid service from us, you agree to pay all applicable fees. Payment terms may include automatic renewal unless you cancel your subscription.
                {'\n\n'}
                Refund Policy: Refunds are subject to our discretion and may be provided under specific circumstances as outlined in our refund policy.
                {'\n\n'}
                <Text style={styles.termsSubheading}>Disclaimers and Limitation of Liability{'\n'}</Text>
                Disclaimer of Warranties: Our services are provided "as is" and "as available." We disclaim all warranties, express or implied.
                {'\n\n'}
                Limitation of Liability: We will not be liable for any damages arising from your use of our services, except to the extent required by applicable law.
                {'\n\n'}
                <Text style={styles.termsSubheading}>Termination{'\n'}</Text>
                Termination by Us: We may terminate your access to our services at any time without notice if you breach these Terms.
                {'\n\n'}
                Termination by You: You may terminate your use of our services at any time by ceasing to use them.
                {'\n\n'}
                <Text style={styles.termsSubheading}>Governing Law{'\n'}</Text>
                These Terms will be governed by and construed in accordance with the laws of FL, USA. Any disputes arising from these Terms will be resolved through mediation.
                {'\n\n'}
                <Text style={styles.termsSubheading}>Contact Information{'\n'}</Text>
                For any questions or concerns regarding these Terms, please contact us at info@ampli.money.
                {'\n\n'}
                By continuing to use this application, you agree to our{' '}
                <Text 
                  style={styles.privacyLink}
                  onPress={() => Linking.openURL('https://ampli.money/privacy-policy.html')}
                >
                  Privacy Policy
                </Text>.
              </Text>
            </ScrollView>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={handleCloseTerms}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 0,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
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
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 24, // Space-XL
    alignSelf: 'stretch',
    width: '100%',
  },
  inputGroup: {
    width: '100%',
  },
  input: {
    display: 'flex',
    padding: 12, // Space-M
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12, // Border-Radius-M
    borderWidth: 1,
    borderColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
    width: '100%',
    minHeight: 48,
    fontSize: 16,
    color: '#333333',
  },
  inputError: {
    borderColor: '#F27F0D', // Updated warning orange color to match the icon
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // Space-S (8px)
    alignSelf: 'flex-start',
  },
  errorText: {
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginLeft: 8,
  },
  continueButton: {
    display: 'flex',
    padding: 12, // Space-M
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8, // Space-S
    flex: 1,
    borderRadius: 12, // Border-Radius-M
    width: '100%',
    minHeight: 48,
    justifyContent: 'center',
    marginTop: 0, // Reset any margin
  },
  continueButtonActive: {
    backgroundColor: '#0057A7', // Blue color for active state
  },
  continueButtonInactive: {
    backgroundColor: '#E5E5E5', // Grey color for inactive state
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextActive: {
    color: '#FFFFFF', // White text for active button
  },
  continueButtonTextInactive: {
    color: '#333333', // Dark text for inactive button
  },
  orText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    alignSelf: 'center',
  },
  socialButton: {
    display: 'flex',
    padding: 12, // Space-M
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Space-S
    flex: 1,
    borderRadius: 12, // Border-Radius-M
    backgroundColor: '#E5E5E5', // Background-Neutral
    width: '100%',
    minHeight: 48,
    justifyContent: 'center',
  },
  logoContainer: {
    width: 24,
    height: 24,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333', // Text/Secondary
    marginLeft: 8,
  },
  termsText: {
    color: '#333333', // Text-Secondary
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14, // Link-M-Semi-Bold-Size
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20, // Link-M-Semi-Bold-Line-Height
    letterSpacing: 0, // Link-M-Semi-Bold-Letter-Spacing
    textAlign: 'left',
    width: '100%',
    paddingHorizontal: 4,
  },
  termsLink: {
    color: '#0057A7', // Text-Link (display-p3 0.0314 0.3412 0.651)
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14, // Link-M-Semi-Bold-Size
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20, // Link-M-Semi-Bold-Line-Height
    letterSpacing: 0, // Link-M-Semi-Bold-Letter-Spacing
    textDecorationLine: 'underline',
  },
  footerWrapper: {
    width: '100%',
    height: 111,
  },
  footer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: 111,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: '#E5E5E5',
    width: '100%',
    marginVertical: 16,
  },
  footerContent: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    alignSelf: 'stretch',
    width: '100%',
  },
  forgotPasswordText: {
    color: '#333333', // Text-Secondary
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14, // Link-M-Semi-Bold-Size
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20, // Link-M-Semi-Bold-Line-Height
    letterSpacing: 0, // Link-M-Semi-Bold-Letter-Spacing
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alreadyUserText: {
    color: '#333333', // Text-Secondary
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14, // Link-M-Semi-Bold-Size
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20, // Link-M-Semi-Bold-Line-Height
    letterSpacing: 0, // Link-M-Semi-Bold-Letter-Spacing
  },
  signInLink: {
    color: '#0057A7', // Text-Link (display-p3 0.0314 0.3412 0.651)
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14, // Link-M-Semi-Bold-Size
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20, // Link-M-Semi-Bold-Line-Height
    letterSpacing: 0, // Link-M-Semi-Bold-Letter-Spacing
    textDecorationLine: 'underline',
  },
  copyrightText: {
    color: '#333333', // Text-Secondary
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14, // Link-M-Semi-Bold-Size
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20, // Link-M-Semi-Bold-Line-Height
    letterSpacing: 0, // Link-M-Semi-Bold-Letter-Spacing
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 361,
    padding: 16, // var(--Space-L, 16px)
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 24, // var(--Space-XL, 24px)
    borderRadius: 16, // var(--Border-Radius-L, 16px)
    backgroundColor: '#FFF', // var(--Surface-L3, #FFF)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  closeButton: {
    padding: 4,
  },
  termsContainer: {
    width: '100%',
    maxHeight: 400,
    marginBottom: 16,
  },
  termsHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#005BB2',
  },
  termsSubheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 8,
  },
  closeModalButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#005BB2', // Blue for active button
    borderRadius: 8,
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyLink: {
    color: '#005BB2',
    fontWeight: '600',
  },
}); 