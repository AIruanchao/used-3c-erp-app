import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Divider, Button } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../../services/stats-service';
import { printerService } from '../../services/printer-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { formatDate } from '../../lib/utils';
import { COMPANY_NAME } from '../../lib/constants';

function formatMoney(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '¥0.00';
  return `¥${num.toFixed(2)}`;
}

export default function SettlementScreen() {
  const { storeId, organizationId, storeName } = useAuth();

  const { data: report, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['settlement', storeId, organizationId],
    queryFn: () =>
      getDailyReport({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
      }),
    enabled: !!storeId && !!organizationId,
  });

  const handlePrint = async () => {
    try {
      await printerService.printDailySettlement({
        storeName: storeName ?? '',
        date: formatDate(new Date().toISOString()),
        totalSales: formatMoney(report?.sales.amount ?? 0),
        totalPurchases: formatMoney(report?.purchase.cost ?? 0),
        deviceCount: report?.purchase.count ?? 0,
        repairCount: report?.sales.count ?? 0,
      });
    } catch {
      // Print failure handled by printer service
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  const today = formatDate(new Date().toISOString());

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Card style={styles.card} mode="elevated">
        <Card.Title title={`日结单 - ${today}`} titleStyle={styles.cardTitle} />
        <Card.Content>
          <Text style={styles.storeName}>{storeName ?? '未选择门店'}</Text>
          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>销售额</Text>
              <Text style={[styles.metricValue, { color: '#2e7d32' }]}>
                {formatMoney(report?.sales.amount ?? 0)}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>采购额</Text>
              <Text style={styles.metricValue}>
                {formatMoney(report?.purchase.cost ?? 0)}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>入库</Text>
              <Text style={styles.countValue}>{report?.purchase.count ?? 0} 台</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>出库</Text>
              <Text style={styles.countValue}>{report?.sales.count ?? 0} 台</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>净现金流</Text>
              <Text style={[styles.metricValue, { color: (report?.netCashFlow ?? 0) >= 0 ? '#2e7d32' : '#e53935' }]}>
                {formatMoney(report?.netCashFlow ?? 0)}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>库存预警</Text>
              <Text style={styles.countValue}>{report?.stockAgeWarning ?? 0}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Button mode="contained" icon="printer" onPress={handlePrint} style={styles.printBtn}>
        打印日结单
      </Button>

      <Text style={styles.footer}>{COMPANY_NAME}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  card: { margin: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  storeName: { fontSize: 14, color: '#757575', marginBottom: 8 },
  divider: { marginVertical: 8 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  metric: { alignItems: 'center', flex: 1 },
  metricLabel: { fontSize: 13, color: '#9e9e9e', marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: 'bold' },
  countValue: { fontSize: 18, fontWeight: '600', color: '#424242' },
  printBtn: { marginHorizontal: 16, marginBottom: 16 },
  footer: { textAlign: 'center', fontSize: 12, color: '#bdbdbd', marginBottom: 24 },
});
