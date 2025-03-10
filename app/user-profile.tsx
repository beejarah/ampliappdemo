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
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePrivy } from '@privy-io/expo';
import { Ionicons } from '@expo/vector-icons';

// Spinner component
const Spinner = ({ color = "white" }) => (
  <ActivityIndicator size="small" color={color} />
);

export default function UserProfileScreen() {
  const router = useRouter();
  const { user } = usePrivy();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);
  
  const firstNameInputRef = useRef<TextInput>(null);
  const lastNameInputRef = useRef<TextInput>(null);
  
  // Focus first name input on mount
  useEffect(() => {
    // Short delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      if (firstNameInputRef.current) {
        firstNameInputRef.current.focus();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle continue button press
  const handleContinue = async () => {
    if (!firstName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first name.');
      return;
    }
    
    if (!lastName.trim()) {
      Alert.alert('Missing Information', 'Please enter your last name.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Saving user profile data:', { firstName, lastName });
      
      // Store user profile data
      await AsyncStorage.setItem('user_first_name', firstName);
      await AsyncStorage.setItem('user_last_name', lastName);
      
      // Set the flag to prevent redirect loops
      await AsyncStorage.setItem('coming_from_password_creation', 'true');
      
      // Add a small delay to ensure AsyncStorage operations complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Show the Terms of Service modal instead of navigating
      console.log('Showing Terms of Service modal');
      setShowTermsModal(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error saving user profile:', error);
      Alert.alert('Error', 'Failed to save your profile information. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle accept terms button press
  const handleAcceptTerms = async () => {
    setIsAcceptingTerms(true);
    
    try {
      console.log('User accepted Terms of Service');
      
      // Store acceptance in AsyncStorage
      await AsyncStorage.setItem('has_accepted_terms', 'true');
      
      // Try to update the Privy user's has_accepted_terms field if possible
      try {
        if (user) {
          console.log('Updating Privy user has_accepted_terms field');
          // In a real implementation, you would call the Privy API to update the user
          console.log('Would update Privy user:', user?.id);
        }
      } catch (privyError) {
        console.warn('Could not update Privy user:', privyError);
        // Continue anyway since we've stored the acceptance in AsyncStorage
      }
      
      // Navigate to the wallet balance page
      console.log('Navigating to wallet balance page after TOS acceptance');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error handling TOS acceptance:', error);
      Alert.alert('Error', 'Failed to process your acceptance. Please try again.');
      setIsAcceptingTerms(false);
    }
  };
  
  // Handle cancel button press
  const handleCancelTerms = () => {
    console.log('User declined Terms of Service');
    setShowTermsModal(false);
    router.replace('/signup');
  };

  // Handle close button press
  const handleCloseTerms = () => {
    handleCancelTerms();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>What should we call you?</Text>
          
          <Text style={styles.subtitle}>
            You can make changes later when we verify your account.
          </Text>
          
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>First name</Text>
            <TextInput
              ref={firstNameInputRef}
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => lastNameInputRef.current?.focus()}
              editable={!isLoading}
            />
          </View>
          
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Last name</Text>
            <TextInput
              ref={lastNameInputRef}
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              editable={!isLoading}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner color="white" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Terms of Service Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTermsModal}
        onRequestClose={handleCancelTerms}
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
                style={styles.acceptButton}
                onPress={handleAcceptTerms}
                disabled={isAcceptingTerms}
              >
                {isAcceptingTerms ? (
                  <Spinner color="white" />
                ) : (
                  <Text style={styles.acceptButtonText}>Agree</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelTerms}
                disabled={isAcceptingTerms}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
  subtitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 24,
    lineHeight: 22,
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
  input: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333333',
  },
  continueButton: {
    backgroundColor: '#005BB2',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 8,
  },
  acceptButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#005BB2', // Blue for active button
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '500',
  },
  privacyLink: {
    color: '#005BB2',
    fontWeight: '600',
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
}); 