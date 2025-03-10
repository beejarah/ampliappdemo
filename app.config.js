const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Get environment variables with fallbacks
const PRIVY_APP_ID = process.env.PRIVY_APP_ID || 'cm7zekhe100pr34vmrwf36wps';
const PRIVY_CLIENT_ID = process.env.PRIVY_CLIENT_ID || 'client-WY5hCP9Yi6c1RemTCtMUAdaAnnPUFCYgjpxbYQha8XtTK';

module.exports = {
  name: "Ampli",
  slug: "ampliappdemo",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/images/launch-image.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.beej.amplidemo",
    buildNumber: "1",
    // Required for deep linking with Privy
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ["ampli"]
        }
      ],
      ITSAppUsesNonExemptEncryption: false,
      UILaunchStoryboardName: "SplashScreen",
      NSCameraUsageDescription: "This app does not use the camera.",
      NSPhotoLibraryUsageDescription: "This app does not access your photos.",
      NSPhotoLibraryAddUsageDescription: "This app does not save photos to your library.",
      NSLocationWhenInUseUsageDescription: "This app does not use your location."
    },
    splash: {
      image: "./assets/images/launch-image.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      tabletImage: "./assets/images/launch-image.png"
    },
    appStoreUrl: "https://apps.apple.com/app/ampli/id6743009621"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.beej.amplidemo",
    versionCode: 1,
    // Required for deep linking with Privy
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "ampli"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    favicon: "./assets/images/favicon.png"
  },
  extra: {
    // Pass environment variables to the app
    privyAppId: PRIVY_APP_ID,
    privyClientId: PRIVY_CLIENT_ID,
    eas: {
      projectId: "233eed20-fe9f-4724-b6c4-b37555a55fe1"
    }
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/launch-image.png",
        imageResizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: "./assets/images/launch-image.png",
          imageResizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      }
    ]
  ],
  scheme: "ampli", // Used for deep linking with Privy
  // Set the port for development
  packagerOpts: {
    port: process.env.EXPO_PORT || 8082
  },
  // Enable the new architecture as recommended in the warning
  newArchEnabled: true,
  // App Store metadata
  description: "Ampli is a secure digital wallet app that helps you manage your finances with ease.",
  primaryColor: "#005BB2",
  privacy: "public",
  githubUrl: "https://github.com/beej/ampliappdemo",
  // App Store Connect metadata
  owner: "beej",
  ownerName: "Beej Makau",
  // Contact information
  contactEmail: "bjmaks@gmail.com",
  contactPhoneNumber: "+1 (555) 123-4567",
  contactName: "Beej Makau",
  // Privacy Policy and Terms of Service URLs
  privacyPolicyUrl: "https://ampli.money/privacy-policy.html",
  termsOfServiceUrl: "https://ampli.money/terms-of-service.html"
}; 