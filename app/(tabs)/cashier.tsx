import React, { useState, useCallback, useEffect } from 'react';
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
import { Button, Card, Chip, Divider, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { cashierCheckout } from '../../services/cashier-service';
import { searchDevice } from '../../services/inventory-service';
import { BarcodeScannerView } from '../../components/scanner/BarcodeScannerView';
import { AmountText } from '../../components/finance/AmountText';
import { PAYMENT_METHODS, INVENTORY_STATUS_LABELS } from '../../lib/constants';
import { fetchActivePosMethodOptions } from '../../lib/org-payment-channels';
import { fetchCashAccountsForFlow, type CashAccountRow } from '../../lib/cash-accounts-api';
import { getErrorMessage } from '../../lib/errors';
import { isValidMoneyInput, moneyToNumber } from '../../lib/utils';

export default function CashierTabScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { storeId, organizationId } = useAuth();
  const [deviceId, setDeviceId] = useState('');
  const [deviceSn, setDeviceSn] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [methodOptions, setMethodOptions] = useState(() =>
    PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label })),
  );
  const [paymentMethod, setPaymentMethod] = useState(
    PAYMENT_METHODS[0]?.value ?? 'WECHAT',
  );
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [receiveAccounts, setReceiveAccounts] = useState<CashAccountRow[]>([]);
  const [receiveAccountId, setReceiveAccountId] = useState('');

  useEffect(() => {
    if (!organizationId || !storeId) return;
    let alive = true;
    fetchCashAccountsForFlow(organizationId, storeId, 'RECEIVE')
      .then((list) => {
        if (alive) setReceiveAccounts(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [organizationId, storeId]);

  useEffect(() => {
    if (!organizationId) return;
    let alive = true;
    fetchActivePosMethodOptions(organizationId)
      .then((opts) => {
        if (!alive || !opts.length) return;
        setMethodOptions(opts);
        setPaymentMethod((prev) => (opts.some((o) => o.value === prev) ? prev : opts[0]!.value));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [organizationId]);

  const onScan = useCallback(
    async (code: string) => {
      const trimmedCode = code.trim();
      setDeviceSn(trimmedCode);
      setDeviceId('');
      try {
        const result = await searchDevice({
          sn: trimmedCode,
          storeId: storeId ?? '',
          organizationId: organizationId ?? '',
        });
        if (result) {
          if (result.inventoryStatus !== 'IN_STOCK') {
            Alert.alert('提示', `该设备状态为「${INVENTORY_STATUS_LABELS[result.inventoryStatus] ?? result.inventoryStatus}」，不可销售`);
            setShowScanner(false);
            return;
          }
          setDeviceId(result.id);
          if (result.DevicePricing?.retailPrice) {
            setSalePrice(String(result.DevicePricing.retailPrice));
          }
        }
      } catch {
        // Device lookup failed - user can still proceed manually
      }
      setShowScanner(false);
    },
    [organizationId, storeId],
  );

  const handleCheckout = useCallback(async () => {
    if (loading) return;
    if (!storeId || !organizationId) {
      Alert.alert('错误', '请先选择门店');
      return;
    }
    if (!deviceId && !deviceSn) {
      Alert.alert('错误', '请扫描或输入设备SN');
      return;
    }
    if (!isValidMoneyInput(salePrice) || moneyToNumber(salePrice) <= 0) {
      Alert.alert('错误', '请输入有效的销售价格');
      return;
    }
    const price = moneyToNumber(salePrice);

    setLoading(true);
    try {
      let resolvedDeviceId = deviceId;
      if (!resolvedDeviceId && deviceSn) {
        const found = await searchDevice({
          sn: deviceSn.trim(),
          storeId: storeId ?? '',
          organizationId,
        });
        if (!found) {
          Alert.alert('错误', '未找到该设备，请确认SN或先入库');
          return;
        }
        if (found.inventoryStatus !== 'IN_STOCK') {
          Alert.alert('错误', `该设备状态为「${INVENTORY_STATUS_LABELS[found.inventoryStatus] ?? found.inventoryStatus}」，不可销售`);
          return;
        }
        resolvedDeviceId = found.id;
        setDeviceId(found.id);
      }

      const result = await cashierCheckout({
        storeId,
        organizationId,
        deviceId: resolvedDeviceId,
        salePrice: price,
        Payment: [
          {
            method: paymentMethod,
            amount: price,
            ...(receiveAccountId ? { cashAccountId: receiveAccountId } : {}),
          },
        ],
      });
      const profitDisplay = Number.isFinite(result.profit) ? result.profit.toFixed(2) : '0.00';
      Alert.alert('收银成功', `订单号: ${result.saleOrderId}\n利润: ¥${profitDisplay}`, [
        { text: '继续收银' },
        { text: '好的', onPress: () => router.push('/(tabs)/cashier' as never) },
      ]);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySearch'] });
      queryClient.invalidateQueries({ queryKey: ['outboundSearch'] });
      queryClient.invalidateQueries({ queryKey: ['device'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      // Reset form
      setDeviceId('');
      setDeviceSn('');
      setSalePrice('');
    } catch (err) {
      Alert.alert('收银失败', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    storeId,
    organizationId,
    deviceId,
    deviceSn,
    salePrice,
    paymentMethod,
    receiveAccountId,
    router,
    queryClient,
    loading,
  ]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {showScanner ? (
        <View style={styles.scannerContainer}>
          <BarcodeScannerView
            onBarcodeScanned={(code) => onScan(code)}
            isActive
          />
          <Button mode="text" onPress={() => setShowScanner(false)} accessibilityLabel="关闭相机">
            关闭相机
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card style={styles.card}>
            <Card.Title title="设备信息" titleStyle={styles.cardTitle} />
            <Card.Content>
              <Button
                mode="outlined"
                icon="barcode-scan"
                onPress={() => setShowScanner(true)}
                style={styles.scanBtn}
                accessibilityLabel="扫描设备"
              >
                扫描设备
              </Button>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.outline }]}
                placeholder="设备SN"
                value={deviceSn}
                onChangeText={(text) => {
                  setDeviceSn(text);
                  setDeviceId('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                placeholder="销售价格 *"
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="decimal-pad"
                returnKeyType="done"
                editable={!loading}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="支付方式" titleStyle={styles.cardTitle} />
            <Card.Content>
              <View style={styles.paymentMethods}>
                {methodOptions.map((method) => (
                  <Chip
                    key={method.value}
                    selected={paymentMethod === method.value}
                    onPress={() => setPaymentMethod(method.value)}
                    style={[styles.chip, paymentMethod === method.value && { backgroundColor: '#FF6D00' }]}
                    selectedColor={paymentMethod === method.value ? '#fff' : undefined}
                    accessibilityLabel={method.label}
                  >
                    {method.label}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="收款资金账户（可选）" titleStyle={styles.cardTitle} />
            <Card.Content>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginBottom: 8 }}>
                需计入门店资金余额时选择；不选则只记销售单与收款方式
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  Alert.alert('收款资金账户', '仅「仅收款」或「通用」类账户', [
                    { text: '不入账', onPress: () => setReceiveAccountId('') },
                    ...receiveAccounts.map((a) => ({
                      text: `${a.name}（¥${Number(a.balance).toFixed(2)}）`,
                      onPress: () => setReceiveAccountId(a.id),
                    })),
                    { text: '取消', style: 'cancel' },
                  ]);
                }}
              >
                {receiveAccountId
                  ? (receiveAccounts.find((a) => a.id === receiveAccountId)?.name ?? '已选')
                  : '不入账'}
              </Button>
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
                  accessibilityLabel="确认收款"
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
  container: { flex: 1 },
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
