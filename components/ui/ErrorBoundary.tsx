import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // If the error is an "Already logged in" error, suppress it
    if (error.message.includes('Already logged in')) {
      // Return state with hasError as false to continue rendering children
      return { hasError: false, error: null };
    }
    
    // For other errors, update state to show fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // If this is an "Already logged in" error, log it but don't show any UI
    if (error.message.includes('Already logged in')) {
      if (__DEV__) {
        console.log('Suppressed "Already logged in" error in ErrorBoundary');
      }
      return;
    }
    
    // Log other errors as usual
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback UI for errors that aren't "Already logged in"
      return (
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: '#666' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
        </View>
      );
    }

    // If no error or if it's an "Already logged in" error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 