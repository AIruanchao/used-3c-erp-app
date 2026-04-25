import { Tabs } from 'expo-router';
import { Icon } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';

const TAB_SCREEN_OPTIONS = {
  headerShown: true,
  tabBarActiveTintColor: '#1976d2',
  tabBarInactiveTintColor: '#757575',
  tabBarStyle: {
    paddingBottom: 4,
    height: 56,
  },
  tabBarLabelStyle: {
    fontSize: 12,
  },
} as const;

function createTabIcon(source: string) {
  return ({ color, size }: { color: string; size: number }) => (
    <Icon source={source} size={size} color={color} />
  );
}

const TAB_ICONS = {
  index: createTabIcon('view-dashboard'),
  inbound: createTabIcon('package-down'),
  outbound: createTabIcon('package-up'),
  inventory: createTabIcon('archive'),
  profile: createTabIcon('account'),
} as const;

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
      <Tabs.Screen
        name="index"
        options={{
          title: '工作台',
          tabBarIcon: TAB_ICONS.index,
        }}
      />
      <Tabs.Screen
        name="inbound"
        options={{
          title: '入库',
          tabBarIcon: TAB_ICONS.inbound,
        }}
      />
      <Tabs.Screen
        name="outbound"
        options={{
          title: '出库',
          tabBarIcon: TAB_ICONS.outbound,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: '库存',
          tabBarIcon: TAB_ICONS.inventory,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: TAB_ICONS.profile,
        }}
      />
    </Tabs>
  );
}
