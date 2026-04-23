import React from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { getDailyReport } from '../../services/stats-service';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { formatDate } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';

export default function ReceivableScreen() {
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
      contentContainerStyle={styles.list}
    >
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text style={styles.title}>应收账款概览</Text>
          <Text style={styles.date}>截至 {formatDate(new Date().toISOString())}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>待收款</Text>
            <Text style={[styles.value, { color: '#1976d2' }]}>{report?.receivableDue ?? 0} 笔</Text>
          </View>
        </Card.Content>
      </Card>
      <EmptyState
        icon="cash-plus"
        title="详细应收列表"
        subtitle="暂无独立API支持，请联系管理员"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 16 },
  card: { marginHorizontal: 16, marginVertical: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  date: { fontSize: 13, color: '#9e9e9e', marginTop: 2, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 15, color: '#616161' },
  value: { fontSize: 18, fontWeight: '600' },
});
