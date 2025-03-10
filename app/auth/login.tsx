import { View, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';

export default function LoginScreen() {
  // Redirect to our new auth flow
  return <Redirect href="/(auth)/index" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0052B4', // Ampli blue
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 50,
  },
  inputContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50, // Space for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  loginButton: {
    backgroundColor: '#B2D6E6', // Light blue
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#0052B4', // Ampli blue
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: 'white',
    fontSize: 16,
  },
  registerLink: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
}); 