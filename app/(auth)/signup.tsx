import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  const handleSignup = () => {
    // Here you would handle the signup logic
    router.push('/(auth)/processing');
  };

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
        
        {/* Form Fields */}
        <TextInput
          style={styles.input}
          placeholder="Your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        {/* Sign Up Button */}
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign up</Text>
        </TouchableOpacity>
        
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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