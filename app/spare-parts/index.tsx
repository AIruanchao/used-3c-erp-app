import React, { useState, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, TextInput, Pressable } from 'react-native';
import { Text, useTheme, Card, Switch, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '../../components/ui/TypedFlashList';
import { getSpareParts } from '../../services/spare-parts-service';
import { useAuth } from '../../hooks/useAuth';
import { SearchBar } from '../../components/common/SearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { AmountText } from '../../components/finance/AmountText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SparePart } from '../../types/spare-parts';

const PAGE = 20;

export default function SparePartsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  const query = useInfiniteQuery({
    queryKey: ['spareParts', storeId, search, category, lowOnly],
    queryFn: async ({ pageParam }) => {
      if (!storeId) {
        return { data: [] as SparePart[], total: 0 };
      }
      return getSpareParts({
        storeId,
        keyword: search || undefined,
        category: category.trim() || undefined,
        lowStockOnly: lowOnly,
        page: pageParam as number,
        pageSize: PAGE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const total = all[0]?.total ?? last.total;
      const loaded = all.reduce((acc, p) => acc + p.data.length, 0);
      if (loaded < total) {
        return all.length + 1;
      }
      return undefined;
    },
    enabled: !!storeId,
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const onEnd = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  const renderItem = useCallback(
    ({ item }: { item: SparePart }) => {
      const isLow = item.stockQty <= item.warningQty;
      return (
        <Pressable
          onPress={() =>
            router.push({ pathname: '/spare-parts/inbound', params: { id: item.id, name: item.name } } as never)
          }
        >
          <Card style={styles.card} mode="outlined">
            <Card.Content>
            <View style={styles.row}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {item.name}
              </Text>
              {isLow && (
                <Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: '700' }}>低库存</Text>
              )}
            </View>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }} numberOfLines={1}>
              {[item.brand, item.model, item.sku].filter(Boolean).join(' · ')}
            </Text>
            <View style={styles.row}>
              <Text style={{ color: theme.colors.primary, fontSize: 12 }}>{item.category}</Text>
              <Text style={{ color: theme.colors.onSurface }}>
                库存 {item.stockQty} {item.unit}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>均价</Text>
              <AmountText value={item.avgCost} />
            </View>
            </Card.Content>
          </Card>
        </Pressable>
      );
    },
    [router, theme],
  );

  if (!storeId) return <LoadingScreen message="需要门店" />;
  if (query.isLoading) return <LoadingScreen />;
  if (query.isError) return <QueryError onRetry={() => query.refetch()} />;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      <SearchBar onSearch={setSearch} placeholder="名称/品牌/型号/SKU" />
      <View style={styles.filter}>
        <TextInput
          placeholder="分类(可选)"
          value={category}
          onChangeText={setCategory}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[
            styles.cat,
            { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface },
          ]}
        />
        <View style={styles.switchRow}>
          <Text style={{ color: theme.colors.onSurface, marginRight: 6 }}>仅看低库存</Text>
          <Switch value={lowOnly} onValueChange={setLowOnly} />
        </View>
      </View>
      {items.length === 0 ? (
        <EmptyState icon="cog" title="暂无配件" />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          estimatedItemSize={110}
          onEndReached={onEnd}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />}
          contentContainerStyle={styles.list}
        />
      )}
      <FAB icon="package-variant" style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => router.push('/spare-parts/inbound' as never)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filter: { paddingHorizontal: 12, marginBottom: 4, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  cat: { flex: 1, minWidth: 120, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  list: { paddingBottom: 100 },
  card: { marginHorizontal: 10, marginVertical: 4 },
  title: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
