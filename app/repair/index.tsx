import React, { useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, SegmentedButtons, FAB, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getRepairs } from '../../services/repair-service';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { AmountText } from '../../components/finance/AmountText';
import { REPAIR_STATUS_LABELS } from '../../lib/constants';
import { formatDate } from '../../lib/utils';

export default function RepairListScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['repairs', storeId, statusFilter],
    queryFn: () =>
      getRepairs({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
        status: statusFilter || undefined,
      }),
    enabled: !!storeId,
  });

  if (isLoading) return <LoadingScreen />;

  const repairs = data?.items ?? [];

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={statusFilter}
        onValueChange={setStatusFilter}
        buttons={[
          { value: '', label: '全部' },
          { value: 'PENDING', label: '待处理' },
          { value: 'IN_PROGRESS', label: '维修中' },
          { value: 'COMPLETED', label: '已完成' },
        ]}
        style={styles.filter}
      />

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {repairs.length === 0 ? (
          <EmptyState icon="wrench" title="暂无维修工单" />
        ) : (
          repairs.map((repair) => (
            <Card
              key={repair.id}
              style={styles.card}
              mode="outlined"
              onPress={() => router.push(`/repair/${repair.id}` as never)}
            >
              <Card.Content>
                <View style={styles.row}>
                  <Text style={styles.statusBadge}>
                    {REPAIR_STATUS_LABELS[repair.status] ?? repair.status}
                  </Text>
                  <Text style={styles.date}>
                    {formatDate(repair.createdAt, 'MM-DD HH:mm')}
                  </Text>
                </View>
                <Text style={styles.desc} numberOfLines={2}>
                  {repair.description}
                </Text>
                {repair.sn && (
                  <Text style={styles.sn}>SN: {repair.sn}</Text>
                )}
                {repair.estimatedCost && (
                  <AmountText
                    value={repair.estimatedCost}
                    prefix="估价: ¥"
                    style={styles.cost}
                  />
                )}
                {repair.Customer && (
                  <Text style={styles.customer}>
                    客户: {repair.Customer.name} {repair.Customer.phone}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/repair/new' as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  filter: { marginHorizontal: 16, marginVertical: 8 },
  list: { paddingBottom: 80 },
  card: { marginHorizontal: 16, marginVertical: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
  },
  date: { fontSize: 12, color: '#bdbdbd' },
  desc: { fontSize: 14, color: '#212121', marginTop: 4 },
  sn: { fontSize: 13, color: '#757575', fontFamily: 'Courier', marginTop: 4 },
  cost: { fontSize: 14, marginTop: 4 },
  customer: { fontSize: 13, color: '#616161', marginTop: 4 },
  fab: { position: 'absolute', bottom: 16, right: 16 },
});
