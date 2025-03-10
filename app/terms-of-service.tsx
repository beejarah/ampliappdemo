import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  
  // Redirect to user-profile which now handles the Terms of Service modal
  useEffect(() => {
    router.replace('/user-profile');
  }, []);
  
  return <View />;
} 