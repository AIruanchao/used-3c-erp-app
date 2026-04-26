import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/auth-store';
import { SearchBar } from '../../components/common/SearchBar';
import { DeviceCard } from '../../components/device/DeviceCard';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { BrandModelPicker } from '../../components/inventory/BrandModelPicker';
import { BottomSheetFilter } from '../../components/inventory/BottomSheetFilter';
import type { FilterGroup } from '../../components/inventory/BottomSheetFilter';
import { getInventoryList } from '../../services/inventory-service';
import type { Device } from '../../types/device';

// ─── Filter definitions ────────────────────────────────────────

const CHANNEL_OPTIONS = [
  { label: '全部', value: '' },
  { label: '国行', value: '国行' },
  { label: '港版', value: '港版' },
  { label: '美版有锁', value: '美版有锁' },
  { label: '美版无锁', value: '美版无锁' },
  { label: '日版', value: '日版' },
  { label: '韩版', value: '韩版' },
  { label: '资源机', value: '资源机' },
  { label: '展示机', value: '展示机' },
];

const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '在库', value: 'IN_STOCK' },
  { label: '已预留', value: 'RESERVED' },
  { label: '已售', value: 'SOLD_OUT' },
];

const AGE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '7天内', value: '7' },
  { label: '15天内', value: '15' },
  { label: '30天内', value: '30' },
  { label: '60天内', value: '60' },
  { label: '90天以上', value: '90+' },
];

const CONDITION_OPTIONS = [
  { label: '全部', value: '' },
  { label: '99新', value: '99新' },
  { label: '95新', value: '95新' },
  { label: '9成新', value: '9成新' },
  { label: '8成新', value: '8成新' },
  { label: '小花', value: '小花' },
  { label: '大花', value: '大花' },
  { label: '外爆', value: '外爆' },
  { label: '内爆', value: '内爆' },
];

// Filter group configs for BottomSheetFilter
const CHANNEL_FILTER_GROUP: FilterGroup = { key: 'channel', label: '渠道', options: CHANNEL_OPTIONS };
const STATUS_FILTER_GROUP: FilterGroup = { key: 'status', label: '状态', options: STATUS_OPTIONS };
const AGE_FILTER_GROUP: FilterGroup = { key: 'age', label: '库龄', options: AGE_OPTIONS };
const CONDITION_FILTER_GROUP: FilterGroup = { key: 'condition', label: '成色', options: CONDITION_OPTIONS };

type CategoryTab = 'USED' | 'NEW' | 'PARTS';
type FilterSheetKey = 'channel' | 'status' | 'age' | 'condition';

const CATEGORY_CONFIG: Record<CategoryTab, { label: string; apiCategory?: string }> = {
  USED: { label: '二手', apiCategory: 'USED_DEVICE' },
  NEW: { label: '新机', apiCategory: 'NEW_DEVICE' },
  PARTS: { label: '配件' },
};

const FILTER_SHEET_CONFIG: Record<FilterSheetKey, { label: string; groups: FilterGroup[] }> = {
  channel: { label: '渠道', groups: [CHANNEL_FILTER_GROUP] },
  status: { label: '状态', groups: [STATUS_FILTER_GROUP] },
  age: { label: '库龄', groups: [AGE_FILTER_GROUP] },
  condition: { label: '成色', groups: [CONDITION_FILTER_GROUP] },
};

const PAGE_SIZE = 20;

// ─── Screen Component ──────────────────────────────────────────

export default function InventoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { organizationId, storeId, stores, storeName, selectStore } = useAuth();

  // Category tab
  const [category, setCategory] = useState<CategoryTab>('USED');

  // Filter state
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState<string>();
  const [modelId, setModelId] = useState<string>();
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState('');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('');

  // Picker / sheet visibility
  const [pickerVisible, setPickerVisible] = useState(false);
  const [filterSheetKey, setFilterSheetKey] = useState<FilterSheetKey | null>(null);

  // Selected brand/model names for display
  const [selectedBrandName, setSelectedBrandName] = useState<string>();
  const [selectedModelName, setSelectedModelName] = useState<string>();

  // Store selector
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);

  const handleDevicePress = useCallback(
    (id: string) => {
      router.push(`/device/${id}` as never);
    },
    [router],
  );

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
  }, []);

  // Resolve category to API param
  const apiCategory = useMemo(() => {
    return CATEGORY_CONFIG[category].apiCategory;
  }, [category]);

  // Infinite query
  const query = useInfiniteQuery({
    queryKey: [
      'inventoryList',
      organizationId,
      storeId,
      brandId,
      modelId,
      status,
      channel,
      age,
      condition,
      apiCategory,
      search,
    ],
    queryFn: ({ pageParam }) =>
      getInventoryList({
        organizationId: organizationId ?? '',
        storeId: storeId ?? undefined,
        brandId,
        modelId,
        status: status || undefined,
        channel: channel || undefined,
        condition: condition || undefined,
        age: age || undefined,
        category: apiCategory,
        q: search || undefined,
        page: pageParam as number,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: !!organizationId,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const totalPages = query.data?.pages[0]?.totalPages ?? 0;

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const handleRefresh = useCallback(() => {
    query.refetch();
  }, [query]);

  // Brand/Model picker handlers
  const handleBrandModelSelect = useCallback(
    (bId?: string, mId?: string) => {
      setBrandId(bId);
      setModelId(mId);
      setPickerVisible(false);
    },
    [],
  );

  // Filter sheet handlers
  const openFilterSheet = useCallback((key: FilterSheetKey) => {
    setFilterSheetKey(key);
  }, []);

  const closeFilterSheet = useCallback(() => {
    setFilterSheetKey(null);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    switch (key) {
      case 'channel': setChannel(value); break;
      case 'status': setStatus(value); break;
      case 'age': setAge(value); break;
      case 'condition': setCondition(value); break;
    }
  }, []);

  const handleFilterReset = useCallback(() => {
    if (filterSheetKey) {
      const groups = FILTER_SHEET_CONFIG[filterSheetKey].groups;
      groups.forEach((g) => {
        handleFilterChange(g.key, '');
      });
    }
  }, [filterSheetKey, handleFilterChange]);

  // Reset all filters
  const handleResetAll = useCallback(() => {
    setBrandId(undefined);
    setModelId(undefined);
    setSelectedBrandName(undefined);
    setSelectedModelName(undefined);
    setStatus('');
    setChannel('');
    setAge('');
    setCondition('');
  }, []);

  // Compute display labels for filter chips
  const brandModelLabel = selectedModelName
    ? `${selectedBrandName} ${selectedModelName}`
    : selectedBrandName
      ? selectedBrandName
      : '型号';

  const channelLabel = channel || '渠道';
  const statusLabel = status
    ? STATUS_OPTIONS.find((o) => o.value === status)?.label ?? '状态'
    : '状态';
  const ageLabel = age
    ? AGE_OPTIONS.find((o) => o.value === age)?.label ?? '库龄'
    : '库龄';
  const conditionLabel = condition
    ? CONDITION_OPTIONS.find((o) => o.value === condition)?.label ?? '成色'
    : '成色';

  const hasActiveFilters = brandId || channel || status || age || condition;

  const renderItem = useCallback(
    ({ item }: { item: Device }) => (
      <DeviceCard device={item} onPress={handleDevicePress} />
    ),
    [handleDevicePress],
  );

  const ListFooter = useCallback(() => {
    if (query.isFetchingNextPage) {
      return (
        <View style={styles.footerLoading}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>加载更多...</Text>
        </View>
      );
    }
    if (query.hasNextPage) {
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
          <Text style={{ color: '#FF6D00', fontWeight: '600' }}>
            加载更多 ({items.length}/{total})
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  }, [query, items.length, total, loadMore, theme]);

  const ListEmpty = useCallback(() => {
    if (query.isLoading) {
      return <LoadingScreen message="加载中..." />;
    }
    if (query.isError) {
      return <QueryError message="加载失败" onRetry={handleRefresh} />;
    }
    return (
      <EmptyState
        icon="package-variant-closed"
        title="暂无库存"
        subtitle="当前筛选条件下没有找到设备"
      />
    );
  }, [query, handleRefresh]);

  // Store selector dropdown data
  const storeLabel = storeName || '全部门店';

  // Current filter sheet config
  const currentSheetConfig = filterSheetKey ? FILTER_SHEET_CONFIG[filterSheetKey] : null;
  const currentSheetValues: Record<string, string> = useMemo(() => {
    if (!filterSheetKey) return {};
    const map: Record<FilterSheetKey, Record<string, string>> = {
      channel: { channel },
      status: { status },
      age: { age },
      condition: { condition },
    };
    return map[filterSheetKey];
  }, [filterSheetKey, channel, status, age, condition]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Store selector */}
      <TouchableOpacity
        style={[styles.storeSelector, { borderBottomColor: theme.colors.elevation.level2 }]}
        onPress={() => setStoreSelectorOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={[styles.storeSelectorText, { color: theme.colors.onSurface }]}>
          📍 {storeLabel}
        </Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
          {stores.length > 1 ? '▼' : ''}
        </Text>
      </TouchableOpacity>

      {/* Store dropdown */}
      {storeSelectorOpen && stores.length > 1 && (
        <View style={[styles.storeDropdown, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.elevation.level2 }]}>
          {stores.map((s) => (
            <TouchableOpacity
              key={s.storeId}
              style={[
                styles.storeDropdownItem,
                s.storeId === storeId && { backgroundColor: theme.colors.primaryContainer },
              ]}
              onPress={() => {
                // Trigger store switch
                selectStore(s);
                setStoreSelectorOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.storeDropdownText,
                  {
                    color: s.storeId === storeId ? theme.colors.primary : theme.colors.onSurface,
                  },
                ]}
              >
                {s.storeName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Category tabs */}
      <View style={[styles.categoryTabs, { borderBottomColor: theme.colors.elevation.level2 }]}>
        {(Object.keys(CATEGORY_CONFIG) as CategoryTab[]).map((tab) => {
          const isActive = category === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.categoryTab,
                isActive && styles.categoryTabActive,
              ]}
              onPress={() => setCategory(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  {
                    color: isActive ? '#FFFFFF' : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {CATEGORY_CONFIG[tab].label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search bar */}
      <SearchBar onSearch={handleSearch} placeholder="搜索SN/型号/IMEI..." />

      {/* Filter row - horizontal scrollable chips */}
      <View style={[styles.filterRowWrapper, { borderBottomColor: theme.colors.elevation.level2 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRowScroll}>
          {/* Brand/Model filter chip */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              brandId && styles.filterChipActive,
              { borderColor: brandId ? '#1890ff' : theme.colors.outlineVariant },
            ]}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: brandId ? '#1890ff' : theme.colors.onSurfaceVariant,
                },
              ]}
              numberOfLines={1}
            >
              {brandModelLabel}
            </Text>
          </TouchableOpacity>

          {/* Channel filter chip */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              channel && styles.filterChipActive,
              { borderColor: channel ? '#1890ff' : theme.colors.outlineVariant },
            ]}
            onPress={() => openFilterSheet('channel')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: channel ? '#1890ff' : theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {channelLabel}
            </Text>
          </TouchableOpacity>

          {/* Status filter chip */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              status && styles.filterChipActive,
              { borderColor: status ? '#1890ff' : theme.colors.outlineVariant },
            ]}
            onPress={() => openFilterSheet('status')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: status ? '#1890ff' : theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {statusLabel}
            </Text>
          </TouchableOpacity>

          {/* Age filter chip */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              age && styles.filterChipActive,
              { borderColor: age ? '#1890ff' : theme.colors.outlineVariant },
            ]}
            onPress={() => openFilterSheet('age')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: age ? '#1890ff' : theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {ageLabel}
            </Text>
          </TouchableOpacity>

          {/* Condition filter chip */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              condition && styles.filterChipActive,
              { borderColor: condition ? '#1890ff' : theme.colors.outlineVariant },
            ]}
            onPress={() => openFilterSheet('condition')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: condition ? '#1890ff' : theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {conditionLabel}
            </Text>
          </TouchableOpacity>

          {/* Reset all chip (only when filters active) */}
          {hasActiveFilters && (
            <TouchableOpacity
              style={[styles.filterChip, { borderColor: theme.colors.error }]}
              onPress={handleResetAll}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, { color: theme.colors.error }]}>
                ✕ 清空
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Total count */}
      {total > 0 && (
        <View style={styles.countRow}>
          <Text style={[styles.countText, { color: theme.colors.onSurfaceVariant }]}>
            共 {total} 台
            {totalPages > 1
              ? ` · 第 ${Math.min(query.data?.pages.length ?? 1, totalPages)}/${totalPages} 页`
              : ''}
          </Text>
        </View>
      )}

      {/* Device list */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onRefresh={handleRefresh}
        refreshing={query.isRefetching}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Brand+Model Picker BottomSheet */}
      <BrandModelPicker
        visible={pickerVisible}
        onDismiss={() => setPickerVisible(false)}
        organizationId={organizationId ?? ''}
        selectedBrandId={brandId}
        selectedModelId={modelId}
        onSelect={handleBrandModelSelect}
      />

      {/* Generic Filter BottomSheet */}
      {currentSheetConfig && (
        <BottomSheetFilter
          visible={filterSheetKey !== null}
          onDismiss={closeFilterSheet}
          groups={currentSheetConfig.groups}
          values={currentSheetValues}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
          onConfirm={closeFilterSheet}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  storeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  storeSelectorText: {
    fontSize: 15,
    fontWeight: '600',
  },
  storeDropdown: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  storeDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  storeDropdownText: {
    fontSize: 14,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  categoryTabActive: {
    backgroundColor: '#1890ff',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterRowWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterRowScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#e6f7ff',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  footerLoading: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
});
