import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { Text, useTheme, FAB, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '../../components/ui/TypedFlashList';
import { useAuth } from '../../hooks/useAuth';
import { getPickupOrders } from '../../services/pickup-service';
import type { MD3Theme } from 'react-native-paper';
import type { PickupOrder, PickupStatus } from '../../types/pickup';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { formatDate } from '../../lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from 'react-native-paper';

const STATUS_ALL = '' as const;
const STATUSES: { key: typeof STATUS_ALL | PickupStatus; label: string }[] = [
  { key: STATUS_ALL, label: '全部' },
  { key: 'SCHEDULED', label: '待取' },
  { key: 'EN_ROUTE', label: '途中' },
  { key: 'ARRIVED', label: '已到' },
  { key: 'COMPLETED', label: '完成' },
  { key: 'CANCELLED', label: '取消' },
];

function statusColor(theme: MD3Theme, s: PickupStatus): string {
  switch (s) {
    case 'SCHEDULED':
      return theme.colors.primary;
    case 'EN_ROUTE':
      return theme.colors.tertiary ?? '#fb8c00';
    case 'ARRIVED':
      return '#7b1fa2';
    case 'COMPLETED':
      return theme.colors.secondary;
    case 'CANCELLED':
      return theme.colors.outline;
    default:
      return theme.colors.outline;
  }
}

export default function PickupListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organizationId, storeId } = useAuth();
  const [filter, setFilter] = useState<typeof STATUS_ALL | PickupStatus>(STATUS_ALL);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['pickupOrders', organizationId, storeId, filter],
    queryFn: () =>
      getPickupOrders({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
        status: filter || undefined,
      }),
    enabled: !!organizationId && !!storeId,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const renderItem = useCallback(
    ({ item }: { item: PickupOrder }) => (
      <Card style={styles.card} mode="outlined" onPress={() => router.push(`/pickup/${item.id}` as never)}>
        <Card.Content>
          <View style={styles.row}>
            <Text style={[styles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {item.customerName}
            </Text>
            <Chip style={{ backgroundColor: statusColor(theme, item.status) + '33' }} textStyle={{ color: statusColor(theme, item.status) }}>
              {item.status}
            </Chip>
          </View>
          <Text style={[styles.addr, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            {item.pickupAddress}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.outline }]}>
            {formatDate(item.appointmentTime, 'YYYY-MM-DD HH:mm')}
            {item.estimatedDevices != null ? ` · 预估 ${item.estimatedDevices} 台` : ''}
          </Text>
        </Card.Content>
      </Card>
    ),
    [router, theme],
  );

  if (!organizationId || !storeId) return <LoadingScreen message="加载门店…" />;
  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      <View style={styles.tabs}>
        {STATUSES.map((t) => (
          <Chip
            key={t.label}
            selected={filter === t.key}
            onPress={() => setFilter(t.key)}
            style={styles.chip}
            compact
          >
            {t.label}
          </Chip>
        ))}
      </View>
      {items.length === 0 ? (
        <EmptyState icon="truck-delivery" title="暂无取机单" />
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          estimatedItemSize={100}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          contentContainerStyle={styles.list}
        />
      )}
      <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => router.push('/pickup/new' as never)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 6 },
  chip: { marginRight: 4, marginBottom: 4 },
  list: { paddingBottom: 88 },
  card: { marginHorizontal: 12, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '600', flex: 1, marginRight: 8 },
  addr: { marginTop: 6, fontSize: 14 },
  meta: { marginTop: 4, fontSize: 12 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
