// Apply polyfills for react-native-get-random-values
import 'react-native-get-random-values';
// Import the expo-router entry
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Register the root component with Expo
registerRootComponent(ExpoRoot);