import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../../services/stats-service';
import { COMPANY_NAME } from '../../lib/constants';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { yuan } from '../../lib/utils';

interface QuickAction {
  icon: string;
  label: string;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'barcode-scan', label: '扫码入库', route: '/(tabs)/inbound' },
  { icon: 'cash-register', label: '收银台', route: '/(tabs)/cashier' },
  { icon: 'archive', label: '库存查询', route: '/(tabs)/inventory' },
  { icon: 'wrench', label: '新建维修', route: '/repair/new' },
  { icon: 'package-up', label: '出库', route: '/(tabs)/outbound' },
  { icon: 'truck-delivery', label: '取机管理', route: '/pickup/index' },
  { icon: 'clipboard-check', label: '交接班', route: '/handover/new' },
  { icon: 'cog', label: '配件管理', route: '/spare-parts/index' },
  { icon: 'clipboard-text', label: '预订单', route: '/pre-orders/index' },
  { icon: 'bell', label: '公告', route: '/announcements/index' },
  { icon: 'chart-bar', label: '统计报表', route: '/stats' },
  { icon: 'cash-multiple', label: '财务', route: '/finance/index' },
  { icon: 'account-group', label: '客户', route: '/customer/index' },
];

export default function WorkspaceScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { storeId, organizationId, storeName, user } = useAuth();
  const isDark = theme.dark;

  const { data: report, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dailyReport', storeId, organizationId],
    queryFn: () =>
      getDailyReport({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
      }),
    enabled: !!storeId && !!organizationId,
  });

  const handleAction = useCallback(
    (route: string) => {
      router.push(route as never);
    },
    [router],
  );

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      {/* Welcome Section with Gradient-like background */}
      <View style={[styles.welcomeSection, { backgroundColor: isDark ? '#1565c0' : '#1890ff' }]}>
        <Text style={styles.greeting}>
          {user?.name ? `${user?.name}，你好` : '你好'}
        </Text>
        <Text style={styles.storeName}>
          {storeName ?? '嫩叶ERP'}
        </Text>
      </View>

      {/* Stats Cards - overlapping gradient */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: isDark ? '#e0e0e0' : '#333' }]}>
            {report?.purchase.count ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? '#999' : '#999' }]}>今日入库</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: isDark ? '#e0e0e0' : '#333' }]}>
            {report?.sales.count ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? '#999' : '#999' }]}>今日销售</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: isDark ? '#e0e0e0' : '#333' }]}>
            {yuan(report?.sales.amount ?? 0)}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? '#999' : '#999' }]}>今日收入</Text>
        </View>
      </View>

      {/* Quick Shortcuts */}
      <View style={styles.shortcutsSection}>
        <View style={[styles.shortcutGrid, { backgroundColor: theme.colors.surface }]}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.route}
              style={styles.shortcutItem}
              onPress={() => handleAction(action.route)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text style={styles.shortcutIcon}>
                {getEmoji(action.icon)}
              </Text>
              <Text style={[styles.shortcutLabel, { color: isDark ? '#ccc' : '#666' }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={[styles.footer, { color: theme.colors.outline }]}>
        {COMPANY_NAME}
      </Text>
    </ScrollView>
  );
}

function getEmoji(icon: string): string {
  const map: Record<string, string> = {
    'barcode-scan': '📷',
    'cash-register': '💰',
    'archive': '📦',
    'wrench': '🔧',
    'package-up': '📤',
    'truck-delivery': '🚚',
    'clipboard-check': '📋',
    'cog': '🔩',
    'clipboard-text': '📝',
    'bell': '🔔',
    'chart-bar': '📊',
    'cash-multiple': '💳',
    'account-group': '👥',
  };
  return map[icon] ?? '📄';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeSection: {
    padding: 32,
    paddingBottom: 48,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#999999',
  },
  shortcutsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  shortcutGrid: {
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  shortcutItem: {
    width: '25%',
    alignItems: 'center',
    gap: 8,
  },
  shortcutIcon: {
    fontSize: 28,
  },
  shortcutLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    paddingBottom: 16,
    marginTop: 24,
  },
});
