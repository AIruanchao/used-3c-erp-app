import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Chip, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getInventory } from '../../services/inventory-service';
import { SearchBar } from '../../components/common/SearchBar';
import { DeviceCard } from '../../components/device/DeviceCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';

export default function InventoryScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('IN_STOCK');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['inventory', storeId, search, statusFilter],
    queryFn: () =>
      getInventory({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
        inventoryStatus: statusFilter || undefined,
        search: search || undefined,
      }),
    enabled: !!storeId && !!organizationId,
  });

  const handleDevicePress = useCallback(
    (id: string) => {
      router.push(`/device/${id}` as never);
    },
    [router],
  );

  if (isLoading) return <LoadingScreen />;

  const devices = data?.items ?? [];

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

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {devices.length === 0 ? (
          <EmptyState
            icon="archive"
            title="暂无库存"
            subtitle="入库设备后会显示在这里"
          />
        ) : (
          devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onPress={handleDevicePress}
            />
          ))
        )}
      </ScrollView>
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
  list: {
    paddingBottom: 16,
  },
});
