import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Portal,
  Dialog,
  Button,
  TextInput,
  List,
  Chip,
  Snackbar,
  HelperText,
  IconButton,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCustomerDetail, updateCustomer } from '../../services/customer-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { AmountText } from '../../components/finance/AmountText';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, isValidPhone, truncate } from '../../lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CustomerOpportunity, CustomerPointRecord, ServiceVoucher, CustomerBalanceRecord, CustomerInteraction } from '../../types/customer';

type TabKey = 'i' | 'p' | 'b' | 'v' | 'o';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'i', label: '消费' },
  { key: 'p', label: '积分' },
  { key: 'b', label: '余额' },
  { key: 'v', label: '服务券' },
  { key: 'o', label: '商机' },
];

export default function CustomerDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { storeId, organizationId } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<TabKey>('i');
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    wechat: '',
    email: '',
    address: '',
    note: '',
    source: '',
    memberLevel: '',
  });
  const [err, setErr] = useState<string | null>(null);
  const [snack, setSnack] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['customerDetail', id, storeId, organizationId],
    queryFn: () => getCustomerDetail(id, organizationId ?? '', storeId ?? ''),
    enabled: !!id && !!storeId && !!organizationId,
  });

  const c = data?.Customer;

  const openEdit = useCallback(() => {
    if (!c) return;
    setForm({
      name: c.name,
      phone: c.phone ?? '',
      wechat: c.wechat ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      note: c.note ?? '',
      source: c.source ?? '',
      memberLevel: c.memberLevel ?? '',
    });
    setErr(null);
    setEdit(true);
  }, [c]);

  const saveEdit = useCallback(async () => {
    if (!c || !storeId || !organizationId) return;
    if (!form.name.trim()) {
      setErr('姓名必填');
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      setErr('手机号格式无效');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await updateCustomer(c.id, {
        organizationId,
        storeId,
        name: form.name.trim(),
        phone: form.phone.trim() ? form.phone.trim() : null,
        wechat: form.wechat.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        note: form.note.trim() || null,
        source: form.source.trim() || null,
        memberLevel: form.memberLevel.trim() || undefined,
      });
      setSnack(true);
      setEdit(false);
      await qc.invalidateQueries({ queryKey: ['customerDetail', id, storeId, organizationId] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }, [c, form, id, organizationId, qc, storeId]);

  const tabContent = useMemo(() => {
    if (!data) return null;
    if (tab === 'i') {
      const list = data.interactions ?? [];
      if (list.length === 0) {
        return <Text style={{ color: theme.colors.onSurfaceVariant }}>暂无记录</Text>;
      }
      return list.map((r: CustomerInteraction) => (
        <List.Item
          key={r.id}
          title={r.type}
          titleStyle={{ color: theme.colors.onSurface }}
          description={`${r.content}\n${formatDate(r.createdAt, 'YYYY-MM-DD HH:mm')}`}
          descriptionNumberOfLines={6}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        />
      ));
    }
    if (tab === 'p') {
      const list = data.pointRecords ?? [];
      if (list.length === 0) {
        return <Text style={{ color: theme.colors.onSurfaceVariant }}>暂无记录</Text>;
      }
      return list.map((r: CustomerPointRecord) => (
        <List.Item
          key={r.id}
          title={r.reason}
          titleStyle={{ color: theme.colors.onSurface }}
          description={`${r.points} 分 · ${formatDate(r.createdAt, 'YYYY-MM-DD HH:mm')}`}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        />
      ));
    }
    if (tab === 'b') {
      const list = data.balanceRecords ?? [];
      if (list.length === 0) {
        return <Text style={{ color: theme.colors.onSurfaceVariant }}>暂无记录</Text>;
      }
      return list.map((r: CustomerBalanceRecord) => (
        <List.Item
          key={r.id}
          title={r.reason}
          titleStyle={{ color: theme.colors.onSurface }}
          description={formatDate(r.createdAt, 'YYYY-MM-DD HH:mm')}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          right={() => <AmountText value={r.amount} />}
        />
      ));
    }
    if (tab === 'v') {
      const list = data.serviceVouchers ?? [];
      if (list.length === 0) {
        return <Text style={{ color: theme.colors.onSurfaceVariant }}>暂无服务券</Text>;
      }
      return list.map((v: ServiceVoucher) => (
        <List.Item
          key={v.id}
          title={v.service?.name ?? '服务券'}
          titleStyle={{ color: theme.colors.onSurface }}
          description={
            (v.redeemedAt ? '已核销 ' : '未核销 ') + formatDate(v.issuedAt, 'YYYY-MM-DD')
          }
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        />
      ));
    }
    const list = data.opportunities ?? [];
    if (list.length === 0) {
      return <Text style={{ color: theme.colors.onSurfaceVariant }}>暂无商机</Text>;
    }
    return list.map((o: CustomerOpportunity) => (
      <List.Item
        key={o.id}
        title={o.status}
        titleStyle={{ color: theme.colors.onSurface }}
        description={formatDate(o.updatedAt, 'YYYY-MM-DD')}
        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        right={() => <AmountText value={o.expectedAmount} />}
      />
    ));
  }, [data, tab, theme.colors.onSurface, theme.colors.onSurfaceVariant]);

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (!c) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text>客户不存在</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerRight: () => <IconButton icon="pencil" onPress={openEdit} accessibilityLabel="编辑客户" />,
        }}
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.h1, { color: theme.colors.onSurface }]} numberOfLines={1}>
                  {c.name}
                </Text>
                {!!(c.memberLevel || c.tier) && (
                  <Chip style={styles.chip} textStyle={{ fontSize: 12 }}>
                    {c.memberLevel ?? c.tier}
                  </Chip>
                )}
              </View>
            </View>
            {c.phone ? <Text style={[styles.line, { color: theme.colors.onSurfaceVariant }]}>📱 {c.phone}</Text> : null}
            {c.wechat ? <Text style={[styles.line, { color: theme.colors.onSurfaceVariant }]}>WeChat {c.wechat}</Text> : null}
            {c.email ? <Text style={[styles.line, { color: theme.colors.onSurfaceVariant }]}>✉️ {c.email}</Text> : null}
            {c.address ? (
              <Text style={[styles.line, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                📍 {c.address}
              </Text>
            ) : null}
            {c.source ? <Text style={[styles.line, { color: theme.colors.outline }]}>来源：{c.source}</Text> : null}
            {c.note ? (
              <Text style={[styles.line, { color: theme.colors.onSurface }]}>备注：{c.note}</Text>
            ) : null}
            <View style={styles.kpiRow}>
              <View>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>积分</Text>
                <Text style={{ color: theme.colors.onSurface, fontSize: 18, fontWeight: '600' }}>{c.memberPoints}</Text>
              </View>
              <View>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>余额</Text>
                <AmountText value={c.balance} />
              </View>
              <View>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>终身价值</Text>
                <AmountText value={c.lifetimeValue} />
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>授信可用</Text>
                <AmountText value={c.creditAvailable ?? 0} />
              </View>
              <View>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>授信已用</Text>
                <AmountText value={c.creditUsed ?? 0} />
              </View>
              <View>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>授信额度</Text>
                <AmountText value={c.creditLimit ?? 0} />
              </View>
            </View>

            <View style={styles.scoreRow}>
              {!!c.profitScore && <Chip compact style={styles.scoreChip}>利润分 {truncate(c.profitScore, 8)}</Chip>}
              {!!c.loyaltyScore && <Chip compact style={styles.scoreChip}>忠诚分 {truncate(c.loyaltyScore, 8)}</Chip>}
              {!!c.compositeScore && <Chip compact style={styles.scoreChip}>综合分 {truncate(c.compositeScore, 8)}</Chip>}
            </View>
            {(data?.memberCards?.length ?? 0) > 0 && (
              <View style={styles.chipsRow}>
                {data!.memberCards.map((m) => (
                  <Chip key={m.id} compact>
                    卡 {m.cardNo} · {truncate(m.price, 12)}
                  </Chip>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.chipsRow}>
          {TABS.map((t) => (
            <Chip key={t.key} selected={tab === t.key} style={styles.tabChip} onPress={() => setTab(t.key)}>
              {t.label}
            </Chip>
          ))}
        </View>

        <Card style={styles.card} mode="outlined">
          <Card.Content>{tabContent}</Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog visible={edit} onDismiss={() => setEdit(false)} style={{ maxHeight: '90%' }}>
          <Dialog.Title>编辑客户</Dialog.Title>
          <Dialog.Content>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.dlgBody}>
                <TextInput style={styles.dlgIn} label="姓名" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} mode="outlined" />
                <TextInput style={styles.dlgIn} label="手机" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} mode="outlined" keyboardType="phone-pad" />
                <TextInput style={styles.dlgIn} label="微信" value={form.wechat} onChangeText={(v) => setForm((f) => ({ ...f, wechat: v }))} mode="outlined" />
                <TextInput style={styles.dlgIn} label="邮箱" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} mode="outlined" />
                <TextInput style={styles.dlgIn} label="地址" value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} mode="outlined" />
                <TextInput style={styles.dlgIn} label="备注" value={form.note} onChangeText={(v) => setForm((f) => ({ ...f, note: v }))} mode="outlined" multiline />
                <TextInput style={styles.dlgIn} label="来源" value={form.source} onChangeText={(v) => setForm((f) => ({ ...f, source: v }))} mode="outlined" />
                <TextInput
                  style={styles.dlgIn}
                  label="会员等级"
                  value={form.memberLevel}
                  onChangeText={(v) => setForm((f) => ({ ...f, memberLevel: v }))}
                  mode="outlined"
                />
                {err ? <HelperText type="error">{err}</HelperText> : null}
              </View>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEdit(false)}>取消</Button>
            <Button onPress={() => void saveEdit()} loading={saving} mode="contained">
              保存
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar visible={snack} onDismiss={() => setSnack(false)} duration={2000}>
        已保存
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { margin: 12 },
  h1: { fontSize: 22, fontWeight: '700' },
  line: { marginTop: 4, fontSize: 15 },
  chip: { marginTop: 6, alignSelf: 'flex-start' },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  scoreChip: { backgroundColor: '#FFF8E1' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, marginTop: 4, marginBottom: 6 },
  tabChip: { margin: 0 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dlgBody: { paddingBottom: 8 },
  dlgIn: { marginBottom: 8 },
});
