import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from 'react-native-paper';

/**
 * Root entry route for `expo-router`. Storage + auth are hydrated in
 * `app/_layout.tsx` before this screen mounts; we only perform initial navigation.
 */
export default function AppEntry() {
  const theme = useTheme();

  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  const route = useCallback(() => {
    if (isAuthenticated && token) {
      router.replace('/(tabs)' as never);
    } else {
      router.replace('/(auth)/login' as never);
    }
  }, [isAuthenticated, token, router]);

  useEffect(() => {
    route();
  }, [route]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]} accessibilityLabel="app-starting">
      <ActivityIndicator />
      <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>准备中…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    marginTop: 12,
    color: '#757575',
  },
});
