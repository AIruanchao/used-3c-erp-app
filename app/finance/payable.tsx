import React from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getPayables } from '../../services/finance-service';
import { AmountText } from '../../components/finance/AmountText';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { PAYMENT_STATUS_LABELS } from '../../lib/constants';
import { formatDate } from '../../lib/utils';

export default function PayableScreen() {
  const { storeId, organizationId } = useAuth();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['payables', storeId],
    queryFn: () =>
      getPayables({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
      }),
    enabled: !!storeId,
  });

  if (isLoading) return <LoadingScreen />;

  const items = data?.items ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      {items.length === 0 ? (
        <EmptyState icon="cash-minus" title="暂无应付账款" />
      ) : (
        items.map((item) => (
          <Card key={item.id} style={styles.card} mode="outlined">
            <Card.Content>
              <View style={styles.row}>
                <Text style={styles.name}>
                  {item.Supplier?.name ?? '未知供应商'}
                </Text>
                <Text style={styles.status}>
                  {PAYMENT_STATUS_LABELS[item.paymentStatus] ?? item.paymentStatus}
                </Text>
              </View>
              <View style={styles.amountRow}>
                <View>
                  <Text style={styles.label}>总金额</Text>
                  <AmountText value={item.totalAmount} />
                </View>
                <View>
                  <Text style={styles.label}>已付</Text>
                  <AmountText value={item.paidAmount} colorize />
                </View>
              </View>
              {item.dueDate && (
                <Text style={styles.dueDate}>
                  到期日: {formatDate(item.dueDate)}
                </Text>
              )}
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  list: { paddingBottom: 16 },
  card: { marginHorizontal: 16, marginVertical: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { fontSize: 15, fontWeight: '600', color: '#212121' },
  status: { fontSize: 12, color: '#757575' },
  amountRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 8,
  },
  label: { fontSize: 12, color: '#9e9e9e', marginBottom: 2 },
  dueDate: { fontSize: 12, color: '#bdbdbd', marginTop: 4 },
});
