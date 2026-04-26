import React, { useState, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, LayoutAnimation, Platform, UIManager, Pressable } from 'react-native';
import { Text, useTheme, Card, FAB, List, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '../../components/ui/TypedFlashList';
import { getHandoverList } from '../../services/handover-service';
import type { HandoverItem } from '../../types/handover';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { formatDate } from '../../lib/utils';
import { AmountText } from '../../components/finance/AmountText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HandoverListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organizationId, storeId } = useAuth();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['handovers', organizationId, storeId],
    queryFn: () => getHandoverList({ organizationId: organizationId ?? '', storeId: storeId ?? '' }),
    enabled: !!organizationId && !!storeId,
  });

  const items = data?.items ?? [];

  const toggle = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((p) => (p === id ? null : id));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: HandoverItem }) => {
      const open = openId === item.id;
      return (
        <Card style={styles.card} mode="outlined">
          <Pressable onPress={() => toggle(item.id)}>
            <Card.Content>
            <View style={styles.row}>
              <View>
                <Text style={{ color: theme.colors.onSurface, fontSize: 16, fontWeight: '600' }}>
                  {formatDate(item.handoverAt, 'YYYY-MM-DD HH:mm')}
                </Text>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                  {item.fromUserId} → {item.toUserId}
                </Text>
              </View>
              <Chip
                style={{
                  backgroundColor:
                    item.status === 'PENDING' ? (theme.colors.tertiaryContainer ?? theme.colors.surfaceVariant) : theme.colors.primaryContainer,
                }}
              >
                {item.status}
              </Chip>
            </View>
            {open && (
              <View style={{ marginTop: 8 }}>
                <List.Item
                  title="待处理订单"
                  titleStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
                  description={String(item.pendingOrders?.count ?? 0)}
                  descriptionStyle={{ color: theme.colors.onSurface }}
                />
                <List.Item
                  title="待取机"
                  titleStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
                  description={String(item.pendingPickups?.count ?? 0)}
                />
                <List.Item
                  title="待发货"
                  titleStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
                  description={String(item.pendingShipments?.count ?? 0)}
                />
                {item.cashHandover != null && (
                  <List.Item
                    title="现金交接"
                    titleStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
                    right={() => <AmountText value={item.cashHandover} />}
                  />
                )}
                <List.Item
                  title="钥匙 / 保险柜"
                  titleStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
                  description={item.keyHandover ? '钥匙 是' : '钥匙 否'}
                  left={() => <List.Icon icon="key" color={theme.colors.onSurface} />}
                />
                <List.Item
                  title=""
                  description={item.safeHandover ? '保险柜 是' : '保险柜 否'}
                  left={() => <List.Icon icon="lock" color={theme.colors.onSurface} />}
                />
                {item.specialNotes ? <Text style={{ color: theme.colors.onSurface, marginTop: 4 }}>备注: {item.specialNotes}</Text> : null}
              </View>
            )}
            </Card.Content>
          </Pressable>
        </Card>
      );
    },
    [openId, theme, toggle],
  );

  if (!organizationId || !storeId) return <LoadingScreen />;
  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      {items.length === 0 ? (
        <EmptyState icon="clipboard-check" title="暂无交接班记录" />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          estimatedItemSize={120}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={styles.list}
        />
      )}
      <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => router.push('/handover/new' as never)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: 8, paddingBottom: 100 },
  card: { marginHorizontal: 8, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
