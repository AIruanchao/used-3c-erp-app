import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Button, Card, Chip, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { cashierCheckout } from '../services/cashier-service';
import { getDevices } from '../services/device-service';
import { BarcodeScannerView } from '../components/scanner/BarcodeScannerView';
import { AmountText } from '../components/finance/AmountText';
import { PAYMENT_METHODS } from '../lib/constants';
import { getErrorMessage } from '../lib/errors';

export default function CashierScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [deviceId, setDeviceId] = useState('');
  const [deviceSn, setDeviceSn] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const onScan = useCallback(
    async (code: string) => {
      setDeviceSn(code);
      try {
        const result = await getDevices({
          search: code,
          storeId: storeId ?? undefined,
          organizationId: organizationId ?? undefined,
          inventoryStatus: 'IN_STOCK',
        });
        if (result.items.length > 0) {
          const device = result.items[0]!;
          setDeviceId(device.id);
          if (device.DevicePricing?.retailPrice) {
            setSalePrice(String(device.DevicePricing.retailPrice));
          }
        }
      } catch {
        // Device not found, continue manually
      }
      setShowScanner(false);
    },
    [storeId, organizationId],
  );

  const handleCheckout = useCallback(async () => {
    if (!storeId || !organizationId) {
      Alert.alert('错误', '请先选择门店');
      return;
    }
    if (!deviceId && !deviceSn) {
      Alert.alert('错误', '请扫描或输入设备SN');
      return;
    }
    const price = parseFloat(salePrice);
    if (Number.isNaN(price) || price <= 0) {
      Alert.alert('错误', '请输入有效的销售价格');
      return;
    }

    setLoading(true);
    try {
      const result = await cashierCheckout({
        storeId,
        organizationId,
        deviceId,
        salePrice: price,
        Payment: [{ method: paymentMethod, amount: price }],
      });
      Alert.alert('收银成功', `订单号: ${result.saleOrderId}\n利润: ¥${result.profit}`, [
        { text: '好的', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('收银失败', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [storeId, organizationId, deviceId, deviceSn, salePrice, paymentMethod, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {showScanner ? (
        <View style={styles.scannerContainer}>
          <BarcodeScannerView
            onBarcodeScanned={(code) => onScan(code)}
            isActive
          />
          <Button mode="text" onPress={() => setShowScanner(false)}>
            关闭相机
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card style={styles.card}>
            <Card.Title title="设备信息" titleStyle={styles.cardTitle} />
            <Card.Content>
              <Button
                mode="outlined"
                icon="barcode-scan"
                onPress={() => setShowScanner(true)}
                style={styles.scanBtn}
              >
                扫描设备
              </Button>
              <TextInput
                style={styles.input}
                placeholder="设备SN"
                value={deviceSn}
                onChangeText={setDeviceSn}
              />
              <TextInput
                style={styles.input}
                placeholder="销售价格 *"
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="decimal-pad"
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="支付方式" titleStyle={styles.cardTitle} />
            <Card.Content>
              <View style={styles.paymentMethods}>
                {PAYMENT_METHODS.map((method) => (
                  <Chip
                    key={method.value}
                    selected={paymentMethod === method.value}
                    onPress={() => setPaymentMethod(method.value)}
                    style={styles.chip}
                  >
                    {method.label}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Summary */}
          {salePrice ? (
            <Card style={styles.card} mode="elevated">
              <Card.Content>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>应收金额</Text>
                  <AmountText value={salePrice} style={styles.summaryAmount} />
                </View>
                <Divider style={styles.divider} />
                <Button
                  mode="contained"
                  onPress={handleCheckout}
                  loading={loading}
                  disabled={loading}
                  style={styles.checkoutBtn}
                  labelStyle={styles.checkoutLabel}
                >
                  确认收款
                </Button>
              </Card.Content>
            </Card>
          ) : null}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  scannerContainer: { flex: 1 },
  scroll: { paddingBottom: 24 },
  card: { marginHorizontal: 16, marginTop: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  scanBtn: { marginBottom: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: { marginBottom: 4 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 16, color: '#424242' },
  summaryAmount: { fontSize: 24, fontWeight: 'bold' },
  divider: { marginVertical: 8 },
  checkoutBtn: {
    borderRadius: 8,
    paddingVertical: 4,
  },
  checkoutLabel: { fontSize: 18, paddingVertical: 4 },
});
