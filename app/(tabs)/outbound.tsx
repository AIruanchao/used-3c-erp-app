import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { searchDevice } from '../../services/inventory-service';
import { SearchBar } from '../../components/common/SearchBar';
import { DeviceCard } from '../../components/device/DeviceCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import type { Device } from '../../types/device';
import { useQuery } from '@tanstack/react-query';

export default function OutboundScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [search, setSearch] = useState('');

  const { data: device, isLoading, refetch, isRefetching } = useQuery({
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
        ) : search && !device ? (
          <EmptyState
            icon="magnify-close"
            title="未找到设备"
            subtitle={`没有匹配 "${search}" 的在库设备`}
          />
        ) : device ? (
          <View style={styles.resultSection}>
            <DeviceCard device={device} onPress={handleDevicePress} />
          </View>
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
    bottom: 16,
    right: 16,
  },
});
