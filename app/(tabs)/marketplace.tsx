import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Text, SegmentedButtons, Button, useTheme } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '../../components/ui/TypedFlashList';
import { SearchBar } from '../../components/common/SearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { useAuth } from '../../hooks/useAuth';
import { searchMarketplace, getMyListings, batchListDevices } from '../../services/marketplace-service';
import { yuan } from '../../lib/utils';
import { BRAND_COLOR } from '../../lib/theme';

export default function MarketplaceTabScreen() {
  const theme = useTheme();
  const qc = useQueryClient();
  const { organizationId, storeId } = useAuth();
  const [tab, setTab] = useState<'find' | 'sell'>('find');
  const [q, setQ] = useState('');

  const findQ = useQuery({
    queryKey: ['marketplaceFind', organizationId, storeId, q],
    queryFn: () =>
      searchMarketplace({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
        keyword: q.trim() || undefined,
      }),
    enabled: !!organizationId && !!storeId && tab === 'find',
  });

  const mineQ = useQuery({
    queryKey: ['marketplaceMine', organizationId, storeId],
    queryFn: () =>
      getMyListings({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
      }),
    enabled: !!organizationId && !!storeId && tab === 'sell',
  });

  const delist = useCallback(
    async (id: string) => {
      if (!storeId) return;
      try {
        await batchListDevices({ storeId, ids: [id], action: 'DELIST' });
        await qc.invalidateQueries({ queryKey: ['marketplaceMine'] });
        Alert.alert('已下架', '');
      } catch (e) {
        Alert.alert('下架失败', e instanceof Error ? e.message : '仅总部或无权操作时可失败');
      }
    },
    [qc, storeId],
  );

  if (!organizationId || !storeId) return <LoadingScreen />;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.hero, { backgroundColor: BRAND_COLOR }]}>
        <Text style={styles.heroTitle}>同行市集</Text>
        <Text style={styles.heroSub}>找货 · 我的上架</Text>
      </View>

      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as 'find' | 'sell')}
        buttons={[
          { value: 'find', label: '找货' },
          { value: 'sell', label: '卖货' },
        ]}
        style={styles.seg}
      />

      {tab === 'find' ? (
        <View style={{ flex: 1 }}>
          <SearchBar placeholder="SN / 关键词" onSearch={(s) => setQ(s)} debounceMs={400} />
          {findQ.isLoading ? (
            <LoadingScreen />
          ) : findQ.isError ? (
            <QueryError onRetry={() => findQ.refetch()} />
          ) : (
            <FlashList
              data={findQ.data?.items ?? []}
              estimatedItemSize={96}
              keyExtractor={(it) => it.id}
              refreshControl={<RefreshControl refreshing={findQ.isRefetching} onRefresh={() => findQ.refetch()} />}
              ListEmptyComponent={<EmptyState icon="store" title="暂无上架设备" />}
              renderItem={({ item }) => (
                <View style={[styles.card, { borderColor: theme.colors.outline }]}>
                  <Text style={{ fontWeight: '700' }}>{item.modelName}</Text>
                  <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    {item.storeName} · SN {item.sn}
                  </Text>
                  <Text style={{ marginTop: 6 }}>参考 {item.referencePrice != null ? yuan(item.referencePrice) : '—'}</Text>
                  <Button mode="outlined" compact style={{ marginTop: 8 }} onPress={() => Alert.alert('联系卖家', '功能开发中')}>
                    联系卖家
                  </Button>
                </View>
              )}
            />
          )}
        </View>
      ) : null}

      {tab === 'sell' ? (
        mineQ.isLoading ? (
          <LoadingScreen />
        ) : mineQ.isError ? (
          <QueryError onRetry={() => mineQ.refetch()} />
        ) : (
          <View style={{ flex: 1 }}>
            <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
              上架请从库存列表批量操作；此处仅管理已上架。
            </Text>
            <FlashList
              data={mineQ.data?.items ?? []}
              estimatedItemSize={88}
              keyExtractor={(it) => it.id}
              refreshControl={<RefreshControl refreshing={mineQ.isRefetching} onRefresh={() => mineQ.refetch()} />}
              ListEmptyComponent={<EmptyState icon="store-off" title="暂无已上架设备" />}
              renderItem={({ item }) => (
                <View style={[styles.card, { borderColor: theme.colors.outline }]}>
                  <Text style={{ fontWeight: '700' }}>{item.modelName}</Text>
                  <Text style={{ marginTop: 4 }}>SN {item.sn}</Text>
                  <Text style={{ marginTop: 4 }}>{item.referencePrice != null ? yuan(item.referencePrice) : '—'}</Text>
                  <Button mode="text" textColor={theme.colors.error} onPress={() => delist(item.id)}>
                    下架
                  </Button>
                </View>
              )}
            />
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroSub: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  seg: { marginHorizontal: 12, marginVertical: 8 },
  hint: { marginHorizontal: 16, marginBottom: 8 },
  card: {
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
