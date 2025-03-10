import { Redirect } from 'expo-router';

export default function AuthLayout() {
  // Redirect all old auth routes to our new auth flow
  return <Redirect href="/(auth)/index" />;
} 