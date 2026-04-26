import React from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { useAuth } from '../../hooks/useAuth';
import { getDailyReport } from '../../services/stats-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { formatDate, yuan } from '../../lib/utils';
import {  Card, Text, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';

export default function LedgerScreen() {
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
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      contentContainerStyle={styles.listContent}
    >
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>今日记账概览</Text>
          <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>{formatDate(new Date().toISOString())}</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>销售收入</Text>
            <Text style={[styles.value, { color: theme.colors.primary }]}>{yuan(report?.sales.amount ?? 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>采购成本</Text>
            <Text style={styles.value}>{yuan(report?.purchase.cost ?? 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>净现金流</Text>
            <Text style={[styles.value, { color: (report?.netCashFlow ?? 0) >= 0 ? theme.colors.primary : theme.colors.error }]}>
              {yuan(report?.netCashFlow ?? 0)}
            </Text>
          </View>
        </Card.Content>
      </Card>
      <EmptyState
        icon="receipt"
        title="记账明细"
        subtitle="暂无独立API支持明细列表，请查看今日概览"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 16 },
  card: { marginHorizontal: 16, marginVertical: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  date: { fontSize: 13, color: '#9e9e9e', marginTop: 2, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 15, color: '#616161' },
  value: { fontSize: 15, fontWeight: '600' },
});
