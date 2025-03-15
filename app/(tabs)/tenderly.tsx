import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { isDevAutoLoginEnabled } from '../../utils/devHelpers';

/**
 * Tenderly Integration Page
 * 
 * This is a starter template for your Tenderly integration.
 * You can build your interface here and test it with the auto-login system.
 */
export default function TenderlyPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Development mode indicator */}
      {isDevAutoLoginEnabled() && (
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>DEV MODE - Tenderly Integration</Text>
        </View>
      )}
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tenderly Integration</Text>
        <Text style={styles.subtitle}>Build your interface here</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0052B4" />
            <Text style={styles.loadingText}>Connecting to Tenderly...</Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <Text style={styles.placeholder}>
              This is a placeholder for your Tenderly integration.
            </Text>
            <Text style={styles.instruction}>
              Edit this file at app/(tabs)/tenderly.tsx to build your interface.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0052B4',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666666',
    fontSize: 16,
  },
  contentContainer: {
    padding: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
    lineHeight: 24,
  },
  instruction: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  devBanner: {
    backgroundColor: '#FF6347',
    padding: 8,
    alignItems: 'center',
  },
  devBannerText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 