import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../services/stats-service';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { QueryError } from '../components/common/QueryError';
import { formatDate } from '../lib/utils';
import { COMPANY_NAME } from '../lib/constants';

function formatMoney(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '¥0.00';
  const fixed = num.toFixed(2);
  const parts = fixed.split('.');
  const intPart = parts[0] ?? '0';
  const decPart = parts[1] ?? '00';
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `¥${withCommas}.${decPart}`;
}

export default function StatsScreen() {
  const { storeId, organizationId } = useAuth();

  const { data: report, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['stats', storeId, organizationId],
    queryFn: () =>
      getDailyReport({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
      }),
    enabled: !!storeId && !!organizationId,
  });

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <Card style={styles.card} mode="elevated">
        <Card.Title
          title={`日报 - ${formatDate(new Date().toISOString())}`}
          titleStyle={styles.cardTitle}
        />
        <Card.Content>
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>销售额</Text>
              <Text style={[styles.metricValue, { color: '#2e7d32' }]}>
                {formatMoney(report?.sales.amount ?? 0)}
              </Text>
              <Text style={styles.metricCount}>
                {report?.sales.count ?? 0} 台
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>采购额</Text>
              <Text style={styles.metricValue}>
                {formatMoney(report?.purchase.cost ?? 0)}
              </Text>
              <Text style={styles.metricCount}>
                {report?.purchase.count ?? 0} 台
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>净现金流</Text>
              <Text style={[styles.metricValue, { color: (report?.netCashFlow ?? 0) >= 0 ? '#2e7d32' : '#e53935' }]}>
                {formatMoney(report?.netCashFlow ?? 0)}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>库存预警</Text>
              <Text style={[styles.metricCount, { fontSize: 20 }, { color: (report?.stockAgeWarning ?? 0) > 0 ? '#ff9800' : '#4caf50' }]}>
                {report?.stockAgeWarning ?? 0}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>应收到期</Text>
              <Text style={styles.metricCount}>{report?.receivableDue ?? 0}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>应付到期</Text>
              <Text style={styles.metricCount}>{report?.payableDue ?? 0}</Text>
            </View>
          </View>

          {(report?.profitTop5?.length ?? 0) > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.profitTitle}>利润TOP5型号</Text>
              {report?.profitTop5.map((item, idx) => (
                <View key={idx} style={styles.profitRow}>
                  <Text style={styles.profitName}>{item.modelName}</Text>
                  <Text style={[styles.profitValue, { color: item.profit >= 0 ? '#2e7d32' : '#e53935' }]}>
                    {formatMoney(item.profit)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </Card.Content>
      </Card>

      <Text style={styles.footer}>{COMPANY_NAME}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  card: { margin: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  metric: { alignItems: 'center', flex: 1 },
  metricLabel: { fontSize: 13, color: '#9e9e9e', marginBottom: 6 },
  metricValue: { fontSize: 20, fontWeight: 'bold' },
  metricCount: { fontSize: 16, fontWeight: '600', color: '#424242' },
  divider: { marginVertical: 4 },
  profitTitle: { fontSize: 14, fontWeight: '600', color: '#424242', marginBottom: 4 },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  profitName: { fontSize: 13, color: '#616161' },
  profitValue: { fontSize: 13, fontWeight: '600' },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#bdbdbd',
    marginBottom: 24,
  },
});
