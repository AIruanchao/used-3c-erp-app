import { Tabs } from 'expo-router';
import { Icon } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from 'react-native-paper';

const TAB_ICONS = {
  index: 'home',
  inbound: 'plus-circle',
  inventory: 'package',
  stats: 'chart-bar',
  marketplace: 'search',
  profile: 'account',
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
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          paddingBottom: 4,
          height: 56,
          backgroundColor: theme.colors.surface,
        },
        tabBarLabelStyle: {
          fontSize: 10,
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
          title: '开单',
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
        name="stats"
        options={{
          title: '统计',
          tabBarIcon: createTabIcon(TAB_ICONS.stats),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: '找货',
          tabBarIcon: createTabIcon(TAB_ICONS.marketplace),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: createTabIcon(TAB_ICONS.profile),
        }}
      />
      <Tabs.Screen
        name="outbound"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="cashier"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
