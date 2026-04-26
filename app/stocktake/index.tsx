import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, RefreshControl } from 'react-native';
import {  Card, Text, Button, FAB, Dialog, Portal, TextInput, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useAuth } from '../../hooks/useAuth';
import { getStocktakeSessions, createStocktake } from '../../services/inventory-service';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { formatDate } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';

interface StocktakeSession {
  id: string;
  scope: string;
  status: string;
  createdAt: string;
}

export default function StocktakeScreen() {
  const theme = useTheme();

  const { storeId, organizationId } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [scope, setScope] = useState('FULL');
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['stocktake', storeId, organizationId],
    queryFn: () =>
      getStocktakeSessions({
        storeId: storeId ?? '',
        organizationId: organizationId ?? '',
      }),
    enabled: !!storeId && !!organizationId,
  });

  const items: StocktakeSession[] = data?.items ?? [];

  const handleCreate = useCallback(async () => {
    if (!storeId || !organizationId || creating) return;
    setCreating(true);
    try {
      await createStocktake({
        storeId,
        organizationId,
        scope,
      });
      setShowNew(false);
      setScope('FULL');
      refetch();
      Alert.alert('成功', '盘点会话已创建');
    } catch (err) {
      Alert.alert('创建失败', err instanceof Error ? err.message : '未知错误');
    } finally {
      setCreating(false);
    }
  }, [storeId, organizationId, scope, refetch, creating]);

  const renderItem = useCallback(
    ({ item }: { item: StocktakeSession }) => (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.row}>
            <Text style={styles.status}>{item.status}</Text>
            <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>{formatDate(item.createdAt, 'MM-DD HH:mm')}</Text>
          </View>
          <Text style={[styles.scope, { color: theme.colors.onSurfaceVariant }]}>范围: {item.scope}</Text>
        </Card.Content>
      </Card>
    ),
    [],
  );

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {items.length === 0 ? (
        <EmptyState icon="clipboard-check" title="暂无盘点记录" />
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={styles.scrollContent}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => setShowNew(true)} accessibilityLabel="新建盘点" />

      <Portal>
        <Dialog visible={showNew} onDismiss={() => { setShowNew(false); setScope('FULL'); }}>
          <Dialog.Title>新建盘点</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="范围(可选)"
              value={scope}
              onChangeText={setScope}
              mode="outlined"
              editable={!creating}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setShowNew(false); setScope('FULL'); }} accessibilityLabel="取消">取消</Button>
            <Button onPress={handleCreate} loading={creating} disabled={creating} accessibilityLabel="创建">创建</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  scrollContent: { paddingBottom: 80 },
  card: { marginHorizontal: 16, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { fontSize: 14, fontWeight: '600', color: '#1976d2' },
  date: { fontSize: 12, color: '#bdbdbd' },
  scope: { fontSize: 13, color: '#757575', marginTop: 4 },
  fab: { position: 'absolute', bottom: 16, right: 16 },
});
