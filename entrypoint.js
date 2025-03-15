// Import polyfills
import 'fast-text-encoding';

// Import react-native-get-random-values for crypto
try {
  require('react-native-get-random-values');
} catch (e) {
  console.warn('Could not load react-native-get-random-values:', e.message);
}

// Import ethers shims if needed for wallet functionality
try {
  require('@ethersproject/shims');
} catch (e) {
  console.warn('Could not load @ethersproject/shims:', e.message);
}

// Import the expo router
import 'expo-router/entry'; 