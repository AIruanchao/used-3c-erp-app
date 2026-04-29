import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Pressable,
} from 'react-native';
import { Button, Card, Divider, SegmentedButtons, TextInput, useTheme } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getDailyReport } from '../../services/stats-service';
import { getSettlementList, createSettlement } from '../../services/settlement-service';
import { printerService } from '../../services/printer-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { PageHeader } from '../../components/common/PageHeader';
import { StatsCard } from '../../components/common/StatsCard';
import { EmptyState } from '../../components/common/EmptyState';
import { FlashList } from '../../components/ui/TypedFlashList';
import { formatDate, yuan } from '../../lib/utils';
import { AmountText } from '../../components/finance/AmountText';
import { NumericKeypad } from '../../components/common/NumericKeypad';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SectionHeader } from '../../components/common/SectionHeader';
import { COMPANY_NAME } from '../../lib/constants';
import { BRAND_COLOR } from '../../lib/theme';
import { centsToFixed2, moneyToCents } from '../../lib/money';
import type { DailySettlement } from '../../types/settlement';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function SettlementScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { storeId, organizationId, storeName } = useAuth();
  const [tab, setTab] = useState<'report' | 'confirm' | 'history'>('report');
  const [dateStr, setDateStr] = useState(() => isoDate(new Date()));
  const [openingStr, setOpeningStr] = useState('');
  const [closingStr, setClosingStr] = useState('');
  const [note, setNote] = useState('');
  const [printingId, setPrintingId] = useState<string | null>(null);

  const shiftDay = useCallback((delta: number) => {
    const d = new Date(`${dateStr}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setDateStr(isoDate(d));
  }, [dateStr]);

  const { data: report, isLoading: loadingReport, isError: errReport, refetch: refetchReport, isRefetching: refetchingReport } = useQuery({
    queryKey: ['dailyReport', storeId, organizationId, dateStr],
    queryFn: () =>
      getDailyReport({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
        date: dateStr,
      }),
    enabled: !!storeId && !!organizationId,
  });

  const { data: settlementsToday, refetch: refetchToday } = useQuery({
    queryKey: ['settlements', storeId, organizationId, dateStr],
    queryFn: () =>
      getSettlementList({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
        date: dateStr,
      }),
    enabled: !!storeId && !!organizationId,
  });

  const {
    data: settlementsHistory,
    refetch: refetchHistory,
    isRefetching: refetchingHist,
    isError: errHistory,
  } = useQuery({
    queryKey: ['settlementsHistory', storeId, organizationId],
    queryFn: () =>
      getSettlementList({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
      }),
    enabled: !!storeId && !!organizationId && tab === 'history',
  });

  const todaySettlement = settlementsToday?.items?.[0];

  const expectedPreview = useMemo(() => {
    const oc = moneyToCents(openingStr || '0');
    const sales = moneyToCents(String(report?.sales.amount ?? 0));
    const purchase = moneyToCents(String(report?.purchase.cost ?? 0));
    const sum = oc + sales - purchase;
    return centsToFixed2(sum);
  }, [openingStr, report?.purchase.cost, report?.sales.amount]);

  const diffPreview = useMemo(() => {
    const close = moneyToCents(closingStr || '0');
    const exp = moneyToCents(expectedPreview);
    return centsToFixed2(close - exp);
  }, [closingStr, expectedPreview]);

  const diffPreviewCents = useMemo(() => {
    return moneyToCents(closingStr || '0') - moneyToCents(expectedPreview);
  }, [closingStr, expectedPreview]);

  const createMut = useMutation({
    mutationFn: () =>
      createSettlement({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
        openingCash: Number(centsToFixed2(moneyToCents(openingStr || '0'))),
        closingCash: Number(centsToFixed2(moneyToCents(closingStr || '0'))),
        discrepancyNote: note.trim() || undefined,
      }),
    onSuccess: async () => {
      Alert.alert('成功', '日结已提交');
      setNote('');
      await queryClient.invalidateQueries({ queryKey: ['settlements'] });
      await queryClient.invalidateQueries({ queryKey: ['settlementsHistory'] });
      await refetchToday();
    },
    onError: (e: unknown) => Alert.alert('失败', e instanceof Error ? e.message : '提交失败'),
  });

  const handlePrintRow = useCallback(
    async (row: DailySettlement) => {
      setPrintingId(row.id);
      try {
        const ok = await printerService.printDailySettlement({
          storeName: storeName ?? '未知门店',
          date: formatDate(row.date),
          totalSales: yuan(row.totalSales),
          totalPurchases: yuan(row.totalPurchases),
          deviceCount: row.devicesIn,
          repairCount: row.devicesOut,
        });
        if (!ok) Alert.alert('打印', '当前为打印占位，未连接蓝牙打印机');
      } finally {
        setPrintingId(null);
      }
    },
    [storeName],
  );

  const handlePrintCurrent = useCallback(async () => {
    if (!report) return;
    try {
      const ok = await printerService.printDailySettlement({
        storeName: storeName ?? '未知门店',
        date: formatDate(dateStr),
        totalSales: yuan(report.sales.amount),
        totalPurchases: yuan(report.purchase.cost),
        deviceCount: report.purchase.count,
        repairCount: report.sales.count,
      });
      if (!ok) Alert.alert('打印', '当前为打印占位，未连接蓝牙打印机');
    } catch (e) {
      Alert.alert('打印失败', e instanceof Error ? e.message : '');
    }
  }, [dateStr, report, storeName]);

  if (!storeId || !organizationId) return <LoadingScreen />;
  if (loadingReport && tab === 'report') return <LoadingScreen />;
  if (errReport && tab === 'report') return <QueryError onRetry={() => refetchReport()} />;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <PageHeader title="日结交账" showBack />
      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as 'report' | 'confirm' | 'history')}
        buttons={[
          { value: 'report', label: '经营日报' },
          { value: 'confirm', label: '确认日结' },
          { value: 'history', label: '历史' },
        ]}
        style={styles.seg}
      />

      {tab === 'report' && (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refetchingReport} onRefresh={() => refetchReport()} />}
          contentContainerStyle={styles.pad}
        >
          <View style={styles.dateRow}>
            <Pressable onPress={() => shiftDay(-1)} style={styles.dateBtn}>
              <Text style={{ color: BRAND_COLOR }}>←</Text>
            </Pressable>
            <Text style={[styles.dateText, { color: theme.colors.onSurface }]}>{dateStr}</Text>
            <Pressable onPress={() => shiftDay(1)} style={styles.dateBtn}>
              <Text style={{ color: BRAND_COLOR }}>→</Text>
            </Pressable>
          </View>

          {report && (
            <>
              <View style={styles.statsRow}>
                <StatsCard label="销售额" value={yuan(report.sales.amount)} color={BRAND_COLOR} />
                <StatsCard label="采购成本" value={yuan(report.purchase.cost)} />
              </View>
              <View style={styles.statsRow}>
                <StatsCard label="入库台数" value={`${report.purchase.count}`} />
                <StatsCard label="出库台数" value={`${report.sales.count}`} />
              </View>
              <SectionHeader title="库存变动" />
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={{ color: theme.colors.onSurface }}>
                    入库 {report.purchase.count} 台 · 出库 {report.sales.count} 台
                  </Text>
                </Card.Content>
              </Card>
              <Card style={styles.card}>
                <Card.Title title="现金流与预警" />
                <Card.Content>
                  <Text style={{ color: theme.colors.onSurface }}>
                    净现金流 {yuan(report.netCashFlow)}
                  </Text>
                  <Text style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
                    库存预警 {report.stockAgeWarning} · 应收到期 {report.receivableDue} · 应付到期 {report.payableDue}
                  </Text>
                  <Divider style={{ marginVertical: 12 }} />
                  <Text style={{ fontWeight: '600', marginBottom: 8 }}>毛利 TOP5</Text>
                  {report.profitTop5?.length ? (
                    report.profitTop5.map((p) => (
                      <Text key={p.modelName} style={{ color: theme.colors.onSurface }}>
                        {p.modelName} · {yuan(p.profit)}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>暂无数据</Text>
                  )}
                </Card.Content>
              </Card>
            </>
          )}

          <Button mode="contained" icon="printer" onPress={() => void handlePrintCurrent()} style={styles.mb}>
            打印当前日报摘要
          </Button>
          <Text style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}>{COMPANY_NAME}</Text>
        </ScrollView>
      )}

      {tab === 'confirm' && (
        <ScrollView contentContainerStyle={styles.pad}>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            日期 {dateStr}（与日报 Tab 同步）
          </Text>
          {todaySettlement ? (
            <Card style={styles.card}>
              <Card.Title title="今日已日结" />
              <Card.Content>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.onSurface }}>差额 </Text>
                  <AmountText value={String(todaySettlement.cashDifference)} />
                </View>
                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>状态</Text>
                  <StatusBadge
                    status={todaySettlement.status}
                    variant={todaySettlement.status === 'APPROVED' ? 'success' : 'warning'}
                    label={todaySettlement.status === 'APPROVED' ? '已核准' : todaySettlement.status}
                  />
                </View>
              </Card.Content>
            </Card>
          ) : (
            <>
              <Text style={{ fontWeight: '600', marginBottom: 4, color: theme.colors.onSurface }}>期初现金</Text>
              <TextInput
                label="期初现金"
                value={openingStr}
                onChangeText={() => {}}
                editable={false}
                showSoftInputOnFocus={false}
                mode="outlined"
                dense
              />
              <NumericKeypad value={openingStr} onChange={setOpeningStr} />
              <Text style={{ fontWeight: '600', marginTop: 16, marginBottom: 4, color: theme.colors.onSurface }}>期末现金</Text>
              <TextInput
                label="期末现金"
                value={closingStr}
                onChangeText={() => {}}
                editable={false}
                showSoftInputOnFocus={false}
                mode="outlined"
                dense
              />
              <NumericKeypad value={closingStr} onChange={setClosingStr} />
              <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>
                应有现金（预览）= 期初 + 当日销售 − 采购成本（与后台口径接近）
              </Text>
              <AmountText value={expectedPreview} style={[styles.preview, { color: BRAND_COLOR }]} />
              <Text style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>差额（预览）</Text>
              <AmountText
                value={diffPreview}
                style={[
                  styles.preview,
                  {
                    color:
                      diffPreviewCents === 0n
                        ? theme.colors.onSurfaceVariant
                        : diffPreviewCents < 0n
                          ? theme.colors.error
                          : theme.colors.tertiary,
                  },
                ]}
              />
              <TextInput
                label="备注（选填）"
                value={note}
                onChangeText={setNote}
                mode="outlined"
                multiline
                style={{ marginTop: 12 }}
              />
              <Button
                mode="contained"
                loading={createMut.isPending}
                onPress={() => createMut.mutate()}
                style={{ marginTop: 16 }}
              >
                确认日结
              </Button>
            </>
          )}
        </ScrollView>
      )}

      {tab === 'history' && errHistory ? (
        <QueryError onRetry={() => refetchHistory()} />
      ) : null}

      {tab === 'history' && !errHistory && (
        <View style={styles.flex}>
          <FlashList
            style={{ flex: 1 }}
            data={settlementsHistory?.items ?? []}
            estimatedItemSize={120}
            refreshControl={<RefreshControl refreshing={refetchingHist} onRefresh={() => refetchHistory()} />}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<EmptyState icon="calendar" title="暂无日结记录" />}
            renderItem={({ item }) => (
              <Card style={styles.card} mode="outlined">
                <Card.Title
                  title={formatDate(item.date)}
                  right={() => (
                    <View style={{ marginRight: 12, alignSelf: 'center' }}>
                      <StatusBadge
                        status={item.status}
                        variant={item.status === 'APPROVED' ? 'success' : 'warning'}
                        label={item.status === 'APPROVED' ? '已核准' : item.status}
                      />
                    </View>
                  )}
                />
                <Card.Content>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.onSurface }}>收入 </Text>
                    <AmountText value={String(item.totalSales)} />
                    <Text style={{ color: theme.colors.onSurface }}> · 支出 </Text>
                    <AmountText value={String(item.totalPurchases)} />
                  </View>
                  <View style={{ marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.onSurface }}>差额 </Text>
                    <AmountText value={String(item.cashDifference)} colorize />
                  </View>
                  <Button
                    mode="outlined"
                    compact
                    icon="printer"
                    loading={printingId === item.id}
                    onPress={() => void handlePrintRow(item)}
                    style={{ marginTop: 8 }}
                  >
                    打印
                  </Button>
                </Card.Content>
              </Card>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  seg: { marginHorizontal: 12, marginBottom: 8 },
  pad: { padding: 16, paddingBottom: 32 },
  flex: { flex: 1, paddingHorizontal: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dateBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  dateText: { fontSize: 16, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  card: { marginBottom: 12 },
  mb: { marginVertical: 12 },
  footer: { textAlign: 'center', fontSize: 12, marginBottom: 24 },
  preview: { fontSize: 22, fontWeight: '700', marginTop: 4 },
});
