/**
 * v0.1.0 极简版 — 排除法定位闪退根因
 * 只保留 expo-router Stack，去掉所有第三方包装层
 */
import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>咖机汇 v0.1.0</Text>
      <Text style={styles.subtitle}>极简诊断版 — 如果你看到这个，说明基础框架正常</Text>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
  },
});
