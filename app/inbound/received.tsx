import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '../../components/ui/TypedFlashList';
import { Card, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { getInboundReceived, type InboundParams } from '../../services/inbound-service';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { formatDate, decStr } from '../../lib/utils';

interface InboundRecord {
  id: string;
  status: string;
  remark: string | null;
  createdAt: string;
  GoodsInboundLine?: Array<{
    id: string;
    sn?: string;
    quantity: number;
    unitCost: string;
    Sku?: { name: string };
  }>;
}

export default function InboundReceivedScreen() {
  const { storeId, organizationId } = useAuth();

  const params = useMemo<InboundParams>(
    () => ({
      storeId: storeId ?? undefined,
      organizationId: organizationId ?? undefined,
    }),
    [storeId, organizationId],
  );

  const { items, isLoading, isRefreshing, isFetchingNextPage, loadMore, refresh } =
    usePaginatedList<InboundRecord, InboundParams>({
      queryKey: ['inboundReceived', storeId],
      queryFn: getInboundReceived,
      params,
      enabled: !!storeId,
    });

  const renderItem = useCallback(({ item }: { item: InboundRecord }) => {
    const lines = item.GoodsInboundLine ?? [];
    const skuName = lines[0]?.Sku?.name ?? '未知';
    const unitCost = lines[0]?.unitCost ?? '0';
    const sn = lines[0]?.sn;

    return (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.row}>
            <Text style={styles.status}>{item.status}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt, 'MM-DD HH:mm')}</Text>
          </View>
          <Text style={styles.skuName} numberOfLines={1}>{skuName}</Text>
          {sn && <Text style={styles.sn}>SN: {sn}</Text>}
          <Text style={styles.cost}>成本: ¥{decStr(unitCost)}</Text>
          {item.remark && <Text style={styles.remark} numberOfLines={1}>{item.remark}</Text>}
        </Card.Content>
      </Card>
    );
  }, []);

  const keyExtractor = useCallback((item: InboundRecord) => item.id, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      estimatedItemSize={96}
      keyExtractor={keyExtractor}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      ListEmptyComponent={<EmptyState icon="package-down" title="暂无入库记录" />}
      ListFooterComponent={isFetchingNextPage ? <LoadingScreen message="加载更多..." /> : null}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 16 },
  card: { marginHorizontal: 16, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { fontSize: 12, fontWeight: '600', color: '#4caf50' },
  date: { fontSize: 12, color: '#bdbdbd' },
  skuName: { fontSize: 15, fontWeight: '500', color: '#212121', marginTop: 4 },
  sn: { fontSize: 13, color: '#757575', fontFamily: 'Courier', marginTop: 2 },
  cost: { fontSize: 13, color: '#616161', marginTop: 2 },
  remark: { fontSize: 12, color: '#9e9e9e', marginTop: 2 },
});
