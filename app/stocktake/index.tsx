import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, RefreshControl } from 'react-native';
import { FlashList } from '../../components/ui/TypedFlashList';
import { Card, Text, Button, FAB, Dialog, Portal, TextInput } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { getStocktakeSessions, createStocktake } from '../../services/inventory-service';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { formatDate } from '../../lib/utils';

interface StocktakeSession {
  id: string;
  description: string | null;
  status: string;
  createdAt: string;
}

type StocktakeParams = { storeId?: string; organizationId?: string };

export default function StocktakeScreen() {
  const { storeId, organizationId } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [description, setDescription] = useState('');

  const params = useMemo<StocktakeParams>(
    () => ({
      storeId: storeId ?? undefined,
      organizationId: organizationId ?? undefined,
    }),
    [storeId, organizationId],
  );

  const { items, isLoading, isRefreshing, isFetchingNextPage, loadMore, refresh } =
    usePaginatedList<StocktakeSession, StocktakeParams>({
      queryKey: ['stocktake', storeId],
      queryFn: getStocktakeSessions,
      params,
      enabled: !!storeId,
    });

  const handleCreate = useCallback(async () => {
    if (!storeId || !organizationId) return;
    try {
      await createStocktake({
        storeId,
        organizationId,
        description: description.trim() || undefined,
      });
      setShowNew(false);
      setDescription('');
      refresh();
      Alert.alert('成功', '盘点会话已创建');
    } catch (err) {
      Alert.alert('创建失败', err instanceof Error ? err.message : '未知错误');
    }
  }, [storeId, organizationId, description, refresh]);

  const renderItem = useCallback(
    ({ item }: { item: StocktakeSession }) => (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.row}>
            <Text style={styles.status}>{item.status}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt, 'MM-DD HH:mm')}</Text>
          </View>
          {item.description && (
            <Text style={styles.desc}>{item.description}</Text>
          )}
        </Card.Content>
      </Card>
    ),
    [],
  );

  const keyExtractor = useCallback((item: StocktakeSession) => item.id, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlashList
        data={items}
        renderItem={renderItem}
        estimatedItemSize={72}
        keyExtractor={keyExtractor}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        ListEmptyComponent={<EmptyState icon="clipboard-check" title="暂无盘点记录" />}
        ListFooterComponent={isFetchingNextPage ? <LoadingScreen message="加载更多..." /> : null}
        contentContainerStyle={styles.listContent}
      />

      <FAB icon="plus" style={styles.fab} onPress={() => setShowNew(true)} />

      <Portal>
        <Dialog visible={showNew} onDismiss={() => setShowNew(false)}>
          <Dialog.Title>新建盘点</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="描述(可选)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowNew(false)}>取消</Button>
            <Button onPress={handleCreate}>创建</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  listContent: { paddingBottom: 80 },
  card: { marginHorizontal: 16, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { fontSize: 14, fontWeight: '600', color: '#1976d2' },
  date: { fontSize: 12, color: '#bdbdbd' },
  desc: { fontSize: 13, color: '#757575', marginTop: 4 },
  fab: { position: 'absolute', bottom: 16, right: 16 },
});
