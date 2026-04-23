import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, IconButton, Divider, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../../services/stats-service';
import { COMPANY_NAME } from '../../lib/constants';
import { yuan, formatDate } from '../../lib/utils';
import { LoadingScreen } from '../../components/common/LoadingScreen';

interface QuickAction {
  icon: string;
  label: string;
  route: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'package-down', label: '快速入库', route: '/(tabs)/inbound', color: '#4caf50' },
  { icon: 'package-up', label: '出库', route: '/(tabs)/outbound', color: '#2196f3' },
  { icon: 'archive', label: '库存查询', route: '/(tabs)/inventory', color: '#ff9800' },
  { icon: 'cash-register', label: '收银台', route: '/cashier', color: '#e53935' },
  { icon: 'wrench', label: '维修工单', route: '/repair/index', color: '#9c27b0' },
  { icon: 'chart-bar', label: '统计报表', route: '/stats', color: '#00bcd4' },
  { icon: 'cash-multiple', label: '财务', route: '/finance/index', color: '#795548' },
  { icon: 'account-group', label: '客户', route: '/customer/index', color: '#607d8b' },
];

export default function WorkspaceScreen() {
  const router = useRouter();
  const { storeId, organizationId, storeName, user } = useAuth();
  const theme = useTheme();

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['dailyReport', storeId],
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            你好，{user?.name ?? '用户'}
          </Text>
          <Text style={styles.storeName}>{storeName ?? '未选择门店'}</Text>
        </View>
      </View>

      {/* Daily Summary */}
      <Card style={styles.summaryCard} mode="elevated">
        <Card.Title title="今日概览" titleStyle={styles.cardTitle} />
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>销售额</Text>
              <Text style={styles.summaryValue}>
                {yuan(report?.totalSales ?? 0)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>采购额</Text>
              <Text style={styles.summaryValue}>
                {yuan(report?.totalPurchases ?? 0)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>利润</Text>
              <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>
                {yuan(report?.profit ?? 0)}
              </Text>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>入库</Text>
              <Text style={styles.summaryCount}>
                {report?.totalDevicesIn ?? 0} 台
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>出库</Text>
              <Text style={styles.summaryCount}>
                {report?.totalDevicesOut ?? 0} 台
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>维修</Text>
              <Text style={styles.summaryCount}>
                {report?.totalRepairs ?? 0} 单
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>快捷操作</Text>
      <View style={styles.actionGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.route}
            style={styles.actionItem}
            onPress={() => handleAction(action.route)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: action.color + '15' },
              ]}
            >
              <IconButton
                icon={action.icon}
                size={24}
                iconColor={action.color}
              />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footer}>{COMPANY_NAME}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  storeName: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9e9e9e',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  summaryCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  actionItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: '#616161',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#bdbdbd',
    paddingBottom: 16,
  },
});
