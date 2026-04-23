import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, List, Divider, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../../services/stats-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';

function formatMoney(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '¥0.00';
  const fixed = num.toFixed(2);
  const parts = fixed.split('.');
  const intPart = parts[0] ?? '0';
  const decPart = parts[1] ?? '00';
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `¥${withCommas}.${decPart}`;
}

export default function FinanceIndexScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();

  const { data: report, isLoading } = useQuery({
    queryKey: ['financeSummary', storeId, organizationId],
    queryFn: () =>
      getDailyReport({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
      }),
    enabled: !!storeId && !!organizationId,
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Card style={styles.card} mode="elevated">
        <Card.Title title="今日财务" titleStyle={styles.cardTitle} />
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.amountLarge, { color: '#2e7d32' }]}>
                {formatMoney(report?.sales.amount ?? 0)}
              </Text>
              <Text style={styles.summaryLabel}>销售额 ({report?.sales.count ?? 0}台)</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.amountLarge}>
                {formatMoney(report?.purchase.cost ?? 0)}
              </Text>
              <Text style={styles.summaryLabel}>采购额 ({report?.purchase.count ?? 0}台)</Text>
            </View>
          </View>
          <Divider />
          <View style={styles.profitRow}>
            <List.Item
              title="净现金流"
              description={
                <Text style={{ color: (report?.netCashFlow ?? 0) >= 0 ? '#2e7d32' : '#e53935', fontWeight: '600' }}>
                  {formatMoney(report?.netCashFlow ?? 0)}
                </Text>
              }
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <List.Item
          title="记账明细"
          description="查看所有收支记录"
          left={(props) => <List.Icon {...props} icon="receipt" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/finance/ledger' as never)}
        />
        <Divider />
        <List.Item
          title="应付账款"
          description={report?.payableDue ? `${report.payableDue}笔待付` : undefined}
          left={(props) => <List.Icon {...props} icon="cash-minus" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/finance/payable' as never)}
        />
        <Divider />
        <List.Item
          title="应收账款"
          description={report?.receivableDue ? `${report.receivableDue}笔待收` : undefined}
          left={(props) => <List.Icon {...props} icon="cash-plus" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/finance/receivable' as never)}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  profitRow: {
    marginTop: 8,
  },
});
