import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Switch,
  Text,
  useTheme,
  Appbar,
  HelperText,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { FormSection } from '../../components/common/FormSection';
import { BarcodeScannerView } from '../../components/scanner/BarcodeScannerView';
import { Modal } from 'react-native';
import { createTradeOrder, patchTradeOrder } from '../../services/trade-order-service';
import { BRAND_COLOR } from '../../lib/theme';

const INSPECTION_KEYS: Array<{ key: string; label: string }> = [
  { key: 'screen', label: '屏幕' },
  { key: 'touch', label: '触摸' },
  { key: 'camera', label: '摄像头' },
  { key: 'charging', label: '充电' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'bluetooth', label: '蓝牙' },
  { key: 'speaker', label: '扬声器' },
  { key: 'mic', label: '麦克风' },
  { key: 'biometric', label: '指纹面容' },
  { key: 'buttons', label: '按键' },
];

export default function NewTradeRecycleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { organizationId, storeId } = useAuth();

  const [sn, setSn] = useState('');
  const [appraised, setAppraised] = useState('');
  const [marketRef, setMarketRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [inspection, setInspection] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INSPECTION_KEYS.map((k) => [k.key, true])),
  );
  const [scan, setScan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = useCallback((key: string, v: boolean) => {
    setInspection((p) => ({ ...p, [key]: v }));
  }, []);

  const inspectionJson = useMemo(() => inspection, [inspection]);

  const submit = useCallback(async () => {
    if (!organizationId || !storeId) return;
    const sns = sn.trim();
    if (!sns) {
      setErr('请填写 SN');
      return;
    }
    if (!appraised.trim()) {
      setErr('请填写回收估价');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const created = await createTradeOrder({
        organizationId,
        storeId,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: [
          {
            sn: sns,
            appraisedValue: appraised.trim(),
            marketRefPrice: marketRef.trim() || undefined,
            inspectionResult: inspectionJson,
          },
        ],
      });
      await patchTradeOrder(created.id, {
        organizationId,
        storeId,
        action: 'COMPLETE',
      });
      Alert.alert('成功', '回收已过账入库');
      router.back();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSaving(false);
    }
  }, [appraised, customerName, customerPhone, inspectionJson, marketRef, organizationId, router, sn, storeId]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="回收登记" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.pad}>
        <FormSection title="设备信息" required>
          <View style={styles.row}>
            <TextInput label="IMEI / SN" value={sn} onChangeText={setSn} mode="outlined" style={{ flex: 1 }} />
            <Button mode="contained-tonal" onPress={() => setScan(true)} style={{ marginLeft: 8 }}>
              扫码
            </Button>
          </View>
        </FormSection>

        <FormSection title="功能检测（正常=ON）">
          {INSPECTION_KEYS.map((k) => (
            <View key={k.key} style={styles.switchRow}>
              <Text>{k.label}</Text>
              <Switch value={!!inspection[k.key]} onValueChange={(v) => toggle(k.key, v)} />
            </View>
          ))}
        </FormSection>

        <FormSection title="评估定价" required>
          <TextInput
            label="市场参考价（可选）"
            value={marketRef}
            onChangeText={setMarketRef}
            keyboardType="decimal-pad"
            mode="outlined"
          />
          <TextInput
            label="回收估价"
            value={appraised}
            onChangeText={setAppraised}
            keyboardType="decimal-pad"
            mode="outlined"
            style={{ marginTop: 8 }}
          />
        </FormSection>

        <FormSection title="客户（可选）">
          <TextInput label="姓名" value={customerName} onChangeText={setCustomerName} mode="outlined" />
          <TextInput
            label="手机"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
            mode="outlined"
            style={{ marginTop: 8 }}
          />
        </FormSection>

        {err ? <HelperText type="error">{err}</HelperText> : null}

        <Button mode="contained" onPress={() => void submit()} loading={saving} buttonColor={BRAND_COLOR} style={{ marginTop: 16 }}>
          确认回收并入库
        </Button>
      </ScrollView>

      <Modal visible={scan} animationType="slide" onRequestClose={() => setScan(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <BarcodeScannerView
            isActive={scan}
            onBarcodeScanned={(code) => {
              setSn(code);
              setScan(false);
            }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
