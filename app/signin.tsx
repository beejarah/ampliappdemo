import React, { useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

export default function SigninScreen() {
  const [email, setEmail] = useState('');
  const router = useRouter();

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
            
            <TouchableOpacity style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continue</Text>
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
}); 