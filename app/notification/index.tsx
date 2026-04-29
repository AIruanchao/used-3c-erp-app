import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '../../components/ui/TypedFlashList';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useAuth } from '../../hooks/useAuth';
import { getAuditLogs, getAlertLogs, getCustomerNotifications } from '../../services/notification-bar-service';
import { formatDate } from '../../lib/utils';

const ACTION_LABELS: Record<string, string> = {
  INBOUND: '入库',
  SALE: '销售',
  SALE_BATCH: '批量销售',
  TRADE_ORDER_COMPLETE: '换机过账',
  TRADE_ORDER_RECYCLE_COMPLETE: '回收过账',
  SHIPMENT_CREATE: '发货',
  HQ_LIST: '上架',
};

export default function NotificationScreen() {
  const theme = useTheme();
  const { organizationId, storeId } = useAuth();
  const [tab, setTab] = useState<'audit' | 'alert' | 'biz'>('audit');

  const auditQ = useQuery({
    queryKey: ['auditLogs', organizationId, storeId],
    queryFn: () =>
      getAuditLogs({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
        limit: 80,
      }),
    enabled: !!organizationId && !!storeId && tab === 'audit',
  });

  const alertQ = useQuery({
    queryKey: ['alertLogs', organizationId, storeId],
    queryFn: () =>
      getAlertLogs({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
      }),
    enabled: !!organizationId && !!storeId && tab === 'alert',
  });

  const bizQ = useQuery({
    queryKey: ['custNotifications', organizationId, storeId],
    queryFn: () =>
      getCustomerNotifications({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
        limit: 50,
      }),
    enabled: !!organizationId && !!storeId && tab === 'biz',
  });

  const onRefresh = useCallback(async () => {
    if (tab === 'audit') await auditQ.refetch();
    if (tab === 'alert') await alertQ.refetch();
    if (tab === 'biz') await bizQ.refetch();
  }, [alertQ, auditQ, bizQ, tab]);

  const refreshing = auditQ.isRefetching || alertQ.isRefetching || bizQ.isRefetching;

  if (!organizationId || !storeId) return <LoadingScreen />;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <PageHeader title="通知中心" showBack />
      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as 'audit' | 'alert' | 'biz')}
        buttons={[
          { value: 'audit', label: '操作日志' },
          { value: 'alert', label: '预警' },
          { value: 'biz', label: '业务提醒' },
        ]}
        style={styles.seg}
      />

      {tab === 'audit' ? (
        auditQ.isLoading ? (
          <LoadingScreen />
        ) : auditQ.isError ? (
          <QueryError onRetry={() => auditQ.refetch()} />
        ) : (
          <FlashList
            style={{ flex: 1 }}
            data={auditQ.data?.items ?? []}
            estimatedItemSize={88}
            keyExtractor={(it) => it.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => onRefresh()} />}
            ListEmptyComponent={<EmptyState icon="clipboard-text" title="暂无操作日志" />}
            renderItem={({ item }) => {
              let payloadBrief = '';
              if (item.payload) {
                try {
                  const p = JSON.parse(item.payload) as Record<string, unknown>;
                  payloadBrief = Object.keys(p).slice(0, 4).join(', ');
                } catch {
                  payloadBrief = item.payload.slice(0, 80);
                }
              }
              const label = ACTION_LABELS[item.action] ?? item.action;
              return (
                <View style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }]}>
                  <Text style={{ color: theme.colors.onSurface, fontWeight: '600' }}>{label}</Text>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginTop: 4 }}>
                    {formatDate(item.createdAt)}
                  </Text>
                  {payloadBrief ? (
                    <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }} numberOfLines={2}>
                      {payloadBrief}
                    </Text>
                  ) : null}
                </View>
              );
            }}
          />
        )
      ) : null}

      {tab === 'alert' ? (
        alertQ.isLoading ? (
          <LoadingScreen />
        ) : alertQ.isError ? (
          <QueryError onRetry={() => alertQ.refetch()} />
        ) : (
          <FlashList
            style={{ flex: 1 }}
            data={alertQ.data?.items ?? []}
            estimatedItemSize={72}
            keyExtractor={(it) => it.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => onRefresh()} />}
            ListEmptyComponent={<EmptyState icon="alert" title="暂无预警" />}
            renderItem={({ item }) => (
              <View style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }]}>
                <Text style={{ color: theme.colors.error }}>{item.severity}</Text>
                <Text style={{ marginTop: 4 }}>{item.message}</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginTop: 4 }}>
                  {formatDate(item.triggeredAt)}
                </Text>
              </View>
            )}
          />
        )
      ) : null}

      {tab === 'biz' ? (
        bizQ.isLoading ? (
          <LoadingScreen />
        ) : bizQ.isError ? (
          <QueryError onRetry={() => bizQ.refetch()} />
        ) : (
          <FlashList
            style={{ flex: 1 }}
            data={bizQ.data?.items ?? []}
            estimatedItemSize={80}
            keyExtractor={(it) => it.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => onRefresh()} />}
            ListEmptyComponent={<EmptyState icon="bell" title="暂无业务提醒" />}
            renderItem={({ item }) => (
              <View style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }]}>
                <Text style={{ fontWeight: '600' }}>{item.title}</Text>
                <Text style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>{item.content}</Text>
                <Text style={{ fontSize: 12, marginTop: 4 }}>{formatDate(item.sentAt)}</Text>
              </View>
            )}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  seg: { marginHorizontal: 12, marginBottom: 8 },
  row: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
});
