import { Stack } from 'expo-router';
import { PaperProvider, DefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { init as sentryInit } from 'sentry-expo';
import * as SentryRN from '@sentry/react-native';
import { useAuthStore } from '../stores/auth-store';
import { useAppStore } from '../stores/app-store';
import { setNavigationRef, setLogoutRef } from '../lib/api';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useOffline } from '../hooks/useOffline';
import '../i18n';

sentryInit({
  dsn: process.env['EXPO_PUBLIC_SENTRY_DSN'] ?? '',
  enableInExpoDevelopment: __DEV__,
  debug: __DEV__,
});

// Global error handler for uncaught exceptions
const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
  SentryRN.captureException(error);
  if (originalHandler) {
    originalHandler(error, isFatal ?? false);
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useAppStore((s) => s.theme);
  const hydrate = useAuthStore((s) => s.hydrate);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  useOffline();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const handleNavigate = useCallback(
    (path: string) => {
      router.replace(path as never);
    },
    [router],
  );

  const fullLogout = useCallback(() => {
    logout();
    queryClient.clear();
    router.replace('/(auth)/login' as never);
  }, [logout, router]);

  useEffect(() => {
    setNavigationRef(handleNavigate);
    setLogoutRef(fullLogout);
    return () => {
      setNavigationRef(() => {});
      setLogoutRef(() => {});
    };
  }, [handleNavigate, fullLogout]);

  const isDark =
    theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const paperTheme = isDark ? MD3DarkTheme : DefaultTheme;

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="device/[id]"
              options={{ headerShown: true, title: '设备详情' }}
            />
            <Stack.Screen
              name="finance/index"
              options={{ headerShown: true, title: '财务' }}
            />
            <Stack.Screen
              name="finance/ledger"
              options={{ headerShown: true, title: '记账明细' }}
            />
            <Stack.Screen
              name="finance/payable"
              options={{ headerShown: true, title: '应付账款' }}
            />
            <Stack.Screen
              name="finance/receivable"
              options={{ headerShown: true, title: '应收账款' }}
            />
            <Stack.Screen
              name="repair/index"
              options={{ headerShown: true, title: '维修工单' }}
            />
            <Stack.Screen
              name="repair/[id]"
              options={{ headerShown: true, title: '工单详情' }}
            />
            <Stack.Screen
              name="repair/new"
              options={{ headerShown: true, title: '新建工单' }}
            />
            <Stack.Screen
              name="cashier"
              options={{ headerShown: true, title: '收银台' }}
            />
            <Stack.Screen
              name="customer/index"
              options={{ headerShown: true, title: '客户列表' }}
            />
            <Stack.Screen
              name="customer/[id]"
              options={{ headerShown: true, title: '客户详情' }}
            />
            <Stack.Screen
              name="stats"
              options={{ headerShown: true, title: '统计' }}
            />
            <Stack.Screen
              name="settings"
              options={{ headerShown: true, title: '设置' }}
            />
            <Stack.Screen
              name="inbound/received"
              options={{ headerShown: true, title: '入库记录' }}
            />
            <Stack.Screen
              name="stocktake/index"
              options={{ headerShown: true, title: '盘点' }}
            />
            <Stack.Screen
              name="settlement/index"
              options={{ headerShown: true, title: '日结' }}
            />
          </Stack>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
