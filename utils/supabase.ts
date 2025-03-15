import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import ENV from '../env';

// Try multiple sources for credentials
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  ENV.SUPABASE_URL || 
  'https://ktytrhvkxxnggvxfzdfe.supabase.co';

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  ENV.SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eXRyaHZreHhuZ2d2eGZ6ZGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MzQ2ODksImV4cCI6MjA1NzUxMDY4OX0.rVyM52U0hhmbFjVhxOeiXstwbIrxYQTyyMEBP52Y0hc';

// Log credentials availability for debugging
console.log('Supabase URL available:', !!supabaseUrl);
console.log('Supabase Anon Key available:', !!supabaseAnonKey);
console.log('Supabase URL being used:', supabaseUrl);

// Initialize Supabase with React Native specific configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  // Add global error handler for debugging
  global: {
    fetch: (...args) => {
      console.log('Supabase API Request:', args[0]);
      return fetch(...args)
        .then(response => {
          if (!response.ok) {
            console.error('Supabase API Error:', response.status, response.statusText);
          }
          return response;
        })
        .catch(error => {
          console.error('Supabase API Fetch Error:', error);
          throw error;
        });
    }
  }
});

export default supabase; 