import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../../services/stats-service';
import { searchDevice } from '../../services/inventory-service';
import { COMPANY_NAME } from '../../lib/constants';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { SearchBar } from '../../components/common/SearchBar';
import { StatsCard } from '../../components/common/StatsCard';
import { DualCTAButton } from '../../components/common/DualCTAButton';
import { SectionHeader } from '../../components/common/SectionHeader';
import { NotificationBanner } from '../../components/common/NotificationBanner';
import { yuan } from '../../lib/utils';
import { useAppStore } from '../../stores/app-store';
import { BRAND_COLOR, BRAND_TEXT_ON_BRAND_LIGHT } from '../../lib/theme';

interface QuickAction {
  icon: string;
  label: string;
  route: string;
}

const TOOLBAR_ACTIONS: QuickAction[] = [
  { icon: 'printer', label: '打印标签', route: '/spare-parts/index' },
  { icon: 'shield-check', label: '保修查询', route: '__wip__' },
  { icon: 'camera', label: '扫码入库', route: '/(tabs)/inbound' },
  { icon: 'swap-horizontal', label: '交接班', route: '/handover/new' },
  { icon: 'calendar-check', label: '日结', route: '/settlement/index' },
];

const QUICK_ACTIONS: { group: string; items: QuickAction[] }[] = [
  {
    group: '机器管理',
    items: [
      { icon: 'package-variant', label: '库存盘点', route: '/stocktake/index' },
      { icon: 'truck-fast', label: '调拨', route: '/stocktake/index' },
      { icon: 'cart-arrow-down', label: '进货统计', route: '/stats' },
      { icon: 'cart-arrow-up', label: '销售统计', route: '/stats' },
      { icon: 'file-document', label: '销售明细', route: '/outbound/index' },
    ],
  },
  {
    group: '维修管理',
    items: [
      { icon: 'wrench', label: '维修开单', route: '/repair/new' },
      { icon: 'clipboard-list', label: '订单管理', route: '/repair/index' },
      { icon: 'chart-line', label: '维修统计', route: '/stats' },
    ],
  },
  {
    group: '配件管理',
    items: [
      { icon: 'cog', label: '配件维护', route: '/spare-parts/index' },
      { icon: 'package-up', label: '入库', route: '/spare-parts/inbound' },
      { icon: 'package-down', label: '出库', route: '/spare-parts/index' },
      { icon: 'chart-areaspline', label: '进销统计', route: '/stats' },
    ],
  },
  {
    group: '财务记账',
    items: [
      { icon: 'cash-multiple', label: '记账', route: '/finance/index' },
      { icon: 'format-list-bulleted', label: '记账明细', route: '/finance/ledger' },
    ],
  },
];

export default function WorkspaceScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { storeId, organizationId, storeName, user } = useAuth();
  const isDark = theme.dark;
  const isOffline = useAppStore((s) => s.isOffline);
  const offlineQueueCount = useAppStore((s) => s.offlineQueueCount);
  const [bannerClosed, setBannerClosed] = useState(false);

  const { data: report, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dailyReport', storeId, organizationId],
    queryFn: () =>
      getDailyReport({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
      }),
    enabled: !!storeId && !!organizationId,
  });

  const handleSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.trim() || !organizationId) return;
      const device = await searchDevice({
        sn: keyword.trim(),
        organizationId,
        storeId: storeId ?? undefined,
      });
      if (device) {
        router.push({ pathname: '/device/[id]', params: { id: device.id } } as never);
      } else {
        Alert.alert('未找到', `未找到IMEI为 "${keyword.trim()}" 的设备`);
      }
    },
    [organizationId, storeId, router],
  );

  const handleAction = useCallback(
    (route: string) => {
      if (route === '__wip__') {
        Alert.alert('开发中', '该功能正在开发中，敬请期待');
        return;
      }
      router.push(route as never);
    },
    [router],
  );

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with store info */}
      <View style={[styles.header, { backgroundColor: BRAND_COLOR }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>
              {user?.name ? `${user.name}，你好` : '你好'}
            </Text>
            <Text style={styles.storeLabel}>{storeName ?? '嫩叶ERP'}</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <SearchBar
            placeholder="请输入IMEI（可查在库或已销售）"
            onSearch={handleSearch}
            debounceMs={500}
          />
        </View>
      </View>

      {/* Quick Toolbar - 5 icons in a row */}
      <View style={[styles.toolbar, { backgroundColor: theme.colors.surface }]}>
        {TOOLBAR_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.route}
            style={styles.toolbarItem}
            onPress={() => handleAction(action.route)}
            activeOpacity={0.7}
          >
            <View style={styles.toolbarIcon}>
              <Text style={styles.toolbarEmoji}>{getToolbarEmoji(action.icon)}</Text>
            </View>
            <Text style={[styles.toolbarLabel, { color: isDark ? '#ccc' : '#666' }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!bannerClosed && (isOffline || offlineQueueCount > 0) ? (
        <NotificationBanner
          tone={isOffline ? 'warning' : 'info'}
          title={isOffline ? '离线模式已开启' : '有待同步操作'}
          message={
            isOffline
              ? `你现在处于离线状态，操作将进入队列，联网后自动同步。待同步：${offlineQueueCount} 条`
              : `待同步：${offlineQueueCount} 条（联网后自动提交）`
          }
          actionLabel="查看队列"
          onAction={() => router.push('/offline-queue' as never)}
          onClose={() => setBannerClosed(true)}
        />
      ) : null}

      {/* Dual CTA */}
      <View style={styles.ctaWrap}>
        <DualCTAButton
          leftLabel="找货 >"
          leftSubLabel="同行市集，交易0佣金"
          leftOnPress={() => router.push('/(tabs)/marketplace' as never)}
          leftVariant="red"
          rightLabel="卖货 >"
          rightSubLabel="多渠道发布，流速更快"
          rightOnPress={() => router.push('/cashier' as never)}
          rightVariant="orange"
        />
      </View>

      {/* Stats Cards 2x2 */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statsCell}>
            <StatsCard
              value={report?.purchase.count ?? 0}
              label="今日入库(台)"
              compact
            />
          </View>
          <View style={styles.statsCell}>
            <StatsCard
              value={yuan(report?.sales.amount ?? 0)}
              label="今日销售(额)"
              compact
            />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statsCell}>
            <StatsCard
              value={report?.sales.count ?? 0}
              label="今日出库(台)"
              compact
            />
          </View>
          <View style={styles.statsCell}>
            <StatsCard
              value={yuan(report?.netCashFlow ?? 0)}
              label="今日净流(额)"
              compact
              trend={((report?.netCashFlow ?? 0) >= 0) ? 'up' : 'down'}
              trendValue={((report?.netCashFlow ?? 0) >= 0) ? '正流入' : '负流出'}
            />
          </View>
        </View>
      </View>

      {/* Function Matrix */}
      {QUICK_ACTIONS.map((group) => (
        <View key={group.group} style={styles.matrixSection}>
          <SectionHeader title={group.group} />
          <View style={[styles.matrixGrid, { backgroundColor: theme.colors.surface }]}>
            {group.items.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.matrixItem}
                onPress={() => handleAction(action.route)}
                activeOpacity={0.7}
              >
                <Text style={styles.matrixEmoji}>
                  {getMatrixEmoji(action.label)}
                </Text>
                <Text style={[styles.matrixLabel, { color: isDark ? '#ccc' : '#666' }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.footer, { color: theme.colors.outline }]}>
        {COMPANY_NAME}
      </Text>
    </ScrollView>
  );
}

function getToolbarEmoji(icon: string): string {
  const map: Record<string, string> = {
    'printer': '🖨️',
    'shield-check': '🛡️',
    'camera': '📷',
    'swap-horizontal': '🔄',
    'calendar-check': '📅',
  };
  return map[icon] ?? '📄';
}

function getMatrixEmoji(label: string): string {
  const map: Record<string, string> = {
    '库存盘点': '📋',
    '调拨': '🚚',
    '进货统计': '📊',
    '销售统计': '📈',
    '销售明细': '📝',
    '维修开单': '🔧',
    '订单管理': '📋',
    '维修统计': '📊',
    '配件维护': '🔩',
    '入库': '📥',
    '出库': '📤',
    '进销统计': '📊',
    '记账': '💰',
    '记账明细': '📝',
  };
  return map[label] ?? '📄';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 2,
  },
  storeLabel: {
    fontSize: 13,
    color: 'rgba(51,51,51,0.7)',
  },
  searchWrap: {
    marginHorizontal: -4,
    marginBottom: 4,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  toolbarItem: {
    alignItems: 'center',
  },
  toolbarIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  toolbarEmoji: {
    fontSize: 24,
  },
  toolbarLabel: {
    fontSize: 10,
  },
  ctaWrap: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  statsGrid: {
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statsCell: {
    flex: 1,
  },
  matrixSection: {
    marginTop: 12,
  },
  matrixGrid: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  matrixItem: {
    width: '25%',
    alignItems: 'center',
    gap: 4,
  },
  matrixEmoji: {
    fontSize: 24,
  },
  matrixLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    paddingBottom: 16,
    marginTop: 24,
  },
});
