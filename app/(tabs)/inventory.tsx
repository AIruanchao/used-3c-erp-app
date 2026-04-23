import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { searchDevice } from '../../services/inventory-service';
import { useAuth } from '../../hooks/useAuth';
import { SearchBar } from '../../components/common/SearchBar';
import { DeviceCard } from '../../components/device/DeviceCard';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

export default function InventoryScreen() {
  const router = useRouter();
  const { organizationId } = useAuth();
  const [search, setSearch] = useState('');

  const { data: device, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['inventorySearch', organizationId, search],
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

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
  }, []);

  return (
    <View style={styles.container}>
      <SearchBar onSearch={handleSearch} placeholder="搜索SN/型号/IMEI..." />

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
        ) : device ? (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>搜索结果</Text>
            <DeviceCard device={device} onPress={handleDevicePress} />
          </View>
        ) : (
          <EmptyState
            icon="magnify"
            title="搜索库存"
            subtitle="输入SN、型号或关键词搜索在库设备"
          />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  resultSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 8,
  },
});
