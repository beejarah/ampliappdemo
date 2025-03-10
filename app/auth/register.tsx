import { Redirect } from 'expo-router';

export default function RegisterScreen() {
  // Redirect to our new auth flow
  return <Redirect href="/(auth)/index" />;
} 