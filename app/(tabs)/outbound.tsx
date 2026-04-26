import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { SearchBar } from '../../components/common/SearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { FlashList } from '../../components/ui/TypedFlashList';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getOutboundList } from '../../services/outbound-service';
import type { OutboundItem } from '../../types/outbound';
import { AmountText } from '../../components/finance/AmountText';
import { formatDate } from '../../lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_SIZE = 20;

export default function OutboundListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organizationId, storeId } = useAuth();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const query = useInfiniteQuery({
    queryKey: ['outboundList', organizationId, storeId, search, startDate, endDate],
    queryFn: async ({ pageParam }) => {
      if (!organizationId || !storeId) {
        return {
          items: [] as OutboundItem[],
          total: 0,
          page: 1,
          pageSize: PAGE_SIZE,
          totalPages: 0,
        };
      }
      return getOutboundList({
        organizationId,
        storeId,
        page: pageParam as number,
        pageSize: PAGE_SIZE,
        keyword: search || undefined,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: !!organizationId && !!storeId,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  const renderItem = useCallback(
    ({ item }: { item: OutboundItem }) => (
      <Card
        style={styles.card}
        mode="outlined"
        onPress={() => router.push(`/outbound/${item.id}` as never)}
      >
        <Card.Content>
          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Text style={[styles.orderNo, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {item.orderNo}
              </Text>
              <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                {item.customerName}
                {item.customerPhone ? ` · ${item.customerPhone}` : ''}
              </Text>
              <Text style={[styles.sub, { color: theme.colors.outline }]}>
                {formatDate(item.createdAt, 'YYYY-MM-DD HH:mm')} · 设备 {item.deviceCount} 台
              </Text>
              {item.paymentSummary ? (
                <Text
                  style={[styles.pay, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={2}
                >
                  {item.paymentSummary}
                </Text>
              ) : null}
              {item.receivableAmount != null && Number(String(item.receivableAmount)) > 0 ? (
                <View style={styles.dueRow}>
                  <Text style={{ color: theme.colors.tertiary, fontSize: 12, marginRight: 4 }}>待收</Text>
                  <AmountText value={item.receivableAmount} colorize />
                </View>
              ) : null}
            </View>
            <View style={styles.cardRight}>
              <AmountText value={item.totalAmount} style={{ color: theme.colors.onSurface }} />
            </View>
          </View>
        </Card.Content>
      </Card>
    ),
    [router, theme],
  );

  if (!organizationId || !storeId) {
    return <LoadingScreen message="加载门店信息…" />;
  }

  if (query.isLoading) return <LoadingScreen />;
  if (query.isError) {
    return <QueryError message="加载出库记录失败" onRetry={() => query.refetch()} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      <SearchBar onSearch={setSearch} placeholder="订单号/客户/手机号" />
      <View style={styles.filterRow}>
        <TextInput
          placeholder="开始 YYYY-MM-DD"
          value={startDate}
          onChangeText={setStartDate}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[
            styles.dateInput,
            { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface },
          ]}
        />
        <TextInput
          placeholder="结束 YYYY-MM-DD"
          value={endDate}
          onChangeText={setEndDate}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[
            styles.dateInput,
            { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface },
          ]}
        />
      </View>
      {items.length === 0 ? (
        <EmptyState icon="package-up" title="暂无出库记录" subtitle="可调整日期或搜索条件" />
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          estimatedItemSize={96}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  listContent: { paddingBottom: 24, paddingTop: 4 },
  card: { marginHorizontal: 16, marginVertical: 4 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, marginRight: 8 },
  cardRight: { alignItems: 'flex-end' },
  orderNo: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 4 },
  pay: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  dueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});
