import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { SegmentedButtons, Text, useTheme, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '../../components/ui/TypedFlashList';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useAuth } from '../../hooks/useAuth';
import { getAuditLogs, getAlertLogs, getCustomerNotifications, markAlertsRead } from '../../services/notification-bar-service';
import { formatDate } from '../../lib/utils';

/** 任务卡：前端维护 action → 中文（与 labelAuditAction 关键项对齐） */
const ACTION_LABELS: Record<string, string> = {
  INBOUND: '入库',
  SALE: '销售',
  SALE_BATCH: '批量销售',
  TRADE_ORDER_COMPLETE: '换机过账完成',
  TRADE_ORDER_RECYCLE_COMPLETE: '回收过账',
  SHIPMENT_CREATE: '创建发货单',
  HQ_LIST: '总部点上架',
  PURCHASE_ORDER_CREATE: '新建采购单',
  GOODS_INBOUND_CREATE: '新建数量入库单',
  GOODS_INBOUND_POST: '数量入库过账',
  SUPPLIER_CREATE: '新增供货商',
  PURCHASE_RETURN_CREATE: '新建采购退货单',
  REPAIR_PAYMENT: '维修收款',
  REPAIR_CALLBACK: '回访',
  REPAIR_CLOSE: '完工',
  REPAIR_CANCEL: '取消维修',
};

export default function NotificationScreen() {
  const theme = useTheme();
  const { organizationId } = useAuth();
  const [tab, setTab] = useState<'audit' | 'alert' | 'biz'>('audit');

  const auditQ = useQuery({
    queryKey: ['auditLogs', organizationId],
    queryFn: () =>
      getAuditLogs({
        organizationId: organizationId ?? '',
        limit: 80,
      }),
    enabled: !!organizationId && tab === 'audit',
  });

  const alertQ = useQuery({
    queryKey: ['alertLogs', organizationId],
    queryFn: () =>
      getAlertLogs({
        organizationId: organizationId ?? '',
      }),
    enabled: !!organizationId && tab === 'alert',
  });

  const bizQ = useQuery({
    queryKey: ['custNotifications', organizationId],
    queryFn: () =>
      getCustomerNotifications({
        organizationId: organizationId ?? '',
        limit: 50,
      }),
    enabled: !!organizationId && tab === 'biz',
  });

  const onRefresh = useCallback(async () => {
    if (tab === 'audit') await auditQ.refetch();
    if (tab === 'alert') await alertQ.refetch();
    if (tab === 'biz') await bizQ.refetch();
  }, [alertQ, auditQ, bizQ, tab]);

  const markAllAlertsRead = useCallback(async () => {
    if (!organizationId) return;
    const ids = (alertQ.data?.items ?? []).filter((x) => !x.isRead).map((x) => x.id);
    if (ids.length === 0) return;
    await markAlertsRead({ organizationId, ids });
    await alertQ.refetch();
  }, [alertQ, organizationId]);

  const refreshing = auditQ.isRefetching || alertQ.isRefetching || bizQ.isRefetching;

  if (!organizationId) return <LoadingScreen message="请先选择门店" />;

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
          <View style={{ flex: 1 }}>
            {(alertQ.data?.items ?? []).some((x) => !x.isRead) ? (
              <Button mode="text" onPress={() => void markAllAlertsRead()} style={{ alignSelf: 'flex-end', marginRight: 8 }}>
                未读全部标为已读
              </Button>
            ) : null}
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
                    {item.isRead ? '' : ' · 未读'}
                  </Text>
                </View>
              )}
            />
          </View>
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
                <Text style={{ fontSize: 12, marginTop: 4, color: item.isRead ? theme.colors.onSurfaceVariant : theme.colors.primary }}>
                  {formatDate(item.sentAt)}
                  {item.isRead ? ' · 已读' : ' · 未读'}
                </Text>
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
