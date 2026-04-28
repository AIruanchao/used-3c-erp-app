import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FAB, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { SearchBar } from '../../components/common/SearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { FlashList } from '../../components/ui/TypedFlashList';
import { AmountText } from '../../components/finance/AmountText';
import { getRepairList, type RepairItem } from '../../services/repair-service';
import { FilterChip } from '../../components/common/FilterChip';

export default function RepairListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { storeId, organizationId } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<'ALL' | 'PENDING_QUOTE' | 'IN_REPAIR' | 'COMPLETED'>('ALL');

  const statusParam = useMemo(() => {
    if (tab === 'PENDING_QUOTE') return 'QUOTED';
    if (tab === 'IN_REPAIR') return 'IN_REPAIR';
    if (tab === 'COMPLETED') return 'COMPLETED';
    return undefined;
  }, [tab]);

  const query = useInfiniteQuery({
    queryKey: ['repairList', organizationId, storeId, statusParam],
    queryFn: ({ pageParam }) =>
      getRepairList({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
        status: statusParam,
        page: pageParam as number,
        pageSize: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((s, p) => s + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: !!organizationId && !!storeId,
  });

  const items = useMemo(() => {
    const all = query.data?.pages.flatMap((p) => p.data) ?? [];
    const q = keyword.trim();
    if (!q) return all;
    return all.filter((o) => {
      const hay = `${o.customerName ?? ''} ${o.customerPhone ?? ''} ${o.deviceSn ?? ''} ${o.deviceBrand ?? ''} ${o.deviceModel ?? ''} ${o.faultDescription ?? ''}`;
      return hay.includes(q);
    });
  }, [query.data, keyword]);

  const handlePress = useCallback(
    (o: RepairItem) => {
      router.push({ pathname: '/repair/[id]', params: { id: o.id } } as never);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: RepairItem }) => (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {item.customerName ?? '散客'} · {item.deviceBrand ?? '未知'} {item.deviceModel ?? ''}
          </Text>
          <Text style={[styles.status, { color: theme.colors.onSurfaceVariant }]}>{item.status}</Text>
        </View>
        <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
          {item.faultDescription}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            IMEI: {item.deviceSn ?? '--'}
          </Text>
          <AmountText value={item.quoteAmount ?? 0} prefix="报价 ¥" style={styles.amount} />
        </View>
      </TouchableOpacity>
    ),
    [handlePress, theme],
  );

  const ListEmpty = useCallback(() => {
    if (query.isLoading) return <LoadingScreen message="加载中..." />;
    if (query.isError) return <QueryError message="加载失败" onRetry={() => query.refetch()} />;
    return <EmptyState icon="wrench" title="暂无维修工单" subtitle="换个筛选条件试试" />;
  }, [query]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar onSearch={setKeyword} placeholder="搜索客户/IMEI/机型/故障..." />

      <View style={styles.tabRow}>
        <FilterChip label="全部" active={tab === 'ALL'} onPress={() => setTab('ALL')} onRemove={() => setTab('ALL')} />
        <FilterChip label="待报价" active={tab === 'PENDING_QUOTE'} onPress={() => setTab('PENDING_QUOTE')} onRemove={() => setTab('PENDING_QUOTE')} />
        <FilterChip label="维修中" active={tab === 'IN_REPAIR'} onPress={() => setTab('IN_REPAIR')} onRemove={() => setTab('IN_REPAIR')} />
        <FilterChip label="已完成" active={tab === 'COMPLETED'} onPress={() => setTab('COMPLETED')} onRemove={() => setTab('COMPLETED')} />
      </View>

      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item: RepairItem) => item.id}
        estimatedItemSize={110}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/repair/new' as never)}
        accessibilityLabel="新建维修工单"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  fab: { position: 'absolute', bottom: 16, right: 16 },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: '700', flex: 1 },
  status: { fontSize: 12, fontWeight: '600' },
  desc: { fontSize: 12, marginTop: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  meta: { fontSize: 12, flex: 1 },
  amount: { fontSize: 12 },
});
