// Load environment variables
import { Platform } from 'react-native';

// Default values for environment variables
const ENV = {
  PRIVY_APP_ID: 'cm7zekhe100pr34vmrwf36wps',
  PRIVY_CLIENT_ID: 'client-WY5hCP9Yi6c1RemTCtMUAdaAnnPUFCYgjpxbYQha8XtTK',
  // Development helpers
  DEV_AUTO_LOGIN: true, // Set to false to disable auto-login in development
  DEV_TEST_EMAIL: 'dev@example.com', // Email to use for auto-login
  // Supabase credentials
  SUPABASE_URL: 'https://ktytrhvkxxnggvxfzdfe.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eXRyaHZreHhuZ2d2eGZ6ZGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MzQ2ODksImV4cCI6MjA1NzUxMDY4OX0.rVyM52U0hhmbFjVhxOeiXstwbIrxYQTyyMEBP52Y0hc',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eXRyaHZreHhuZ2d2eGZ6ZGZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkzNDY4OSwiZXhwIjoyMDU3NTEwNjg5fQ.ukA_fadBYb78cVMESTNDhZgF1hwf4Fu-yBw056c1WIk',
};

// Export environment variables
export default ENV; 