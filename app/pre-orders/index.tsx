import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { Text, useTheme, Card, Chip, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '../../components/ui/TypedFlashList';
import { getPreOrders } from '../../services/pre-order-service';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { formatDate } from '../../lib/utils';
import { AmountText } from '../../components/finance/AmountText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PreOrder, PreOrderStatus } from '../../types/pre-order';

const PAGE = 15;
const FILTERS: { key: '' | PreOrderStatus; label: string }[] = [
  { key: '', label: '全部' },
  { key: 'PENDING', label: '待确认' },
  { key: 'CONFIRMED', label: '已确认' },
  { key: 'CANCELLED', label: '已取消' },
];

export default function PreOrdersListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useAuth();
  const [status, setStatus] = useState<'' | PreOrderStatus>('');

  const query = useInfiniteQuery({
    queryKey: ['preOrders', storeId, status],
    queryFn: async ({ pageParam }) => {
      if (!storeId) {
        return { data: [] as PreOrder[], total: 0 };
      }
      return getPreOrders({
        storeId,
        status: status || undefined,
        page: pageParam as number,
        pageSize: PAGE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const total = all[0]?.total ?? last.total;
      const loaded = all.reduce((acc, p) => acc + p.data.length, 0);
      return loaded < total ? all.length + 1 : undefined;
    },
    enabled: !!storeId,
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  const renderItem = useCallback(
    ({ item }: { item: PreOrder }) => (
      <Card style={styles.card} mode="outlined" onPress={() => router.push(`/pre-orders/${item.id}` as never)}>
        <Card.Content>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {item.orderNo}
            </Text>
            <Chip compact>{item.status}</Chip>
          </View>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {item.customerName} {item.customerPhone ?? ''}
          </Text>
          <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 4 }}>
            {formatDate(item.createdAt, 'YYYY-MM-DD HH:mm')} · {item.lines?.length ?? 0} 行
          </Text>
          {item.quoteAmount != null && (
            <View style={styles.row}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>报价</Text>
              <AmountText value={item.quoteAmount} />
            </View>
          )}
        </Card.Content>
      </Card>
    ),
    [router, theme],
  );

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  if (!storeId) return <LoadingScreen message="需要门店" />;
  if (query.isLoading) return <LoadingScreen />;
  if (query.isError) return <QueryError onRetry={() => query.refetch()} />;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <Chip key={f.label} selected={status === f.key} onPress={() => setStatus(f.key)} style={styles.chip} compact>
            {f.label}
          </Chip>
        ))}
      </View>
      {items.length === 0 ? (
        <EmptyState icon="clipboard-text" title="暂无预订单" />
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          estimatedItemSize={120}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />}
          contentContainerStyle={styles.list}
        />
      )}
      <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => router.push('/pre-orders/new' as never)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 6 },
  chip: { marginRight: 4, marginBottom: 4 },
  list: { paddingBottom: 100 },
  card: { marginHorizontal: 10, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  title: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
