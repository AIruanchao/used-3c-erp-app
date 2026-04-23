import React, { useCallback, useState, useMemo } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getDevices, type DeviceListParams } from '../../services/device-service';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { FlashList } from '../../components/ui/TypedFlashList';
import { SearchBar } from '../../components/common/SearchBar';
import { DeviceCard } from '../../components/device/DeviceCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import type { Device } from '../../types/device';

export default function OutboundScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [search, setSearch] = useState('');

  const params = useMemo<DeviceListParams>(
    () => ({
      storeId: storeId ?? undefined,
      organizationId: organizationId ?? undefined,
      inventoryStatus: 'IN_STOCK',
      search: search || undefined,
    }),
    [storeId, organizationId, search],
  );

  const { items, isLoading, isRefreshing, isFetchingNextPage, loadMore, refresh } =
    usePaginatedList<Device, DeviceListParams>({
      queryKey: ['outboundDevices', storeId, search],
      queryFn: getDevices,
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
      <SearchBar onSearch={setSearch} placeholder="搜索SN/型号..." />

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
            icon="package-up"
            title="暂无在库设备"
            subtitle="入库设备后会显示在这里"
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? <LoadingScreen message="加载更多..." /> : null
        }
        contentContainerStyle={styles.listContent}
      />

      <FAB
        icon="barcode-scan"
        label="扫码出库"
        style={styles.fab}
        onPress={() => router.push('/cashier' as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  listContent: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});
