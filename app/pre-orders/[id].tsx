import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, useTheme, Card, Button, List, Appbar, Portal, Dialog, TextInput, HelperText } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPreOrderDetail, updatePreOrderStatus, postPreOrderCommunication } from '../../services/pre-order-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { AmountText } from '../../components/finance/AmountText';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PreOrderStatus } from '../../types/pre-order';

const NEXT: Partial<Record<PreOrderStatus, PreOrderStatus>> = {
  PENDING: 'SOURCING',
  SOURCING: 'COMMUNICATED',
  COMMUNICATED: 'CONFIRMED',
};

export default function PreOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['preOrder', id],
    queryFn: () => getPreOrderDetail(id),
    enabled: !!id,
  });

  const [comOpen, setComOpen] = useState(false);
  const [comText, setComText] = useState('');
  const [comType, setComType] = useState<'WECHAT' | 'PHONE' | 'INSTORE' | 'OTHER'>('WECHAT');
  const [busy, setBusy] = useState(false);
  const [comErr, setComErr] = useState<string | null>(null);

  const doStatus = useCallback(
    async (status: string) => {
      if (!storeId) return;
      setBusy(true);
      try {
        await updatePreOrderStatus({ preOrderId: id, status, storeId });
        await qc.invalidateQueries({ queryKey: ['preOrder', id] });
        await refetch();
      } catch (e) {
        Alert.alert('失败', e instanceof Error ? e.message : '状态更新失败');
      } finally {
        setBusy(false);
      }
    },
    [id, qc, refetch, storeId],
  );

  const sendCom = useCallback(async () => {
    if (!comText.trim()) {
      setComErr('请填写内容');
      return;
    }
    setComErr(null);
    setBusy(true);
    try {
      await postPreOrderCommunication({ preOrderId: id, content: comText.trim(), type: comType });
      setComOpen(false);
      setComText('');
      await refetch();
    } catch (e) {
      setComErr(e instanceof Error ? e.message : '发送失败');
    } finally {
      setBusy(false);
    }
  }, [comText, comType, id, refetch]);

  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <QueryError onRetry={() => refetch()} />;

  const nxt = data.status && NEXT[data.status];
  const canNext = nxt && storeId;
  const canCancel = data.status !== 'CANCELLED' && data.status !== 'CONFIRMED';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={data.orderNo} titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text style={{ color: theme.colors.onSurface, fontSize: 12 }}>状态: {data.status}</Text>
            <Text style={{ color: theme.colors.onSurface, marginTop: 4 }}>{data.customerName}</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{data.customerPhone ?? ''}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.card} mode="outlined">
          <Card.Title title="商品" titleStyle={{ color: theme.colors.onSurface }} />
          <Card.Content>
            {data.lines.map((line, li) => (
              <List.Item
                key={line.id ?? `line-${li}`}
                title={line.modelName}
                titleStyle={{ color: theme.colors.onSurface }}
                description={
                  [line.color, line.storage, `×${line.quantity}`].filter(Boolean).join(' · ') || '—'
                }
                right={line.unitPrice != null ? () => <AmountText value={line.unitPrice} /> : undefined}
              />
            ))}
          </Card.Content>
        </Card>
        <Card style={styles.card} mode="outlined">
          <Card.Title title="财务" titleStyle={{ color: theme.colors.onSurface }} />
          <Card.Content>
            <List.Item
              title="定金"
              titleStyle={{ color: theme.colors.onSurfaceVariant }}
              right={() => (data.depositAmount != null ? <AmountText value={data.depositAmount} /> : <Text>—</Text>)}
            />
            <List.Item
              title="已付定金"
              titleStyle={{ color: theme.colors.onSurfaceVariant }}
              description={data.depositPaid ? '是' : '否'}
            />
            <List.Item
              title="报价"
              titleStyle={{ color: theme.colors.onSurfaceVariant }}
              right={() => (data.quoteAmount != null ? <AmountText value={data.quoteAmount} /> : <Text>—</Text>)}
            />
            <List.Item
              title="税率"
              titleStyle={{ color: theme.colors.onSurfaceVariant }}
              description={data.taxRate != null ? String(data.taxRate) : '—'}
            />
            {data.note && <Text style={{ color: theme.colors.onSurface, marginTop: 4 }}>备注: {data.note}</Text>}
          </Card.Content>
        </Card>
        {data.communications && data.communications.length > 0 && (
          <Card style={styles.card} mode="outlined">
            <Card.Title title="沟通" titleStyle={{ color: theme.colors.onSurface }} />
            <Card.Content>
              {data.communications.map((c) => (
                <List.Item
                  key={c.id}
                  title={c.content}
                  titleNumberOfLines={4}
                  titleStyle={{ color: theme.colors.onSurface }}
                  description={formatDate(c.createdAt, 'YYYY-MM-DD HH:mm')}
                />
              ))}
            </Card.Content>
          </Card>
        )}
        <View style={styles.actions}>
          {canNext && nxt && (
            <Button mode="contained" disabled={busy} onPress={() => void doStatus(nxt)}>
              推进到 {nxt}
            </Button>
          )}
          {canCancel && (
            <Button
              textColor={theme.colors.error}
              mode="outlined"
              disabled={busy}
              onPress={() => {
                Alert.alert('取消', '确定取消？', [
                  { text: '不', style: 'cancel' },
                  { text: '确定', onPress: () => void doStatus('CANCELLED') },
                ]);
              }}
            >
              取消订单
            </Button>
          )}
          <Button mode="outlined" onPress={() => setComOpen(true)}>
            记录沟通
          </Button>
        </View>
      </ScrollView>
      <Portal>
        <Dialog visible={comOpen} onDismiss={() => setComOpen(false)}>
          <Dialog.Title>沟通记录</Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={comText}
              onChangeText={setComText}
              multiline
              numberOfLines={3}
              mode="outlined"
            />
            {comErr && <HelperText type="error">{comErr}</HelperText>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setComOpen(false)}>关闭</Button>
            <Button loading={busy} onPress={() => void sendCom()}>
              发送
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  card: { margin: 8 },
  actions: { padding: 12, gap: 8 },
});
