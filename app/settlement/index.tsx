import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Divider, Button } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../../services/stats-service';
import { printerService } from '../../services/printer-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { AmountText } from '../../components/finance/AmountText';
import { formatDate } from '../../lib/utils';
import { COMPANY_NAME } from '../../lib/constants';

export default function SettlementScreen() {
  const { storeId, organizationId, storeName } = useAuth();

  const { data: report, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['settlement', storeId],
    queryFn: () =>
      getDailyReport({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
      }),
    enabled: !!storeId,
  });

  const handlePrint = async () => {
    try {
      await printerService.printDailySettlement({
        storeName: storeName ?? '',
        date: formatDate(new Date().toISOString()),
        totalSales: report?.totalSales ?? '0',
        totalPurchases: report?.totalPurchases ?? '0',
        deviceCount: report?.totalDevicesIn ?? 0,
        repairCount: report?.totalRepairs ?? 0,
      });
    } catch {
      // Print failure handled by printer service
    }
  };

  if (isLoading) return <LoadingScreen />;

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
              <AmountText value={report?.totalSales ?? 0} style={styles.metricValue} colorize />
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>采购额</Text>
              <AmountText value={report?.totalPurchases ?? 0} style={styles.metricValue} />
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>入库</Text>
              <Text style={styles.countValue}>{report?.totalDevicesIn ?? 0} 台</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>出库</Text>
              <Text style={styles.countValue}>{report?.totalDevicesOut ?? 0} 台</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>维修</Text>
              <Text style={styles.countValue}>{report?.totalRepairs ?? 0} 单</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>利润</Text>
              <AmountText value={report?.profit ?? 0} style={styles.metricValue} colorize showSign />
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
