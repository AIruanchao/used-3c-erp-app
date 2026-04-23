import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, IconButton, Divider } from 'react-native-paper';
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
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
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
              <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>
                {yuan(report?.sales.amount ?? 0)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>采购额</Text>
              <Text style={styles.summaryValue}>
                {yuan(report?.purchase.cost ?? 0)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>净现金流</Text>
              <Text style={[styles.summaryValue, { color: (report?.netCashFlow ?? 0) >= 0 ? '#2e7d32' : '#e53935' }]}>
                {yuan(report?.netCashFlow ?? 0)}
              </Text>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>入库</Text>
              <Text style={styles.summaryCount}>
                {report?.purchase.count ?? 0} 台
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>出库</Text>
              <Text style={styles.summaryCount}>
                {report?.sales.count ?? 0} 台
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>库存预警</Text>
              <Text style={[styles.summaryCount, { color: (report?.stockAgeWarning ?? 0) > 0 ? '#ff9800' : '#4caf50' }]}>
                {report?.stockAgeWarning ?? 0}
              </Text>
            </View>
          </View>
          {(report?.profitTop5?.length ?? 0) > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.profitTitle}>利润TOP5</Text>
              {report?.profitTop5.map((item) => (
                <View key={item.modelName} style={styles.profitRow}>
                  <Text style={styles.profitName}>{item.modelName}</Text>
                  <Text style={[styles.profitValue, { color: item.profit >= 0 ? '#2e7d32' : '#e53935' }]}>
                    {yuan(item.profit)}
                  </Text>
                </View>
              ))}
            </>
          )}
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
  profitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 4,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  profitName: {
    fontSize: 13,
    color: '#616161',
  },
  profitValue: {
    fontSize: 13,
    fontWeight: '600',
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
