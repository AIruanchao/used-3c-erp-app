import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { Card, Text, useTheme, FAB, Portal, Modal, SegmentedButtons, TextInput, Button } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AmountText } from '../../components/finance/AmountText';
import { NumericKeypad } from '../../components/common/NumericKeypad';
import { createQuickBook, listQuickBooks } from '../../services/quickbook-service';
import { addCents, moneyToCents } from '../../lib/money';

export default function LedgerScreen() {
  const theme = useTheme();

  const { storeId, organizationId } = useAuth();
  const qc = useQueryClient();
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [createOpen, setCreateOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['quickBooks', storeId, organizationId, type],
    queryFn: () =>
      listQuickBooks({
        storeId: storeId ?? '',
        organizationId: organizationId ?? '',
        type,
        page: 1,
        pageSize: 50,
      }),
    enabled: !!storeId && !!organizationId,
  });

  const items = data?.items ?? [];
  const sum = useMemo(() => {
    return addCents(items.map((i) => i.amount)).toString();
  }, [items]);

  const submit = useCallback(async () => {
    if (!storeId || !organizationId) return;
    if (moneyToCents(amount) <= 0n) return;
    setSaving(true);
    try {
      await createQuickBook({
        storeId,
        organizationId,
        type,
        amount: amount,
        remark: remark.trim() || null,
      });
      setCreateOpen(false);
      setAmount('');
      setRemark('');
      await qc.invalidateQueries({ queryKey: ['quickBooks', storeId, organizationId, type] });
    } finally {
      setSaving(false);
    }
  }, [amount, organizationId, qc, remark, storeId, type]);

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      contentContainerStyle={styles.listContent}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <SegmentedButtons
          value={type}
          onValueChange={(v) => setType(v as 'INCOME' | 'EXPENSE')}
          buttons={[
            { value: 'INCOME', label: '收入' },
            { value: 'EXPENSE', label: '支出' },
          ]}
        />
      </View>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>本页合计</Text>
          <AmountText value={sum} prefix="¥" style={styles.sum} />
          <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>仅统计当前分页（最多50条）</Text>
        </Card.Content>
      </Card>

      {items.length === 0 ? (
        <EmptyState icon="receipt" title="暂无记录" subtitle="点击右下角 + 记一笔" />
      ) : (
        <View>
          {items.map((it) => (
            <Card key={it.id} style={styles.itemCard} mode="outlined">
              <Card.Content style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                    {it.remark?.trim() ? it.remark : '记账'}
                  </Text>
                  <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, fontSize: 12 }}>
                    {new Date(it.createdAt).toLocaleString()}
                  </Text>
                </View>
                <AmountText
                  value={it.amount}
                  prefix={type === 'EXPENSE' ? '-¥' : '¥'}
                  style={{ fontSize: 16, fontWeight: '900' }}
                  colorize
                />
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      <FAB icon="plus" style={[styles.fab, { backgroundColor: '#FFD700' }]} onPress={() => setCreateOpen(true)} />

      <Portal>
        <Modal
          visible={createOpen}
          onDismiss={() => setCreateOpen(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={{ color: theme.colors.onSurface, fontSize: 16, fontWeight: '900' }}>记一笔</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
            {type === 'INCOME' ? '收入' : '支出'}
          </Text>

          <View style={styles.amountBox}>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>金额</Text>
            <Text style={styles.amountText}>¥ {amount || '0'}</Text>
          </View>

          <NumericKeypad value={amount} onChange={setAmount} />

          <TextInput
            label="备注（可选）"
            value={remark}
            onChangeText={setRemark}
            mode="outlined"
            style={{ marginTop: 12 }}
          />

          <View style={styles.modalBtns}>
            <Button onPress={() => setCreateOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button
              mode="contained"
              onPress={() => void submit()}
              loading={saving}
              disabled={saving || moneyToCents(amount) <= 0n}
            >
              保存
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 120 },
  card: { marginHorizontal: 16, marginVertical: 10, borderRadius: 14 },
  title: { fontSize: 14, fontWeight: '900' },
  sum: { fontSize: 22, fontWeight: '900', marginTop: 10 },
  hint: { fontSize: 12, marginTop: 6 },
  itemCard: { marginHorizontal: 16, marginVertical: 6, borderRadius: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
  modal: { marginHorizontal: 18, borderRadius: 16, padding: 14 },
  amountBox: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: '#FFFDF3' },
  amountText: { fontSize: 24, fontWeight: '900', color: '#212121', marginTop: 6 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
});
