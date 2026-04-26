import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, HelperText, useTheme, Text, Appbar, Searchbar } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { createPickupOrder } from '../../services/pickup-service';
import { listCustomers } from '../../services/customer-service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

const MAX = { name: 50, phone: 20, addr: 200, note: 500 };

export default function NewPickupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, organizationId } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [estimatedDevices, setEstimatedDevices] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [note, setNote] = useState('');
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [cq, setCq] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { data: custSearch } = useQuery({
    queryKey: ['pickupCust', organizationId, storeId, cq],
    queryFn: () =>
      listCustomers({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
        keyword: cq,
        pageSize: 15,
        page: 1,
      }),
    enabled: cq.length >= 1 && !!organizationId && !!storeId,
  });

  const submit = useCallback(async () => {
    if (!storeId || !organizationId) {
      setErr('缺少门店');
      return;
    }
    if (!customerName.trim() || customerName.length > MAX.name) {
      setErr(`客户姓名必填且不超过${MAX.name}字`);
      return;
    }
    if (!pickupAddress.trim() || pickupAddress.length > MAX.addr) {
      setErr(`取机地址必填且不超过${MAX.addr}字`);
      return;
    }
    if (note.length > MAX.note) {
      setErr(`备注不超过${MAX.note}字`);
      return;
    }
    const ev = estimatedValue.trim() ? Number(estimatedValue) : undefined;
    const ed = estimatedDevices.trim() ? parseInt(estimatedDevices, 10) : undefined;
    if (ev != null && (ev < 0 || ev > 99999999)) {
      setErr('预估价值范围 0～99999999');
      return;
    }
    if (ed != null && (ed < 0 || ed > 1000)) {
      setErr('预计台数 0～1000');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await createPickupOrder({
        organizationId,
        storeId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        pickupAddress: pickupAddress.trim(),
        appointmentTime: appointmentTime.trim() || undefined,
        estimatedDevices: ed,
        estimatedValue: ev,
        note: note.trim() || undefined,
        customerId,
      });
      if (res && typeof res === 'object' && 'offline' in res && (res as { offline?: boolean }).offline) {
        setErr('已离线排队，联网后同步');
        return;
      }
      const id = (res as { id?: string }).id;
      if (id) router.replace(`/pickup/${id}` as never);
      else setErr('创建成功但未返回ID');
    } catch (e) {
      setErr(e instanceof Error ? e.message : '创建失败');
    } finally {
      setSaving(false);
    }
  }, [
    appointmentTime,
    customerId,
    customerName,
    customerPhone,
    estimatedDevices,
    estimatedValue,
    note,
    organizationId,
    pickupAddress,
    router,
    storeId,
  ]);

  if (!storeId || !organizationId) {
    return <Text style={{ padding: 16 }}>请先选择门店</Text>;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="新建取机单" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.section, { color: theme.colors.onSurfaceVariant }]}>关联客户（可选）</Text>
        <Searchbar placeholder="搜索客户" value={cq} onChangeText={setCq} style={styles.input} />
        {!!custSearch?.items?.length && cq.length >= 1 && (
          <View style={styles.quick}>
            {custSearch.items.slice(0, 5).map((c) => (
              <Button
                key={c.id}
                mode="outlined"
                compact
                onPress={() => {
                  setCustomerId(c.id);
                  setCustomerName(c.name);
                  setCustomerPhone(c.phone ?? '');
                  setCq('');
                }}
              >
                {c.name}
              </Button>
            ))}
          </View>
        )}
        <TextInput label="客户姓名 *" value={customerName} onChangeText={setCustomerName} mode="outlined" maxLength={MAX.name} style={styles.input} />
        <TextInput label="手机" value={customerPhone} onChangeText={setCustomerPhone} mode="outlined" maxLength={MAX.phone} keyboardType="phone-pad" style={styles.input} />
        <TextInput
          label="取机地址 *"
          value={pickupAddress}
          onChangeText={setPickupAddress}
          mode="outlined"
          multiline
          maxLength={MAX.addr}
          style={styles.input}
        />
        <TextInput
          label="预约时间 (ISO 或 YYYY-MM-DD HH:mm)"
          value={appointmentTime}
          onChangeText={setAppointmentTime}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="预计台数"
          value={estimatedDevices}
          onChangeText={setEstimatedDevices}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
        />
        <TextInput
          label="预估价值"
          value={estimatedValue}
          onChangeText={setEstimatedValue}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <TextInput label="备注" value={note} onChangeText={setNote} mode="outlined" multiline maxLength={MAX.note} style={styles.input} />
        {err && <HelperText type="error">{err}</HelperText>}
        <Button mode="contained" onPress={() => void submit()} loading={saving}>
          提交
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  input: { marginBottom: 8 },
  section: { marginBottom: 8, fontSize: 13 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
});
