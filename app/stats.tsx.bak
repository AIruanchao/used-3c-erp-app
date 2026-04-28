import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {  Card, Divider, useTheme } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../services/stats-service';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { QueryError } from '../components/common/QueryError';
import { formatDate, yuan } from '../lib/utils';
import { COMPANY_NAME } from '../lib/constants';

export default function StatsScreen() {
  const theme = useTheme();

  const { storeId, organizationId } = useAuth();

  const { data: report, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dailyReport', storeId, organizationId],
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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
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
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>销售额</Text>
              <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
                {yuan(report?.sales.amount ?? 0)}
              </Text>
              <Text style={[styles.metricCount, { color: theme.colors.onSurface }]}>
                {report?.sales.count ?? 0} 台
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>采购额</Text>
              <Text style={styles.metricValue}>
                {yuan(report?.purchase.cost ?? 0)}
              </Text>
              <Text style={[styles.metricCount, { color: theme.colors.onSurface }]}>
                {report?.purchase.count ?? 0} 台
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>净现金流</Text>
              <Text style={[styles.metricValue, { color: (report?.netCashFlow ?? 0) >= 0 ? theme.colors.primary : theme.colors.error }]}>
                {yuan(report?.netCashFlow ?? 0)}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>库存预警</Text>
              <Text style={[styles.metricCount, { fontSize: 20 }, { color: (report?.stockAgeWarning ?? 0) > 0 ? theme.colors.error : theme.colors.primary }]}>
                {report?.stockAgeWarning ?? 0}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>应收到期</Text>
              <Text style={[styles.metricCount, { color: theme.colors.onSurface }]}>{report?.receivableDue ?? 0}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>应付到期</Text>
              <Text style={[styles.metricCount, { color: theme.colors.onSurface }]}>{report?.payableDue ?? 0}</Text>
            </View>
          </View>

          {(report?.profitTop5?.length ?? 0) > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text style={[styles.profitTitle, { color: theme.colors.onSurface }]}>利润TOP5型号</Text>
              {report?.profitTop5.map((item) => (
                <View key={item.modelName} style={styles.profitRow}>
                  <Text style={[styles.profitName, { color: theme.colors.onSurfaceVariant }]}>{item.modelName}</Text>
                  <Text style={[styles.profitValue, { color: item.profit >= 0 ? theme.colors.primary : theme.colors.error }]}>
                    {yuan(item.profit)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </Card.Content>
      </Card>

      <Text style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}>{COMPANY_NAME}</Text>
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
