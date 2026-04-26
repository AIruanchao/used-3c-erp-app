import { Tabs } from 'expo-router';
import { Icon } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from 'react-native-paper';

const TAB_ICONS = {
  index: 'view-dashboard',
  inbound: 'package-down',
  inventory: 'archive',
  cashier: 'cash-register',
  profile: 'dots-horizontal',
} as const;

function createTabIcon(source: string) {
  return ({ color, size }: { color: string; size: number }) => (
    <Icon source={source} size={size} color={color} />
  );
}

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const theme = useTheme();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          paddingBottom: 4,
          height: 56,
          backgroundColor: theme.colors.surface,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '工作台',
          headerShown: false,
          tabBarIcon: createTabIcon(TAB_ICONS.index),
        }}
      />
      <Tabs.Screen
        name="inbound"
        options={{
          title: '入库',
          tabBarIcon: createTabIcon(TAB_ICONS.inbound),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: '库存',
          tabBarIcon: createTabIcon(TAB_ICONS.inventory),
        }}
      />
      <Tabs.Screen
        name="cashier"
        options={{
          title: '收银',
          tabBarIcon: createTabIcon(TAB_ICONS.cashier),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '更多',
          tabBarIcon: createTabIcon(TAB_ICONS.profile),
        }}
      />
      <Tabs.Screen
        name="outbound"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
