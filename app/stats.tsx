import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '../services/stats-service';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { AmountText } from '../components/finance/AmountText';
import { formatDate } from '../lib/utils';
import { COMPANY_NAME } from '../lib/constants';

export default function StatsScreen() {
  const { storeId, organizationId } = useAuth();

  const { data: report, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['stats', storeId],
    queryFn: () =>
      getDailyReport({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
      }),
    enabled: !!storeId,
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <Card style={styles.card} mode="elevated">
        <Card.Title
          title={`日报 - ${formatDate(new Date().toISOString())}`}
          titleStyle={styles.cardTitle}
        />
        <Card.Content>
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>销售额</Text>
              <AmountText
                value={report?.totalSales ?? 0}
                style={styles.metricValue}
                colorize
              />
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>采购额</Text>
              <AmountText
                value={report?.totalPurchases ?? 0}
                style={styles.metricValue}
              />
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>入库</Text>
              <Text style={styles.countValue}>
                {report?.totalDevicesIn ?? 0} 台
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>出库</Text>
              <Text style={styles.countValue}>
                {report?.totalDevicesOut ?? 0} 台
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>维修</Text>
              <Text style={styles.countValue}>
                {report?.totalRepairs ?? 0} 单
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>利润</Text>
              <AmountText
                value={report?.profit ?? 0}
                style={styles.metricValue}
                colorize
                showSign
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      <Text style={styles.footer}>{COMPANY_NAME}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  card: { margin: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  metric: { alignItems: 'center', flex: 1 },
  metricLabel: { fontSize: 13, color: '#9e9e9e', marginBottom: 6 },
  metricValue: { fontSize: 20, fontWeight: 'bold' },
  countValue: { fontSize: 18, fontWeight: '600', color: '#424242' },
  divider: { marginVertical: 4 },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#bdbdbd',
    marginBottom: 24,
  },
});
