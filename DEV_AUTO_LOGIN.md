# Development Auto-Login System

This document explains how the automatic login system works in development mode to help you build and test features without going through the login flow each time.

## Overview

We've implemented a development-only auto-login system that:

1. Automatically bypasses authentication checks in development mode
2. Sends you directly to the balance page (main app)
3. Shows a visual indicator that you're in development mode
4. Can be easily turned on/off

## How to Enable/Disable

The auto-login is controlled by an environment variable in `env.js`:

```javascript
// In env.js
const ENV = {
  // Other environment variables...
  DEV_AUTO_LOGIN: true,  // Set to false to disable
  DEV_TEST_EMAIL: 'dev@example.com'
};
```

To disable auto-login, simply set `DEV_AUTO_LOGIN` to `false`.

## How It Works

1. The system detects you're in development mode (`__DEV__` is true)
2. If auto-login is enabled, it:
   - Creates a verified user record in AsyncStorage
   - Sets dummy user profile data
   - Redirects directly to the tabs/balance screen
   - Shows a red banner indicating you're in development mode

## Where to Find the Code

- **Main Hook**: `utils/devHelpers.ts` - Contains the `useDevAutoLogin()` hook
- **Configuration**: `env.js` - Contains the `DEV_AUTO_LOGIN` flag
- **Integration**: `app/_layout.tsx` - Applies the hook to the app

## Building Your Tenderly Integration

With auto-login enabled, you can:

1. Create a new route at `app/(tabs)/tenderly.tsx` for your Tenderly integration
2. Build and test your feature without worrying about authentication
3. The app will automatically log you in and navigate to the tabs section
4. Access your new route by navigating to it in the app 

## Security Note

This feature only works in development mode (`__DEV__` is true). It's completely disabled in production builds, so there's no risk of accidentally exposing bypass mechanisms in production.

## Troubleshooting

If auto-login isn't working:

1. Make sure `DEV_AUTO_LOGIN` is set to `true` in `env.js`
2. Check the console logs for any errors (look for logs starting with `🔑 [DEV]`)
3. Try manually visiting an authenticated route to trigger the bypass again
4. Restart the development server with `npm start -- -c` to clear the cache

## To Turn Off Later

When you no longer need the auto-login feature:

1. Open `env.js`
2. Set `DEV_AUTO_LOGIN: false`
3. Save the file and restart your development server 