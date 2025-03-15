// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add additional node_modules to resolver
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Add any additional file extensions to resolve
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs',
];

// Provide Node.js module polyfills
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: path.resolve(__dirname, 'node_modules/crypto-browserify'),
  stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
  buffer: path.resolve(__dirname, 'node_modules/buffer'),
  process: path.resolve(__dirname, 'node_modules/process'),
  http: path.resolve(__dirname, 'node_modules/stream-http'),
  https: path.resolve(__dirname, 'node_modules/https-browserify'),
  os: path.resolve(__dirname, 'node_modules/os-browserify'),
  path: path.resolve(__dirname, 'node_modules/path-browserify'),
  fs: path.resolve(__dirname, 'node_modules/react-native-fs'),
};

// Make sure we don't exclude these modules
config.transformer.assetPlugins = [
  ...config.transformer.assetPlugins || [],
];

module.exports = config; 