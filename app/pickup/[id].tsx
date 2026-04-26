import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, useTheme, Card, Button, Appbar, Portal, Dialog, TextInput, HelperText } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getPickupOrders, updatePickupStatus } from '../../services/pickup-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { formatDate, decStr } from '../../lib/utils';
import { AmountText } from '../../components/finance/AmountText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PickupOrder, PickupStatus } from '../../types/pickup';

function nextStatus(s: PickupStatus): PickupStatus | null {
  if (s === 'SCHEDULED') return 'EN_ROUTE';
  if (s === 'EN_ROUTE') return 'ARRIVED';
  if (s === 'ARRIVED') return 'COMPLETED';
  return null;
}

export default function PickupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organizationId, storeId } = useAuth();
  const qc = useQueryClient();

  const [valOpen, setValOpen] = useState(false);
  const [actualValue, setActualValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [actErr, setActErr] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['pickupOrders', organizationId, storeId, 'all'],
    queryFn: () =>
      getPickupOrders({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
      }),
    enabled: !!id && !!organizationId && !!storeId,
  });

  const order = useMemo(
    () => (data?.items ?? []).find((i) => i.id === id),
    [data?.items, id],
  );

  const runPatch = useCallback(
    async (status: string, extra?: { actualValue?: string | number; note?: string }) => {
      if (!organizationId || !storeId) return;
      setSaving(true);
      setActErr(null);
      try {
        await updatePickupStatus(id, { organizationId, storeId, status, ...extra });
        await qc.invalidateQueries({ queryKey: ['pickupOrders'] });
        setValOpen(false);
        setActualValue('');
        await refetch();
      } catch (e) {
        setActErr(e instanceof Error ? e.message : '操作失败');
      } finally {
        setSaving(false);
      }
    },
    [id, organizationId, qc, refetch, storeId],
  );

  const onComplete = useCallback(() => {
    const n = actualValue.trim() ? Number(actualValue) : 0;
    if (n < 0 || n > 99999999) {
      setActErr('实收价值范围 0～99999999');
      return;
    }
    void runPatch('COMPLETED', { actualValue: decStr(n) });
  }, [actualValue, runPatch]);

  const confirmCancel = useCallback(() => {
    Alert.alert('取消取机', '确定要取消此单？', [
      { text: '不', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => void runPatch('CANCELLED') },
    ]);
  }, [runPatch]);

  if (!organizationId || !storeId) return <LoadingScreen message="缺少门店" />;
  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (!order) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>取机单不存在</Text>
        <Button onPress={() => router.back()}>返回</Button>
      </View>
    );
  }

  const ns = nextStatus(order.status);
  const canCancel = order.status !== 'COMPLETED' && order.status !== 'CANCELLED';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="取机单" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text style={[styles.h1, { color: theme.colors.onSurface }]}>状态: {order.status}</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {order.customerName} {order.customerPhone ?? ''}
            </Text>
            <Text style={{ color: theme.colors.onSurface, marginTop: 8 }}>{order.pickupAddress}</Text>
            <Text style={{ color: theme.colors.outline, marginTop: 6 }}>
              预约: {formatDate(order.appointmentTime, 'YYYY-MM-DD HH:mm')}
            </Text>
            <View style={styles.lineRow}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                预估 {order.estimatedDevices ?? '—'} 台 / 价值{' '}
              </Text>
              {order.estimatedValue != null ? <AmountText value={order.estimatedValue} /> : <Text style={{ color: theme.colors.onSurfaceVariant }}>—</Text>}
            </View>
            <View style={styles.lineRow}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>实收 {order.actualDevices} 台 / 价值 </Text>
              <AmountText value={order.actualValue} />
            </View>
            {order.note ? <Text style={{ color: theme.colors.onSurface, marginTop: 8 }}>备注: {order.note}</Text> : null}
            <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 6 }}>
              更新 {formatDate(order.updatedAt, 'YYYY-MM-DD HH:mm')}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          {order.status === 'SCHEDULED' && (
            <Button mode="contained" onPress={() => void runPatch('EN_ROUTE')}>
              出发取机
            </Button>
          )}
          {order.status === 'EN_ROUTE' && (
            <Button mode="contained" onPress={() => void runPatch('ARRIVED')}>
              已到达
            </Button>
          )}
          {order.status === 'ARRIVED' && (
            <Button mode="contained" onPress={() => setValOpen(true)}>
              完成取机
            </Button>
          )}
          {canCancel && <Button textColor={theme.colors.error} mode="outlined" onPress={confirmCancel}>
            取消
          </Button>}
        </View>
      </ScrollView>
      <Portal>
        <Dialog visible={valOpen} onDismiss={() => setValOpen(false)}>
          <Dialog.Title>实际价值</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="实收价值"
              value={actualValue}
              onChangeText={setActualValue}
              keyboardType="decimal-pad"
              mode="outlined"
            />
            {actErr && <HelperText type="error">{actErr}</HelperText>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setValOpen(false)}>取消</Button>
            <Button loading={saving} onPress={onComplete}>
              完成
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  card: { margin: 12 },
  h1: { fontSize: 20, fontWeight: '700' },
  lineRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  actions: { padding: 12, gap: 8 },
});
