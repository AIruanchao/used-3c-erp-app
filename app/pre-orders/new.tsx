import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  useTheme,
  Text,
  Appbar,
  Switch,
  HelperText,
  IconButton,
  Menu,
} from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { createPreOrder } from '../../services/pre-order-service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isValidPhone } from '../../lib/utils';
import { CASHIER_PAYMENT_DROPDOWN_OPTIONS } from '../../lib/payment-method-labels';
import { fetchActivePosMethodOptions } from '../../lib/org-payment-channels';

type Line = {
  modelName: string;
  color: string;
  storage: string;
  quantity: string;
  unitPrice: string;
};

function emptyLine(): Line {
  return {
    modelName: '',
    color: '',
    storage: '',
    quantity: '1',
    unitPrice: '',
  };
}

export default function NewPreOrderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, organizationId } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [depositAmount, setDepositAmount] = useState('');
  const [methodOptions, setMethodOptions] = useState(() =>
    CASHIER_PAYMENT_DROPDOWN_OPTIONS.map((m) => ({ value: m.value, label: m.label })),
  );
  const [depositMethod, setDepositMethod] = useState(
    CASHIER_PAYMENT_DROPDOWN_OPTIONS[0]?.value ?? 'WECHAT',
  );
  const [depositMenuOpen, setDepositMenuOpen] = useState(false);
  const [depositPaid, setDepositPaid] = useState(false);
  const [quoteType, setQuoteType] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let alive = true;
    fetchActivePosMethodOptions(organizationId)
      .then((opts) => {
        if (!alive || !opts.length) return;
        setMethodOptions(opts);
        setDepositMethod((prev) => (opts.some((o) => o.value === prev) ? prev : opts[0]!.value));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [organizationId]);

  const updateLine = useCallback((i: number, patch: Partial<Line>) => {
    setLines((ls) => {
      const n = [...ls];
      n[i] = { ...n[i], ...patch } as Line;
      return n;
    });
  }, []);

  const addLine = useCallback(() => {
    if (lines.length >= 50) return;
    setLines((l) => [...l, emptyLine()]);
  }, [lines.length]);

  const removeLine = useCallback((i: number) => {
    setLines((l) => l.filter((_, j) => j !== i));
  }, []);

  const submit = useCallback(async () => {
    if (!storeId) {
      setErr('需要门店');
      return;
    }
    if (!customerName.trim() || customerName.length > 100) {
      setErr('客户姓名必填且不超过100字');
      return;
    }
    if (customerPhone.trim() && !isValidPhone(customerPhone) && customerPhone.length > 30) {
      setErr('手机号格式或长度过长');
      return;
    }
    const payloadLines = lines
      .filter((l) => l.modelName.trim())
      .map((l) => ({
        modelName: l.modelName.trim().slice(0, 100),
        color: l.color.trim().slice(0, 50) || null,
        storage: l.storage.trim().slice(0, 50) || null,
        quantity: Math.min(10000, Math.max(1, parseInt(l.quantity, 10) || 1)),
        unitPrice: l.unitPrice.trim() ? l.unitPrice.trim() : null,
        modelId: null,
        alternativeModelName: null,
      }));
    if (payloadLines.length < 1) {
      setErr('至少一条有效商品行（型号名必填）');
      return;
    }
    if (note.length > 500) {
      setErr('备注最多500字');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('storeId', storeId);
      fd.append('customerName', customerName.trim());
      fd.append('customerPhone', customerPhone.trim());
      fd.append('customerId', customerId.trim());
      fd.append('opportunityId', '');
      fd.append('depositAmount', depositAmount.trim());
      fd.append('depositMethod', depositMethod);
      fd.append('depositPaid', String(depositPaid));
      fd.append('quoteType', quoteType.trim());
      fd.append('quoteAmount', quoteAmount.trim());
      fd.append('taxRate', taxRate.trim());
      fd.append('note', note.trim());
      fd.append('lines', JSON.stringify(payloadLines));
      await createPreOrder(fd);
      router.replace('/pre-orders' as never);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '创建失败');
    } finally {
      setSaving(false);
    }
  }, [
    customerId,
    customerName,
    customerPhone,
    depositAmount,
    depositMethod,
    depositPaid,
    lines,
    note,
    quoteAmount,
    quoteType,
    router,
    storeId,
    taxRate,
  ]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="新建预订单" titleStyle={{ color: theme.colors.onSurface }} />
        <Appbar.Action icon="check" onPress={() => void submit()} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>客户 *</Text>
        <TextInput
          label="客户姓名 *"
          value={customerName}
          onChangeText={setCustomerName}
          maxLength={100}
          mode="outlined"
          style={styles.in}
        />
        <TextInput label="手机" value={customerPhone} onChangeText={setCustomerPhone} mode="outlined" keyboardType="phone-pad" style={styles.in} />
        <TextInput label="已有客户ID(可选)" value={customerId} onChangeText={setCustomerId} mode="outlined" style={styles.in} />
        {lines.map((l, i) => (
          <View key={i} style={styles.lineBlock}>
            <Text style={{ color: theme.colors.onSurface, fontWeight: '600' }}>商品 {i + 1}</Text>
            <TextInput
              label="型号 *"
              value={l.modelName}
              onChangeText={(t) => updateLine(i, { modelName: t })}
              mode="outlined"
              maxLength={100}
              style={styles.in}
            />
            <View style={styles.lineRow}>
              <TextInput
                label="颜色"
                value={l.color}
                onChangeText={(t) => updateLine(i, { color: t })}
                maxLength={50}
                mode="outlined"
                style={styles.half}
              />
              <TextInput
                label="容量"
                value={l.storage}
                onChangeText={(t) => updateLine(i, { storage: t })}
                maxLength={50}
                mode="outlined"
                style={styles.half}
              />
            </View>
            <View style={styles.lineRow}>
              <TextInput
                label="数量"
                value={l.quantity}
                onChangeText={(t) => updateLine(i, { quantity: t })}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.half}
              />
              <TextInput
                label="单价"
                value={l.unitPrice}
                onChangeText={(t) => updateLine(i, { unitPrice: t })}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.half}
              />
            </View>
            <IconButton icon="delete" onPress={() => removeLine(i)} style={{ alignSelf: 'flex-end' }} />
          </View>
        ))}
        <Button onPress={addLine} disabled={lines.length >= 50}>
          添加商品行
        </Button>
        <Text style={[styles.h2, { color: theme.colors.onSurface }]}>财务(可选)</Text>
        <TextInput
          label="定金"
          value={depositAmount}
          onChangeText={setDepositAmount}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.in}
        />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>定金方式（与门店启用通道一致）</Text>
        <Menu
          visible={depositMenuOpen}
          onDismiss={() => setDepositMenuOpen(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setDepositMenuOpen(true)}
              style={styles.in}
            >
              {methodOptions.find((o) => o.value === depositMethod)?.label ?? depositMethod}
            </Button>
          }
        >
          {methodOptions.map((o) => (
            <Menu.Item
              key={o.value}
              onPress={() => {
                setDepositMethod(o.value);
                setDepositMenuOpen(false);
              }}
              title={o.label}
            />
          ))}
        </Menu>
        <View style={styles.rowSwitch}>
          <Text style={{ color: theme.colors.onSurface }}>已付定金</Text>
          <Switch value={depositPaid} onValueChange={setDepositPaid} />
        </View>
        <TextInput
          label="报价类型"
          value={quoteType}
          onChangeText={setQuoteType}
          mode="outlined"
          style={styles.in}
        />
        <TextInput
          label="报价金额"
          value={quoteAmount}
          onChangeText={setQuoteAmount}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.in}
        />
        <TextInput
          label="税率"
          value={taxRate}
          onChangeText={setTaxRate}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.in}
        />
        <TextInput
          label="备注"
          value={note}
          onChangeText={setNote}
          maxLength={500}
          multiline
          numberOfLines={3}
          mode="outlined"
          style={styles.in}
        />
        {err && <HelperText type="error">{err}</HelperText>}
        <Button mode="contained" loading={saving} onPress={() => void submit()}>
          创建
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  in: { marginBottom: 6 },
  h2: { marginTop: 12, marginBottom: 6, fontSize: 16, fontWeight: '600' },
  lineBlock: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 8, marginBottom: 8 },
  lineRow: { flexDirection: 'row', gap: 8 },
  half: { flex: 1, marginBottom: 4 },
  rowSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
});
