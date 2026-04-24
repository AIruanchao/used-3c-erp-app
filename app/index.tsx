import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth-store';

/**
 * Root entry route for `expo-router`.
 * Without this file, the app can render a blank/black screen on cold start
 * because there is no default screen to mount at `/`.
 */
export default function AppEntry() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [ready, setReady] = useState(false);

  const route = useCallback(() => {
    if (isAuthenticated && token) {
      router.replace('/(tabs)' as never);
    } else {
      router.replace('/(auth)/login' as never);
    }
  }, [isAuthenticated, token, router]);

  useEffect(() => {
    // Ensure MMKV + zustand auth state is hydrated before routing
    try {
      hydrate();
    } finally {
      // microtask tick so selectors update after store writes
      queueMicrotask(() => setReady(true));
    }
  }, [hydrate]);

  useEffect(() => {
    if (!ready) return;
    route();
  }, [ready, route]);

  return (
    <View style={styles.root} accessibilityLabel="app-starting">
      <ActivityIndicator />
      <Text style={styles.hint}>启动中…</Text>
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
