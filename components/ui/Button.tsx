import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { ReactNode } from 'react';

interface ButtonProps extends TouchableOpacityProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({ 
  children, 
  variant = 'primary', 
  style, 
  ...props 
}: ButtonProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        style
      ]} 
      {...props}
    >
      <Text 
        style={[
          styles.buttonText,
          variant === 'primary' && styles.primaryButtonText,
          variant === 'secondary' && styles.secondaryButtonText,
          variant === 'outline' && styles.outlineButtonText,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#0066cc',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  buttonText: {
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#333',
  },
  outlineButtonText: {
    color: '#0066cc',
  },
}); 