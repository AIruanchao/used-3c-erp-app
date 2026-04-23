import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, List, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../../services/stats-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { AmountText } from '../../components/finance/AmountText';

export default function FinanceIndexScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();

  const { data: report, isLoading } = useQuery({
    queryKey: ['financeSummary', storeId],
    queryFn: () =>
      getDailyReport({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
      }),
    enabled: !!storeId,
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Card style={styles.card} mode="elevated">
        <Card.Title title="今日财务" titleStyle={styles.cardTitle} />
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <AmountText
                value={report?.totalSales ?? 0}
                style={styles.amountLarge}
                colorize
              />
              <List.Item title="销售额" titleStyle={styles.summaryLabel} />
            </View>
            <View style={styles.summaryItem}>
              <AmountText
                value={report?.totalPurchases ?? 0}
                style={styles.amountLarge}
                colorize
              />
              <List.Item title="采购额" titleStyle={styles.summaryLabel} />
            </View>
          </View>
          <Divider />
          <View style={styles.profitRow}>
            <List.Item
              title="利润"
              description={
                <AmountText
                  value={report?.profit ?? 0}
                  colorize
                  showSign
                />
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
          left={(props) => <List.Icon {...props} icon="cash-minus" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/finance/payable' as never)}
        />
        <Divider />
        <List.Item
          title="应收账款"
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
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  profitRow: {
    marginTop: 8,
  },
});
