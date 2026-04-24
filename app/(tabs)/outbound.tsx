import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { searchDevice } from '../../services/inventory-service';
import { SearchBar } from '../../components/common/SearchBar';
import { DeviceCard } from '../../components/device/DeviceCard';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { INVENTORY_STATUS_LABELS } from '../../lib/constants';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useQuery } from '@tanstack/react-query';

export default function OutboundScreen() {
  const router = useRouter();
  const { organizationId } = useAuth();
  const [search, setSearch] = useState('');

  const { data: device, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['outboundSearch', organizationId, search],
    queryFn: () =>
      searchDevice({
        q: search,
        organizationId: organizationId ?? '',
      }),
    enabled: !!search && !!organizationId,
  });

  const handleDevicePress = useCallback(
    (id: string) => {
      router.push(`/device/${id}` as never);
    },
    [router],
  );

  return (
    <View style={styles.container}>
      <SearchBar onSearch={setSearch} placeholder="搜索SN/型号..." />

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading && search ? (
          <LoadingScreen message="搜索中..." />
        ) : isError ? (
          <QueryError message="搜索失败" onRetry={() => refetch()} />
        ) : search && !device ? (
          <EmptyState
            icon="magnify-close"
            title="未找到设备"
            subtitle={`没有匹配 "${search}" 的在库设备`}
          />
        ) : device && device.inventoryStatus === 'IN_STOCK' ? (
          <View style={styles.resultSection}>
            <DeviceCard device={device} onPress={handleDevicePress} />
          </View>
        ) : search && device && device.inventoryStatus !== 'IN_STOCK' ? (
          <EmptyState
            icon="package-variant-closed-remove"
            title="设备不可出库"
            subtitle={`该设备状态为「${INVENTORY_STATUS_LABELS[device.inventoryStatus] ?? device.inventoryStatus}」，只有「在库」设备可出库`}
          />
        ) : (
          <EmptyState
            icon="package-up"
            title="搜索出库设备"
            subtitle="输入SN搜索在库设备，然后前往收银"
          />
        )}
      </ScrollView>

      <FAB
        icon="barcode-scan"
        label="扫码出库"
        style={styles.fab}
        onPress={() => router.push('/cashier' as never)}
        accessibilityLabel="扫码出库"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  resultSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 72,
    right: 16,
  },
});
