import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, FlatList } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SearchBar } from '../../components/common/SearchBar';
import { BrandModelPicker } from '../../components/inventory/BrandModelPicker';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { DeviceCardPro } from '../../components/device/DeviceCardPro';
import { useAuth } from '../../hooks/useAuth';
import { getInventoryList } from '../../services/inventory-service';
import { BRAND_COLOR } from '../../lib/theme';
import type { Device } from '../../types/device';

export default function MarketplaceScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { organizationId } = useAuth();

  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState<string>();
  const [modelId, setModelId] = useState<string>();
  const [pickerVisible, setPickerVisible] = useState(false);

  const query = useInfiniteQuery({
    queryKey: ['marketplaceInventory', organizationId, brandId, modelId, search],
    queryFn: ({ pageParam }) =>
      getInventoryList({
        organizationId: organizationId ?? '',
        // Marketplace: search across org, no storeId scoping by default.
        storeId: undefined,
        brandId,
        modelId,
        status: 'IN_STOCK',
        q: search.trim() || undefined,
        page: pageParam as number,
        pageSize: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!organizationId,
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  const handleDevicePress = useCallback(
    (id: string) => {
      router.push(`/device/${id}` as never);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Device }) => <DeviceCardPro device={item} onPress={handleDevicePress} />,
    [handleDevicePress],
  );

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  if (!organizationId) return <LoadingScreen message="加载门店信息…" />;
  if (query.isLoading) return <LoadingScreen message="加载中…" />;
  if (query.isError) return <QueryError message="加载失败" onRetry={() => query.refetch()} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>同行市集</Text>
          <Text style={styles.heroBadge}>Beta</Text>
        </View>
        <Text style={[styles.heroSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          当前展示为“全组织在库”快速找货视图
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <SearchBar placeholder="搜索SN/型号/IMEI…" onSearch={setSearch} debounceMs={400} />
        <View style={styles.filtersRow}>
          <Text
            style={[styles.filterChip, { borderColor: theme.colors.outlineVariant, color: theme.colors.onSurface }]}
            onPress={() => setPickerVisible(true)}
          >
            型号筛选
          </Text>
          <Text
            style={[styles.filterChip, { borderColor: theme.colors.outlineVariant, color: theme.colors.onSurface }]}
            onPress={() => {
              setBrandId(undefined);
              setModelId(undefined);
            }}
          >
            清空
          </Text>
        </View>
      </View>

      {items.length === 0 ? (
        <EmptyState icon="store-search" title="暂无结果" subtitle="可尝试换关键词或清空筛选" />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BrandModelPicker
        visible={pickerVisible}
        onDismiss={() => setPickerVisible(false)}
        organizationId={organizationId}
        selectedBrandId={brandId}
        selectedModelId={modelId}
        onSelect={(bId, mId) => {
          setBrandId(bId);
          setModelId(mId);
          setPickerVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: { backgroundColor: BRAND_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    color: '#333333',
    fontWeight: '800',
    fontSize: 12,
  },
  heroSubtitle: { marginTop: 8, fontSize: 12, fontWeight: '600' },
  filtersRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    overflow: 'hidden',
    fontWeight: '700',
  },
  listContent: { paddingBottom: 24, paddingTop: 4 },
});
