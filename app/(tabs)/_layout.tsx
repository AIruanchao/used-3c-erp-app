import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: '工作台' }} />
      <Tabs.Screen name="inbound" options={{ title: '入库' }} />
      <Tabs.Screen name="outbound" options={{ title: '出库' }} />
      <Tabs.Screen name="inventory" options={{ title: '库存' }} />
      <Tabs.Screen name="profile" options={{ title: '我的' }} />
    </Tabs>
  );
}
