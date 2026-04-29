import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { Chip, SegmentedButtons, Text, useTheme, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '../../components/ui/TypedFlashList';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { useAuth } from '../../hooks/useAuth';
import { listTradeOrders } from '../../services/trade-order-service';
import { formatDate } from '../../lib/utils';

type Filter = 'ALL' | 'DRAFT' | 'COMPLETED';

export default function TradeOrderListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { organizationId, storeId } = useAuth();
  const [filter, setFilter] = useState<Filter>('ALL');

  const q = useQuery({
    queryKey: ['tradeOrders', organizationId, storeId],
    queryFn: () =>
      listTradeOrders({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
      }),
    enabled: !!organizationId && !!storeId,
  });

  const items = (q.data?.items ?? []).filter((row) => {
    if (filter === 'ALL') return true;
    return row.status === filter;
  });

  const renderItem = useCallback(
    ({ item }: { item: (typeof items)[0] }) => (
      <View style={[styles.card, { borderColor: theme.colors.outline }]}>
        <Text style={{ fontWeight: '700' }}>{item.id.slice(0, 8)}…</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          {formatDate(item.createdAt)} ·{' '}
          <Chip compact style={{ alignSelf: 'flex-start' }}>
            {item.status}
          </Chip>
        </Text>
        {item.TradeInItem?.length ? (
          <Text style={{ marginTop: 8 }}>回收明细 {item.TradeInItem.length} 条</Text>
        ) : null}
      </View>
    ),
    [theme.colors.onSurfaceVariant],
  );

  if (!organizationId || !storeId) return <LoadingScreen />;
  if (q.isLoading) return <LoadingScreen />;
  if (q.isError) return <QueryError onRetry={() => q.refetch()} />;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <PageHeader title="回收登记" showBack />
      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        buttons={[
          { value: 'ALL', label: '全部' },
          { value: 'DRAFT', label: '进行中' },
          { value: 'COMPLETED', label: '已完成' },
        ]}
        style={styles.seg}
      />
      <FlashList
        style={{ flex: 1 }}
        data={items}
        estimatedItemSize={96}
        keyExtractor={(it) => it.id}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={<EmptyState icon="swap-horizontal" title="暂无回收单" />}
        renderItem={renderItem}
      />
      <FAB icon="plus" style={styles.fab} onPress={() => router.push('/trade/new' as never)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  seg: { marginHorizontal: 12, marginBottom: 8 },
  card: {
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
