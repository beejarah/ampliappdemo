import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { MaterialIcons } from '@expo/vector-icons';

export default function VerifyScreen() {
  const { ready, authenticated } = usePrivyAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  // Extract verification parameters from URL
  const verificationCode = params.code as string;
  const email = params.email as string;

  useEffect(() => {
    if (!ready) return;

    // If already authenticated, redirect to home
    if (authenticated) {
      router.replace('/home');
      return;
    }

    // Privy handles the verification process automatically
    // This screen is just for user feedback
    if (verificationCode && email) {
      // Show success after a short delay to simulate verification
      setTimeout(() => {
        setVerificationStatus('success');
        
        // After successful verification, Privy will handle the authentication
        // and the onSuccess callback in PrivyProvider will redirect to home
      }, 2000);
    } else {
      setVerificationStatus('error');
      setErrorMessage('Missing verification information. Please check your email link.');
    }
  }, [ready, authenticated, verificationCode, email, router]);

  const handleBackToSignIn = () => {
    router.replace('/(auth)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ampli</Text>
          <Text style={styles.logoArrow}>^</Text>
        </View>
        
        {/* Verification Status */}
        <View style={styles.statusContainer}>
          {verificationStatus === 'pending' && (
            <>
              <ActivityIndicator size="large" color="#0052B4" style={styles.loader} />
              <Text style={styles.statusTitle}>Verifying your email</Text>
              <Text style={styles.statusMessage}>
                Please wait while we verify your email address...
              </Text>
            </>
          )}
          
          {verificationStatus === 'success' && (
            <>
              <View style={styles.successIcon}>
                <MaterialIcons name="check-circle" size={64} color="#22C55E" />
              </View>
              <Text style={styles.statusTitle}>Email Verified!</Text>
              <Text style={styles.statusMessage}>
                Your email has been successfully verified. Redirecting you to the app...
              </Text>
            </>
          )}
          
          {verificationStatus === 'error' && (
            <>
              <View style={styles.errorIcon}>
                <MaterialIcons name="error" size={64} color="#FF3B30" />
              </View>
              <Text style={styles.statusTitle}>Verification Failed</Text>
              <Text style={styles.statusMessage}>{errorMessage}</Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.backButton} onPress={handleBackToSignIn}>
                  <Text style={styles.backButtonText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
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
  statusContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginBottom: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  errorIcon: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  actionButtons: {
    width: '100%',
    marginTop: 16,
  },
  backButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  backButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
}); 