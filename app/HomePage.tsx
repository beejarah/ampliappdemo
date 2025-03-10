import { View, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';

export default function HomePage() {
  // Redirect to the auth flow
  return <Redirect href="/(auth)/index" />;
} 