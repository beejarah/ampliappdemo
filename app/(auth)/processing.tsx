import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function ProcessingScreen() {
  const router = useRouter();
  
  useEffect(() => {
    // Simulate processing time
    const timer = setTimeout(() => {
      router.push('/(auth)/success');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>ampli^</Text>
      </View>
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        <Text style={styles.title}>Money elevated</Text>
        <Text style={styles.subtitle}>Join our waitlist</Text>
        
        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
        
        {/* How It Works Section */}
        <View style={styles.howItWorksContainer}>
          <Text style={styles.howItWorksText}>See how Ampli works</Text>
          
          {/* Image Gallery */}
          <View style={styles.imageGallery}>
            {/* These would be your actual images */}
            <View style={styles.galleryImage} />
            <View style={styles.galleryImage} />
          </View>
        </View>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.copyright}>© 2023 Ampli money</Text>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>Terms</Text>
          <Text style={styles.footerLink}>About</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  logoContainer: {
    marginTop: 40,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  howItWorksContainer: {
    marginTop: 20,
  },
  howItWorksText: {
    fontSize: 14,
    marginBottom: 12,
  },
  imageGallery: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  galleryImage: {
    width: '48%',
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  copyright: {
    fontSize: 12,
    color: '#666',
  },
  footerLinks: {
    flexDirection: 'row',
  },
  footerLink: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
}); 