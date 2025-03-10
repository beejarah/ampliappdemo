# Ampli Financial App

A modern financial application built with Expo and React Native, featuring Privy authentication.

## Features

- **Secure Authentication**: Email-based authentication powered by Privy
- **Wallet Management**: View and manage your financial assets
- **Multiple Features**: Investments, Payments, and Analytics modules (coming soon)
- **Modern UI**: Clean, responsive design with intuitive navigation

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ampliappdemo.git
   cd ampliappdemo
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following content:
   ```
   EXPO_PORT=8082
   PRIVY_APP_ID=your-privy-app-id
   ```
   Replace `your-privy-app-id` with your actual Privy App ID from the [Privy Dashboard](https://console.privy.io/).

4. Start the development server:
   ```
   npm start
   ```

## Authentication Flow

The app uses Privy for authentication, which provides a secure and seamless experience:

1. **Sign Up**: New users can create an account with their email
2. **Email Verification**: Users verify their email through a link sent to their inbox
3. **Sign In**: Returning users can sign in with their email
4. **Session Management**: The app maintains the user's session securely

## Project Structure

- `app/`: Main application screens and navigation
  - `(auth)/`: Authentication screens
  - `(tabs)/`: Main app tabs and features
- `components/`: Reusable UI components
  - `auth/`: Authentication-related components
  - `ui/`: General UI components
- `hooks/`: Custom React hooks
- `constants/`: App constants and configuration

## Customization

### Styling

The app uses a consistent color scheme defined in `constants/Colors.ts`. You can modify this file to change the app's appearance.

### Adding New Features

To add new features:

1. Create a new screen in the appropriate directory
2. Add navigation in the relevant layout file
3. Update the home screen to include the new feature

## Deployment

### Expo Build

To build the app for production:

```
expo build:android
expo build:ios
```

### Web Deployment

To deploy the web version:

```
npm run build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Privy](https://privy.io) for authentication
- [Expo](https://expo.dev) for the development framework
- [React Native](https://reactnative.dev) for the mobile framework
