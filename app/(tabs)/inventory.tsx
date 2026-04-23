import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getInventory, type InventoryListParams } from '../../services/inventory-service';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { FlashList } from '../../components/ui/TypedFlashList';
import { SearchBar } from '../../components/common/SearchBar';
import { DeviceCard } from '../../components/device/DeviceCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import type { Device } from '../../types/device';

export default function InventoryScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('IN_STOCK');

  const params = useMemo<InventoryListParams>(
    () => ({
      storeId: storeId ?? undefined,
      organizationId: organizationId ?? undefined,
      inventoryStatus: statusFilter || undefined,
      search: search || undefined,
    }),
    [storeId, organizationId, statusFilter, search],
  );

  const { items, isLoading, isRefreshing, isFetchingNextPage, loadMore, refresh } =
    usePaginatedList<Device, InventoryListParams>({
      queryKey: ['inventory', storeId, search, statusFilter],
      queryFn: getInventory,
      params,
      enabled: !!storeId && !!organizationId,
    });

  const handleDevicePress = useCallback(
    (id: string) => {
      router.push(`/device/${id}` as never);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Device }) => (
      <DeviceCard device={item} onPress={handleDevicePress} />
    ),
    [handleDevicePress],
  );

  const keyExtractor = useCallback((item: Device) => item.id, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <SearchBar onSearch={setSearch} placeholder="搜索SN/型号/品牌..." />

      <View style={styles.filterRow}>
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={[
            { value: '', label: '全部' },
            { value: 'IN_STOCK', label: '在库' },
            { value: 'SOLD', label: '已售' },
            { value: 'RETURNED_OUT', label: '已退' },
          ]}
          style={styles.filterButtons}
        />
      </View>

      <FlashList
        data={items}
        renderItem={renderItem}
        estimatedItemSize={96}
        keyExtractor={keyExtractor}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="archive"
            title="暂无库存"
            subtitle="入库设备后会显示在这里"
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? <LoadingScreen message="加载更多..." /> : null
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButtons: {
    marginBottom: 4,
  },
  listContent: {
    paddingBottom: 16,
  },
});
