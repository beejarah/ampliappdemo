// Import test file to verify library dependencies
import React from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated from 'react-native-reanimated';
import Svg from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import * as Application from 'expo-application';

export default function ImportTest() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Import Test Successful!</Text>
      <StatusBar style="auto" />
    </View>
  );
} 