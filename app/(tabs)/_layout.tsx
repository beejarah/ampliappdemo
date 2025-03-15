import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { isDevAutoLoginEnabled } from '../../utils/devHelpers';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const showDevTabs = isDevAutoLoginEnabled();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: { 
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      {/* Wallet/Balance screen */}
      <Tabs.Screen
        name="balance"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => <TabBarIcon name="account-balance-wallet" color={color} />,
        }}
      />
      {/* Only show Tenderly tab in development mode with auto-login enabled */}
      {showDevTabs && (
        <Tabs.Screen
          name="tenderly"
          options={{
            title: 'Tenderly',
            tabBarIcon: ({ color }) => <TabBarIcon name="api" color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
}) {
  return <MaterialIcons size={28} style={{ marginBottom: -3 }} {...props} />;
}
