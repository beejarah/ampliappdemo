# Tenderly Setup and Usage Guide

This document provides instructions for working with Tenderly Web3 Actions in your Ampli project.

## Installation Status

Tenderly CLI has been successfully installed and added to your PATH. The CLI is located at:
```
C:\Users\bjmak\Ampli\Tenderly\tenderly.exe
```

## Next Steps for Tenderly Web3 Actions

### 1. Authenticate with Tenderly
```bash
tenderly login
```
This will open a browser window where you can log in to your Tenderly account.

### 2. Create a Web3 Actions Project
```bash
mkdir web3-actions
cd web3-actions
```

### 3. Initialize Your Project
```bash
tenderly actions init --template onboarding
```
This will create a starter project with example actions.

### 4. Review and Modify Your Actions
The template includes several example actions in the `actions` folder. You can modify these or create new ones.

### 5. Deploy Your Actions
```bash
tenderly actions deploy
```

## Integrating with Your App

Once your Web3 Actions are deployed, they can be triggered by:

1. **Blockchain Events** - Actions can listen for specific events on the blockchain
2. **API Calls** - Your app can call the actions via HTTP requests
3. **Scheduled Execution** - Actions can run on a schedule

### Example Integration in Your App

```typescript
// In your Tenderly page
import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';

export default function TenderlyPage() {
  const [result, setResult] = useState(null);
  
  const triggerAction = async () => {
    try {
      // Replace with your actual Tenderly Action URL
      const response = await fetch('https://api.tenderly.co/api/v1/actions/YOUR_ACTION_ID/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: JSON.stringify({
          // Your action parameters
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error triggering Tenderly action:', error);
    }
  };
  
  return (
    <View>
      <Text>Tenderly Integration</Text>
      <Button title="Trigger Action" onPress={triggerAction} />
      {result && <Text>{JSON.stringify(result, null, 2)}</Text>}
    </View>
  );
}
```

## Additional Resources

- [Tenderly Web3 Actions Documentation](https://docs.tenderly.co/web3-actions/intro-to-web3-actions)
- [Tenderly CLI Reference](https://docs.tenderly.co/tenderly-cli/commands)
- [API Reference](https://docs.tenderly.co/reference/api-endpoints)

## Troubleshooting

If you encounter issues with the Tenderly CLI:

1. Ensure you've restarted your terminal after installation
2. Verify the CLI is in your PATH by running `tenderly version`
3. Check the logs in the `.tenderly` directory in your project folder
4. For API integration issues, verify your authentication tokens and permissions

For more help, contact Tenderly support at support@tenderly.co 