import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, useTheme, Text, Appbar, SegmentedButtons, HelperText, Searchbar } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getSpareParts, inboundSparePart } from '../../services/spare-parts-service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moneyToCents } from '../../lib/money';

const REL = [
  { value: 'PURCHASE', label: '采购' },
  { value: 'RETURN', label: '退货' },
  { value: 'TRANSFER', label: '调拨' },
  { value: 'OTHER', label: '其他' },
] as const;

export default function SparePartInboundScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const { storeId } = useAuth();

  const [partId, setPartId] = useState<string | undefined>(params.id);
  const [partName, setPartName] = useState<string | undefined>(params.name);
  const [q, setQ] = useState('');
  const [qty, setQty] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [relType, setRelType] = useState('PURCHASE');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { data: list } = useQuery({
    queryKey: ['spareParts', storeId, 'inboundQ', q],
    queryFn: () => getSpareParts({ storeId: storeId ?? '', keyword: q, page: 1, pageSize: 20 }),
    enabled: q.length >= 1 && !!storeId,
  });

  const pick = useCallback(
    (id: string, name: string) => {
      setPartId(id);
      setPartName(name);
      setQ('');
    },
    [],
  );

  const submit = useCallback(async () => {
    if (!partId) {
      setErr('请选择配件');
      return;
    }
    const n = parseInt(qty, 10);
    const cost = unitCost.trim();
    if (!n || n <= 0) {
      setErr('数量必须大于 0');
      return;
    }
    if (!cost || moneyToCents(cost) <= 0n) {
      setErr('单价必须大于 0');
      return;
    }
    if (note.length > 500) {
      setErr('备注最多500字');
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      await inboundSparePart({
        sparePartId: partId,
        quantity: n,
        unitCost: cost,
        relatedType: relType,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '入库失败');
    } finally {
      setSaving(false);
    }
  }, [partId, qty, unitCost, relType, note, router]);

  if (!storeId) {
    return <Text style={{ padding: 16 }}>需要门店</Text>;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="配件入库" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {partName ? (
          <Text style={[styles.block, { color: theme.colors.onSurface }]}>已选: {partName}</Text>
        ) : null}
        <Searchbar placeholder="搜索配件" value={q} onChangeText={setQ} />
        {q.length >= 1 &&
          (list?.data ?? []).slice(0, 6).map((p) => (
            <Button key={p.id} mode="outlined" compact onPress={() => pick(p.id, p.name)} style={styles.pill}>
              {p.name} (库存 {p.stockQty})
            </Button>
          ))}
        <TextInput
          label="数量 *"
          value={qty}
          onChangeText={setQty}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.in}
        />
        <TextInput
          label="单价 *"
          value={unitCost}
          onChangeText={setUnitCost}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.in}
        />
        <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>入库类型</Text>
        <SegmentedButtons
          value={relType}
          onValueChange={setRelType}
          buttons={REL.map((b) => ({ value: b.value, label: b.label }))}
        />
        <TextInput
          label="备注"
          value={note}
          onChangeText={setNote}
          maxLength={500}
          multiline
          mode="outlined"
          style={styles.in}
        />
        {err && <HelperText type="error">{err}</HelperText>}
        <Button mode="contained" loading={saving} onPress={() => void submit()}>
          确认入库
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  block: { marginBottom: 8, fontSize: 15, fontWeight: '600' },
  in: { marginTop: 8, marginBottom: 4 },
  pill: { marginRight: 6, marginBottom: 4, alignSelf: 'flex-start' },
});
