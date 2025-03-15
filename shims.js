// Import polyfills needed for ethers.js in React Native
try {
  require('react-native-get-random-values');
} catch (error) {
  console.warn('react-native-get-random-values import failed:', error.message);
}

try {
  require('@ethersproject/shims');
} catch (error) {
  console.warn('@ethersproject/shims import failed:', error.message);
}

// Handle globals that ethers.js expects
global.Buffer = global.Buffer || require('buffer').Buffer;
global.process = global.process || require('process');

// Ensure TextEncoder is available
if (typeof TextEncoder === 'undefined') {
  try {
    global.TextEncoder = require('text-encoding').TextEncoder;
  } catch (error) {
    try {
      // Try the alternative package
      global.TextEncoder = require('fast-text-encoding').TextEncoder;
    } catch (secondError) {
      console.error('Failed to polyfill TextEncoder:', error.message, secondError.message);
    }
  }
}

if (typeof TextDecoder === 'undefined') {
  try {
    global.TextDecoder = require('text-encoding').TextDecoder;
  } catch (error) {
    try {
      // Try the alternative package
      global.TextDecoder = require('fast-text-encoding').TextDecoder;
    } catch (secondError) {
      console.error('Failed to polyfill TextDecoder:', error.message, secondError.message);
    }
  }
}

// Export a dummy function to ensure the file is imported correctly
export default function setupShims() {
  console.log('Crypto polyfills initialized');
} 