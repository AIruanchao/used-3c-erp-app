import React from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { getDailyReport } from '../../services/stats-service';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { formatDate } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';

export default function PayableScreen() {
  const { storeId, organizationId } = useAuth();

  const { data: report, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['payables', storeId],
    queryFn: () =>
      getDailyReport({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
      }),
    enabled: !!storeId && !!organizationId,
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      contentContainerStyle={styles.list}
    >
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text style={styles.title}>应付账款概览</Text>
          <Text style={styles.date}>截至 {formatDate(new Date().toISOString())}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>待付款</Text>
            <Text style={[styles.value, { color: '#e53935' }]}>{report?.payableDue ?? 0} 笔</Text>
          </View>
        </Card.Content>
      </Card>
      <EmptyState
        icon="cash-minus"
        title="详细应付列表"
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
