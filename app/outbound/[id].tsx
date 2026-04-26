import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Divider, List, useTheme, Text, Appbar } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getOutboundPrintDetail } from '../../services/outbound-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { AmountText } from '../../components/finance/AmountText';
import { formatDate } from '../../lib/utils';
import { getPaymentMethodLabel } from '../../lib/payment-method-labels';
import { useOrgPaymentLabelMap } from '../../hooks/useOrgPaymentLabelMap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OutboundDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organizationId } = useAuth();
  const labelByCode = useOrgPaymentLabelMap(organizationId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['outboundPrint', id, organizationId],
    queryFn: () => getOutboundPrintDetail(id),
    enabled: !!id,
  });

  if (isLoading) return <LoadingScreen />;
  if (isError || !data) {
    return <QueryError message="加载出库单失败" onRetry={() => refetch()} />;
  }

  const channelText =
    data.channel === 'DIRECT' || !data.channel
      ? '零售直营'
      : data.channel.startsWith('PEER')
        ? `同行:${data.channel.replace('PEER', '') || ''}`
        : data.channel;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="出库单详情" titleStyle={{ color: theme.colors.onSurface }} />
        </Appbar.Header>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text style={[styles.h1, { color: theme.colors.onSurface }]}>订单 {data.orderNo}</Text>
              <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
                {formatDate(data.date, 'YYYY-MM-DD HH:mm')}
                {data.storeName ? ` · ${data.storeName}` : ''}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card} mode="outlined">
            <Card.Title title="客户" titleStyle={{ color: theme.colors.onSurface }} />
            <Card.Content>
              <List.Item
                title="姓名"
                titleStyle={{ color: theme.colors.onSurfaceVariant }}
                description={data.customer}
                descriptionStyle={{ color: theme.colors.onSurface }}
              />
              <List.Item
                title="手机"
                titleStyle={{ color: theme.colors.onSurfaceVariant }}
                description={data.phone}
                descriptionStyle={{ color: theme.colors.onSurface }}
              />
              <List.Item
                title="渠道"
                titleStyle={{ color: theme.colors.onSurfaceVariant }}
                description={channelText}
                descriptionStyle={{ color: theme.colors.onSurface }}
              />
            </Card.Content>
          </Card>

          {(data.discountRate != null || data.writeOffAmount != null || data.discountNote) && (
            <Card style={styles.card} mode="outlined">
              <Card.Title title="优惠" titleStyle={{ color: theme.colors.onSurface }} />
              <Card.Content>
                {data.discountRate != null && (
                  <List.Item
                    title="折扣率"
                    titleStyle={{ color: theme.colors.onSurfaceVariant }}
                    description={`${(Number(data.discountRate) * 100).toFixed(0)}%`}
                    descriptionStyle={{ color: theme.colors.onSurface }}
                  />
                )}
                {data.writeOffAmount != null && (
                  <List.Item
                    title="减免金额"
                    titleStyle={{ color: theme.colors.onSurfaceVariant }}
                    right={() => <AmountText value={data.writeOffAmount} />}
                  />
                )}
                {data.discountNote && (
                  <List.Item
                    title="备注"
                    titleStyle={{ color: theme.colors.onSurfaceVariant }}
                    description={data.discountNote}
                    descriptionNumberOfLines={4}
                    descriptionStyle={{ color: theme.colors.onSurface }}
                  />
                )}
              </Card.Content>
            </Card>
          )}

          <Card style={styles.card} mode="outlined">
            <Card.Title title="设备明细" titleStyle={{ color: theme.colors.onSurface }} />
            <Card.Content>
              {data.lines.map((line) => (
                <View key={`${line.index}-${line.sn}`}>
                  <List.Item
                    title={`#${line.index} ${line.sn}`}
                    titleStyle={{ color: theme.colors.onSurface }}
                    titleNumberOfLines={2}
                    right={() => <AmountText value={line.salePrice} />}
                    description={line.lineType}
                    descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                    descriptionNumberOfLines={1}
                  />
                  <Divider />
                </View>
              ))}
            </Card.Content>
          </Card>

          {data.giftLines && data.giftLines.length > 0 && (
            <Card style={styles.card} mode="outlined">
              <Card.Title title="赠品" titleStyle={{ color: theme.colors.onSurface }} />
              <Card.Content>
                {data.giftLines.map((g, i) => (
                  <List.Item
                    key={`g-${i}`}
                    title={g.name}
                    description={`×${g.qty}`}
                    titleStyle={{ color: theme.colors.onSurface }}
                    descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                  />
                ))}
              </Card.Content>
            </Card>
          )}

          <Card style={styles.card} mode="outlined">
            <Card.Title title="金额" titleStyle={{ color: theme.colors.onSurface }} />
            <Card.Content>
              <View style={styles.sumRow}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>原价</Text>
                <AmountText value={data.rawTotal} />
              </View>
              <View style={styles.sumRow}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>折后</Text>
                <AmountText value={data.finalTotal} />
              </View>
              <View style={styles.sumRow}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>已付</Text>
                <AmountText value={data.totalPaid} />
              </View>
              <View style={styles.sumRow}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>待收</Text>
                <AmountText value={data.remainAmount} colorize />
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card} mode="outlined">
            <Card.Title title="支付方式" titleStyle={{ color: theme.colors.onSurface }} />
            <Card.Content>
              {data.payments.map((p, i) => (
                <View key={`p-${i}`} style={styles.sumRow}>
                  <Text style={{ color: theme.colors.onSurface }}>
                    {p.methodLabel ?? getPaymentMethodLabel(p.method, p.note, labelByCode)}
                  </Text>
                  <AmountText value={p.amount} />
                </View>
              ))}
            </Card.Content>
          </Card>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  card: { marginHorizontal: 12, marginTop: 8 },
  h1: { fontSize: 20, fontWeight: '700' },
  meta: { marginTop: 4, fontSize: 13 },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
});
