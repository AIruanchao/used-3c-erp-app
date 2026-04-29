import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SegmentedButtons, useTheme } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport, getInventorySummary } from '../../services/stats-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { AmountText } from '../../components/finance/AmountText';
import { StatsCard } from '../../components/common/StatsCard';
import { COMPANY_NAME } from '../../lib/constants';
import { centsToFixed2, moneyToCents } from '../../lib/money';

export default function StatsScreen() {
  const theme = useTheme();

  const { storeId, organizationId } = useAuth();
  const [tab, setTab] = useState<'DEVICE' | 'PARTS'>('DEVICE');
  const [range, setRange] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'>('TODAY');

  const dateList = useMemo(() => {
    const today = new Date();
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
    if (range === 'TODAY') return [toDateStr(today)];
    if (range === 'YESTERDAY') {
      const d = new Date(today.getTime() - 86400000);
      return [toDateStr(d)];
    }
    const days = range === 'WEEK' ? 7 : 30;
    const out: string[] = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(today.getTime() - i * 86400000);
      out.push(toDateStr(d));
    }
    return out;
  }, [range]);

  const fetchRange = useCallback(async () => {
    const store = storeId ?? undefined;
    const org = organizationId ?? undefined;
    const reports = await Promise.all(
      dateList.map((d) => getDailyReport({ storeId: store, organizationId: org, date: d })),
    );
    let purchaseCount = 0;
    let salesCount = 0;
    let stockAgeWarning = 0;

    let purchaseCostCents = 0n;
    let salesAmountCents = 0n;
    let netCashFlowCents = 0n;
    let receivableDueCents = 0n;
    let payableDueCents = 0n;

    for (const r of reports) {
      purchaseCount += r.purchase?.count ?? 0;
      salesCount += r.sales?.count ?? 0;
      stockAgeWarning = Math.max(stockAgeWarning, r.stockAgeWarning ?? 0);

      purchaseCostCents += moneyToCents(r.purchase?.cost ?? 0);
      salesAmountCents += moneyToCents(r.sales?.amount ?? 0);
      netCashFlowCents += moneyToCents(r.netCashFlow ?? 0);
      receivableDueCents += moneyToCents(r.receivableDue ?? 0);
      payableDueCents += moneyToCents(r.payableDue ?? 0);
    }

    return {
      purchaseCount,
      purchaseCost: centsToFixed2(purchaseCostCents),
      salesCount,
      salesAmount: centsToFixed2(salesAmountCents),
      netCashFlow: centsToFixed2(netCashFlowCents),
      receivableDue: centsToFixed2(receivableDueCents),
      payableDue: centsToFixed2(payableDueCents),
      stockAgeWarning,
    };
  }, [dateList, storeId, organizationId]);

  const { data: agg, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dailyReportAgg', storeId, organizationId, range],
    queryFn: fetchRange,
    enabled: !!storeId && !!organizationId,
  });

  const inv = useQuery({
    queryKey: ['inventorySummary', storeId, organizationId],
    queryFn: () =>
      getInventorySummary({ storeId: storeId ?? undefined, organizationId: organizationId ?? undefined }),
    enabled: !!storeId && !!organizationId && tab === 'DEVICE',
  });

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topTabs}>
        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as 'DEVICE' | 'PARTS')}
          buttons={[
            { value: 'DEVICE', label: '机器统计' },
            { value: 'PARTS', label: '配件统计' },
          ]}
        />
      </View>

      <View style={styles.rangeTabs}>
        <SegmentedButtons
          value={range}
          onValueChange={(v) => setRange(v as typeof range)}
          buttons={[
            { value: 'TODAY', label: '今日' },
            { value: 'YESTERDAY', label: '昨日' },
            { value: 'WEEK', label: '本周' },
            { value: 'MONTH', label: '本月' },
          ]}
        />
      </View>

      {tab === 'DEVICE' ? (
        <>
          <View style={styles.grid}>
            <StatsCard value={agg?.salesCount ?? 0} label="销售台数" compact />
            <View style={{ flex: 1 }}>
              <View style={styles.cardLike}>
                <Text style={styles.cardLabel}>销售金额</Text>
                <AmountText value={agg?.salesAmount ?? 0} prefix="¥" style={styles.cardValue} />
              </View>
            </View>
          </View>
          <View style={styles.grid}>
            <StatsCard value={agg?.purchaseCount ?? 0} label="入库台数" compact />
            <View style={{ flex: 1 }}>
              <View style={styles.cardLike}>
                <Text style={styles.cardLabel}>入库成本</Text>
                <AmountText value={agg?.purchaseCost ?? 0} prefix="¥" style={styles.cardValue} />
              </View>
            </View>
          </View>
          <View style={styles.grid}>
            <View style={{ flex: 1 }}>
              <View style={styles.cardLike}>
                <Text style={styles.cardLabel}>净现金流</Text>
                <AmountText value={agg?.netCashFlow ?? 0} prefix="¥" style={styles.cardValue} />
              </View>
            </View>
            <StatsCard value={agg?.stockAgeWarning ?? 0} label="库龄预警" compact />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>库存概览</Text>
          </View>
          {inv.isLoading ? (
            <LoadingScreen message="加载库存概览..." />
          ) : inv.isError ? (
            <QueryError message="库存概览加载失败" onRetry={() => inv.refetch()} />
          ) : (
            <>
              <View style={styles.grid}>
                <StatsCard value={inv.data?.inStockCount ?? 0} label="在库数量" compact />
                <View style={{ flex: 1 }}>
                  <View style={styles.cardLike}>
                    <Text style={styles.cardLabel}>在库成本</Text>
                    <AmountText value={inv.data?.inStockCost ?? '0'} prefix="¥" style={styles.cardValue} />
                  </View>
                </View>
              </View>
              <View style={styles.grid}>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardLike}>
                    <Text style={styles.cardLabel}>均台成本</Text>
                    <AmountText value={inv.data?.avgUnitCost ?? '0'} prefix="¥" style={styles.cardValue} />
                  </View>
                </View>
                <StatsCard
                  value={`${inv.data?.ageBuckets.lt15 ?? 0}/${inv.data?.ageBuckets.d15to30 ?? 0}/${inv.data?.ageBuckets.gt30 ?? 0}`}
                  label="库龄(<15/15-30/>30)"
                  compact
                />
              </View>
            </>
          )}
        </>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>配件统计将在后续版本接入。</Text>
        </View>
      )}

      <Text style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}>{COMPANY_NAME}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  topTabs: { paddingHorizontal: 16, paddingTop: 12 },
  rangeTabs: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  grid: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  cardLike: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLabel: { fontSize: 12, color: '#9E9E9E' },
  cardValue: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#212121' },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#bdbdbd',
    marginBottom: 24,
    marginTop: 16,
  },
});
