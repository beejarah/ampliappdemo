import { useState, useEffect } from 'react';
import { useLoginWithEmail, usePrivy, hasError } from '@privy-io/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function usePrivyEmailVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the Privy instance to access logout functionality
  const privy = usePrivy();
  
  // Use the Privy hook for email login
  const { 
    sendCode, 
    loginWithCode, 
    state,
    error: privyError
  } = useLoginWithEmail({
    onSendCodeSuccess: (email) => {
      if (__DEV__) console.log('Privy onSendCodeSuccess callback triggered for:', email);
    },
    onLoginSuccess: (user, isNewUser) => {
      if (__DEV__) console.log('Privy onLoginSuccess callback triggered, user:', user);
      if (__DEV__) console.log('Is new user:', isNewUser);
    },
    onError: (err) => {
      // Silently ignore "Already logged in" errors - don't show any warning
      if (!err.message?.includes('Already logged in')) {
        if (__DEV__) console.error('Privy onError callback triggered:', err);
        setError(err.message || 'Authentication error');
      } else {
        if (__DEV__) console.log('Silently handling "Already logged in" error');
        // Don't set any error message
      }
    }
  });
  
  // Send verification code to email
  const sendVerificationCode = async (email: string) => {
    if (__DEV__) console.log('sendVerificationCode called with email:', email);
    setIsLoading(true);
    setError(null);
    
    try {
      if (__DEV__) console.log('Sending verification code to:', email);
      
      // DEVELOPMENT OVERRIDE: Only in development mode
      if (__DEV__ && process.env.NODE_ENV === 'development' && email.includes('test')) {
        if (__DEV__) console.log('Development mode detected for test email');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        return true;
      }
      
      // Try to use the Privy sendCode method
      try {
        if (__DEV__) console.log('Calling Privy sendCode method');
        const result = await sendCode({ email });
        if (__DEV__) console.log('Send code result:', result);
        
        if (result.success) {
          if (__DEV__) console.log('Verification code sent successfully');
          return true;
        } else {
          if (__DEV__) console.error('Privy sendCode returned success: false');
          setError('Failed to send verification code');
          return false;
        }
      } catch (privyError: any) {
        if (__DEV__) console.error('Privy error during sendCode:', privyError);
        
        // Silently handle "Already logged in" error and proceed
        if (privyError.message?.includes('Already logged in')) {
          if (__DEV__) console.log('Silently handling "Already logged in" error');
          // Don't set any error message
          return true;
        }
        
        // For other errors, set an appropriate error message
        if (privyError.message?.includes('rate limit')) {
          setError('Too many attempts. Please try again later.');
        } else if (privyError.message?.includes('invalid email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(privyError.message || 'Failed to send verification code');
        }
        
        return false;
      }
    } catch (err: any) {
      if (__DEV__) console.error('Error sending verification code:', err);
      setError(err.message || 'Failed to send verification code');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify code entered by user
  const verifyCode = async (email: string, code: string) => {
    if (__DEV__) console.log('verifyCode called with email:', email, 'and code:', code);
    setIsLoading(true);
    setError(null);
    
    try {
      if (__DEV__) console.log('Verifying code for email:', email);
      
      // STRICT CHECK: Only allow test code "123456" in development mode
      if (__DEV__ && code === "123456") {
        if (__DEV__) console.log('Development mode test code "123456" detected');
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsLoading(false);
        return true;
      }
      
      // Ensure code is exactly 6 digits
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        if (__DEV__) console.error('Invalid code format. Must be 6 digits.');
        setError('Invalid code format. Must be 6 digits.');
        setIsLoading(false);
        return false;
      }
      
      // Only proceed with actual Privy verification if it's not the test code
      if (code !== "123456") {
        // Try to use the Privy loginWithCode method for the actual emailed code
        try {
          if (__DEV__) {
            console.log('Attempting to verify with Privy loginWithCode');
            console.log('Code format check - Length:', code.length, 'Is numeric:', /^\d+$/.test(code));
            console.log('Calling loginWithCode with params:', { code, email });
          }
          
          try {
            // This should verify the actual code emailed by Privy
            const user = await loginWithCode({ 
              code, 
              email // Explicitly passing email as recommended in the docs
            });
            
            if (__DEV__) console.log('Code verified successfully by Privy, user:', user);
            setIsLoading(false);
            return true;
          } catch (loginError: any) {
            if (__DEV__) console.log('Login error details:', loginError);
            
            // Silently handle "Already logged in" error and proceed
            if (loginError.message?.includes('Already logged in')) {
              if (__DEV__) console.log('Silently handling "Already logged in" error during verification');
              // Don't set any error message
              setIsLoading(false);
              return true;
            }
            
            // Re-throw other errors
            throw loginError;
          }
        } catch (privyError: any) {
          if (__DEV__) console.error('Privy error during verification:', privyError);
          
          // If it's an invalid code error
          if (privyError.message?.includes('invalid') || 
              privyError.message?.includes('incorrect') ||
              privyError.message?.includes('expired')) {
            if (__DEV__) console.log('Invalid or expired verification code entered');
            setError('Invalid or expired verification code. Please try again or request a new code.');
            setIsLoading(false);
            return false;
          }
          
          // For any other error, set a generic error message
          setError(`Verification failed: ${privyError.message || 'Unknown error'}`);
          setIsLoading(false);
          return false;
        }
      } else {
        // If we get here with code "123456" but not in development mode, reject it
        setError('Invalid verification code. Please enter the code sent to your email.');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      if (__DEV__) console.error('Error in verifyCode:', error);
      setError(`Verification failed: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resend verification code
  const resendVerificationCode = async (email: string) => {
    if (__DEV__) console.log('resendVerificationCode called with email:', email);
    setIsLoading(true);
    setError(null);
    
    try {
      if (__DEV__) console.log('Resending verification code to:', email);
      
      // DEVELOPMENT OVERRIDE: Only in development mode
      if (__DEV__ && process.env.NODE_ENV === 'development' && email.includes('test')) {
        if (__DEV__) console.log('Development mode detected for test email resend');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        return true;
      }
      
      // Try to use the Privy sendCode method again
      try {
        if (__DEV__) console.log('Calling Privy sendCode method for resend');
        const result = await sendCode({ email });
        if (__DEV__) console.log('Resend code result:', result);
        
        if (result.success) {
          if (__DEV__) console.log('Verification code resent successfully');
          return true;
        } else {
          if (__DEV__) console.error('Privy sendCode returned success: false for resend');
          setError('Failed to resend verification code');
          return false;
        }
      } catch (privyError: any) {
        if (__DEV__) console.error('Privy error during resend:', privyError);
        
        // Silently handle "Already logged in" error and proceed
        if (privyError.message?.includes('Already logged in')) {
          if (__DEV__) console.log('Silently handling "Already logged in" error during resend');
          // Don't set any error message
          return true;
        }
        
        // For other errors, set an appropriate error message
        if (privyError.message?.includes('rate limit')) {
          setError('Too many attempts. Please try again later.');
        } else {
          setError(privyError.message || 'Failed to resend verification code');
        }
        
        return false;
      }
    } catch (err: any) {
      if (__DEV__) console.error('Error resending verification code:', err);
      setError(err.message || 'Failed to resend verification code');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get the current state of the authentication flow
  const getAuthState = () => {
    return state.status;
  };
  
  // Check if a user with this email already exists
  const checkIfUserExists = async (email: string): Promise<boolean> => {
    if (__DEV__) console.log('Checking if user exists for email:', email);
    
    try {
      // For development testing, we can use localStorage to simulate this check
      if (__DEV__) {
        // Check if we have any record of this user
        const userRecord = await AsyncStorage.getItem(`user_${email}`);
        
        if (userRecord) {
          if (__DEV__) console.log('Found existing user record for email:', email);
          return true;
        }
      }
      
      // In production, we should use the Privy API or our backend
      // For now we'll use a simple heuristic: if loginState is in 'error' state with 
      // an "Already logged in" message, it's probably a returning user
      if (hasError(state) && state.error?.message?.includes('Already logged in')) {
        if (__DEV__) console.log('Detected "Already logged in" error, treating as returning user');
        return true;
      }
      
      // For any email that has completed verification before, assume it's a returning user
      const hasCompletedVerificationBefore = await AsyncStorage.getItem(`verified_${email}`);
      if (hasCompletedVerificationBefore) {
        if (__DEV__) console.log('Found verification record for email:', email);
        return true;
      }
      
      // Default to false if we can't determine
      return false;
    } catch (err) {
      if (__DEV__) console.error('Error checking if user exists:', err);
      // If there's an error, default to false (treat as new user)
      return false;
    }
  };
  
  // Mark a user as verified (for our local tracking)
  const markUserAsVerified = async (email: string) => {
    try {
      await AsyncStorage.setItem(`verified_${email}`, 'true');
      if (__DEV__) console.log('Marked user as verified:', email);
    } catch (err) {
      if (__DEV__) console.error('Error marking user as verified:', err);
    }
  };
  
  // Debug function to log the current state (only in development)
  const debugState = () => {
    if (__DEV__) {
      console.log('Privy instance:', privy);
      console.log('Login state:', state);
      console.log('Error state:', error);
      console.log('Loading state:', isLoading);
    }
    return { 
      privy,
      state,
      error, 
      isLoading 
    };
  };
  
  return {
    isLoading: isLoading || state.status === 'sending-code' || state.status === 'submitting-code',
    error: error || (hasError(state) ? state.error?.message : null),
    sendVerificationCode,
    verifyCode,
    resendVerificationCode,
    authState: state.status,
    debugState,
    checkIfUserExists,
    markUserAsVerified
  };
} 