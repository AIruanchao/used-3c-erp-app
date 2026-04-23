import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '../../components/ui/TypedFlashList';
import { Card, SegmentedButtons, FAB, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getRepairs } from '../../services/repair-service';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { AmountText } from '../../components/finance/AmountText';
import { REPAIR_STATUS_LABELS } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import type { RepairItem } from '../../types/api';

type RepairParams = { storeId?: string; organizationId?: string; status?: string };

export default function RepairListScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

  const params = useMemo<RepairParams>(
    () => ({
      storeId: storeId ?? undefined,
      organizationId: organizationId ?? undefined,
      status: statusFilter || undefined,
    }),
    [storeId, organizationId, statusFilter],
  );

  const { items, isLoading, isRefreshing, isFetchingNextPage, loadMore, refresh } =
    usePaginatedList<RepairItem, RepairParams>({
      queryKey: ['repairs', storeId, statusFilter],
      queryFn: getRepairs,
      params,
      enabled: !!storeId,
    });

  const renderItem = useCallback(
    ({ item: repair }: { item: RepairItem }) => (
      <Card
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
          {repair.sn && <Text style={styles.sn}>SN: {repair.sn}</Text>}
          {repair.estimatedCost != null && (
            <AmountText value={repair.estimatedCost} style={styles.cost} />
          )}
          {repair.Customer && (
            <Text style={styles.customer}>
              客户: {repair.Customer.name} {repair.Customer.phone}
            </Text>
          )}
        </Card.Content>
      </Card>
    ),
    [router],
  );

  const keyExtractor = useCallback((item: RepairItem) => item.id, []);

  if (isLoading) return <LoadingScreen />;

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

      <FlashList
        data={items}
        renderItem={renderItem}
        estimatedItemSize={100}
        keyExtractor={keyExtractor}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        ListEmptyComponent={<EmptyState icon="wrench" title="暂无维修工单" />}
        ListFooterComponent={
          isFetchingNextPage ? <LoadingScreen message="加载更多..." /> : null
        }
        contentContainerStyle={styles.listContent}
      />

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
  listContent: { paddingBottom: 80 },
  card: { marginHorizontal: 16, marginVertical: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: { fontSize: 12, fontWeight: '600', color: '#1976d2' },
  date: { fontSize: 12, color: '#bdbdbd' },
  desc: { fontSize: 14, color: '#212121', marginTop: 4 },
  sn: { fontSize: 13, color: '#757575', fontFamily: 'Courier', marginTop: 4 },
  cost: { fontSize: 14, marginTop: 4 },
  customer: { fontSize: 13, color: '#616161', marginTop: 4 },
  fab: { position: 'absolute', bottom: 16, right: 16 },
});
