import { installCrashLogger, checkLastCrash, autoUploadCrashLogs } from '../lib/crash-logger';
import { Stack } from 'expo-router';
import { PaperProvider, DefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useCallback, useState } from 'react';
import { useColorScheme, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth-store';
import { useAppStore } from '../stores/app-store';
import { hydrateStorage, getStoredThemeOrDefault } from '../lib/storage';
import { notificationService } from '../services/notification-service';
import { setNavigationRef, setLogoutRef } from '../lib/api';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useOffline } from '../hooks/useOffline';
import { startAppLogging } from '../services/logging-service';
import '../i18n';
import { BRAND_ACCENT } from '../lib/theme';

// 🛡️ 崩溃日志捕获器 — 最早安装，确保所有异常都被记录
installCrashLogger();

try {
  startAppLogging();
} catch (e) {
  // If logging can't start, do not crash app startup.
}

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
  const setTheme = useAppStore((s) => s.setTheme);
  const hydrate = useAuthStore((s) => s.hydrate);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [storageReady, setStorageReady] = useState(false);

  useOffline();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await hydrateStorage();
        notificationService.hydrate();
        const t = getStoredThemeOrDefault();
        setTheme(t);
        hydrate();
      } catch (e) {
        hydrate();
      }
      if (!cancelled) {
        setStorageReady(true);
        // 🚀 自动回传崩溃日志（不阻塞启动，即使失败也不影响）
        autoUploadCrashLogs().then(({ uploaded }) => {
          // success is non-critical; no console noise
        }).catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate, setTheme]);

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
  const paperTheme = isDark
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, secondaryContainer: BRAND_ACCENT, onSecondaryContainer: '#FFFFFF' } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, secondaryContainer: BRAND_ACCENT, onSecondaryContainer: '#FFFFFF' } };

  if (!storageReady) {
    return (
      <View style={[layoutBootStyles.root, { backgroundColor: isDark ? '#121212' : '#ffffff' }]} accessibilityLabel="app-starting">
        <ActivityIndicator />
        <Text style={layoutBootStyles.hint}>加载中…</Text>
      </View>
    );
  }

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
              name="payment-channels"
              options={{ headerShown: true, title: '收款方式' }}
            />
            <Stack.Screen
              name="cash-accounts"
              options={{ headerShown: true, title: '资金账户' }}
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
            <Stack.Screen
              name="outbound/index"
              options={{ headerShown: true, title: '出库' }}
            />
            <Stack.Screen
              name="outbound/[id]"
              options={{ headerShown: false, title: '出库单' }}
            />
            <Stack.Screen
              name="customer/new"
              options={{ headerShown: false, title: '新建客户' }}
            />
            <Stack.Screen
              name="pickup/index"
              options={{ headerShown: true, title: '取机管理' }}
            />
            <Stack.Screen
              name="pickup/new"
              options={{ headerShown: false, title: '新建取机单' }}
            />
            <Stack.Screen
              name="pickup/[id]"
              options={{ headerShown: false, title: '取机单' }}
            />
            <Stack.Screen
              name="handover/index"
              options={{ headerShown: true, title: '交接班' }}
            />
            <Stack.Screen
              name="handover/new"
              options={{ headerShown: false, title: '新建交接' }}
            />
            <Stack.Screen
              name="spare-parts/index"
              options={{ headerShown: true, title: '配件' }}
            />
            <Stack.Screen
              name="spare-parts/inbound"
              options={{ headerShown: false, title: '配件入库' }}
            />
            <Stack.Screen
              name="inspection/[deviceId]"
              options={{ headerShown: false, title: '检测报告' }}
            />
            <Stack.Screen
              name="pre-orders/index"
              options={{ headerShown: true, title: '预订单' }}
            />
            <Stack.Screen
              name="pre-orders/new"
              options={{ headerShown: false, title: '新建预订单' }}
            />
            <Stack.Screen
              name="pre-orders/[id]"
              options={{ headerShown: false, title: '预订单' }}
            />
            <Stack.Screen
              name="announcements/index"
              options={{ headerShown: true, title: '公告' }}
            />
            <Stack.Screen
              name="announcements/[id]"
              options={{ headerShown: false, title: '公告详情' }}
            />
            <Stack.Screen
              name="crash-logs"
              options={{ headerShown: true, title: '🐛 崩溃日志' }}
            />
          </Stack>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const layoutBootStyles = StyleSheet.create({
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
