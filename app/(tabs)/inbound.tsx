import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Button, Card, Chip, SegmentedButtons, Switch, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useScanner } from '../../hooks/useScanner';
import { useInboundStore } from '../../stores/inbound-store';
import { quickInbound, checkImei, getSkuInfo } from '../../services/inbound-service';
import { CONDITION_OPTIONS, CHANNEL_OPTIONS, INVENTORY_STATUS_LABELS } from '../../lib/constants';
import { getErrorMessage } from '../../lib/errors';
import { isValidMoneyInput, moneyToNumber } from '../../lib/utils';
import { moneyToCents } from '../../lib/money';
import { centsToFixed2 } from '../../lib/money';
import { fetchActivePosMethodOptions } from '../../lib/org-payment-channels';
import { fetchCashAccountsForFlow, type CashAccountRow } from '../../lib/cash-accounts-api';
import { BarcodeScannerView } from '../../components/scanner/BarcodeScannerView';
import { DualCTAButton } from '../../components/common/DualCTAButton';
import { ScanResultCard } from '../../components/scanner/ScanResultCard';
import { ImageUploader } from '../../components/common/ImageUploader';
import { attachDevicePhotos } from '../../services/upload-service';

type InboundStep = 'scan' | 'info' | 'confirm';

export default function InboundScreen() {
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { storeId, organizationId } = useAuth();
  const { handleBarcodeScanned, isScanning } = useScanner();
  const scanResults = useInboundStore((s) => s.scanResults);
  const loadOfflineCache = useInboundStore((s) => s.loadOfflineCache);
  const clearScanResults = useInboundStore((s) => s.clearScanResults);

  const [step, setStep] = useState<InboundStep>('scan');
  const [sn, setSn] = useState('');
  const [skuId, setSkuId] = useState('');
  const [skuName, setSkuName] = useState('');
  const [modelId, setModelId] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [peerPrice, setPeerPrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [channel, setChannel] = useState('');
  const [sourceType, setSourceType] = useState('TRADE_IN');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [loading, setLoading] = useState(false);
  const [skuLoading, setSkuLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [payOnSite, setPayOnSite] = useState(false);
  const [payMethod, setPayMethod] = useState('WECHAT');
  const [payAccountId, setPayAccountId] = useState('');
  const [payMethodOpts, setPayMethodOpts] = useState<{ value: string; label: string }[]>([]);
  const [payAccounts, setPayAccounts] = useState<CashAccountRow[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [noteForPeer, setNoteForPeer] = useState('');
  const [noteForCustomer, setNoteForCustomer] = useState('');
  const [noteInternal, setNoteInternal] = useState('');
  const [inspectionPhotoUrls, setInspectionPhotoUrls] = useState<string[]>([]);

  React.useEffect(() => {
    loadOfflineCache();
  }, [loadOfflineCache]);

  useEffect(() => {
    if (!organizationId || !storeId) return;
    let alive = true;
    Promise.all([
      fetchActivePosMethodOptions(organizationId),
      fetchCashAccountsForFlow(organizationId, storeId, 'PAY'),
    ])
      .then(([methods, accounts]) => {
        if (!alive) return;
        if (methods.length) {
          setPayMethodOpts(methods);
          setPayMethod((prev) => (methods.some((m) => m.value === prev) ? prev : methods[0]!.value));
        }
        setPayAccounts(accounts);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [organizationId, storeId]);

  const handleLookupSku = useCallback(async () => {
    if (!modelId.trim()) {
      Alert.alert('提示', '请输入机型ID或型号');
      return;
    }
    setSkuLoading(true);
    try {
      const info = await getSkuInfo(modelId.trim());
      if (info.skuId) {
        setSkuId(info.skuId);
        setSkuName(info.skuId.slice(0, 8));
        Alert.alert('成功', `已匹配SKU: ${info.skuId.slice(0, 8)}...`);
      } else {
        setSkuId('');
        setSkuName('');
        Alert.alert('未找到', '该型号没有对应的SKU，请联系管理员创建');
      }
    } catch (err) {
      setSkuId('');
      setSkuName('');
      Alert.alert('查询失败', getErrorMessage(err));
    } finally {
      setSkuLoading(false);
    }
  }, [modelId]);

  const onScan = useCallback(
    async (code: string, format: string) => {
      if (scanLoading) return;
      setScanLoading(true);
      handleBarcodeScanned(code, format);
      setSn(code);

      if (!storeId || !organizationId) {
        setShowScanner(false);
        setScanLoading(false);
        return;
      }

      try {
        const imeiResult = await checkImei(code, storeId, organizationId);

        if (imeiResult.blocked) {
          Alert.alert('警告', `IMEI在黑名单中: ${imeiResult.blacklistReason ?? '未知原因'}`);
          setSn('');
          setShowScanner(false);
          setScanLoading(false);
          return;
        }

        if (imeiResult.inThisStore) {
          const statusLabel = imeiResult.inventoryStatus
            ? (INVENTORY_STATUS_LABELS[imeiResult.inventoryStatus] ?? imeiResult.inventoryStatus)
            : '未知状态';
          Alert.alert('提示', `该设备已在本门店库中（${statusLabel}），不可重复入库`);
          setSn('');
          setShowScanner(false);
          setScanLoading(false);
          return;
        }

        if (imeiResult.inOtherStore) {
          Alert.alert('提示', `该设备在其他门店(${imeiResult.otherStoreName ?? '未知'})库中，请确认后再入库`);
        }
      } catch (err) {
        Alert.alert('提示', `IMEI 校验失败：${getErrorMessage(err)}`);
      }

      setStep('info');
      setShowScanner(false);
      setScanLoading(false);
    },
    [handleBarcodeScanned, storeId, organizationId, scanLoading],
  );

  const resetForm = useCallback(() => {
    setSn('');
    setSkuId('');
    setSkuName('');
    setModelId('');
    setUnitCost('');
    setPeerPrice('');
    setRetailPrice('');
    setCondition('');
    setChannel('');
    setBatteryHealth('');
    setSourceType('TRADE_IN');
    setPayOnSite(false);
    setPayAccountId('');
    setInspectionPhotoUrls([]);
    setStep('scan');
  }, []);

  React.useEffect(() => {
    resetForm();
    clearScanResults();
  }, [storeId, resetForm, clearScanResults]);

  const handleSubmit = useCallback(async () => {
    if (loading) return;
    if (!storeId || !organizationId) {
      Alert.alert('错误', '请先选择门店');
      return;
    }
    if (!sn.trim()) {
      Alert.alert('错误', '请输入或扫描SN');
      return;
    }
    if (!skuId.trim()) {
      Alert.alert('错误', '请先查询SKU（输入型号并点击查询）');
      return;
    }
    if (!isValidMoneyInput(unitCost) || moneyToNumber(unitCost) <= 0) {
      Alert.alert('错误', '请输入有效的成本价');
      return;
    }
    if (peerPrice && (!isValidMoneyInput(peerPrice) || moneyToNumber(peerPrice) < 0)) {
      Alert.alert('错误', '同行价不能为负数');
      return;
    }
    if (retailPrice && (!isValidMoneyInput(retailPrice) || moneyToNumber(retailPrice) < 0)) {
      Alert.alert('错误', '零售价不能为负数');
      return;
    }
    if (payOnSite) {
      if (!payMethod || !payAccountId) {
        Alert.alert('错误', '现场付款请选择支付方式与付款资金账户（「仅付款」或「通用」）');
        return;
      }
      const cost = moneyToNumber(unitCost);
      const acc = payAccounts.find((a) => a.id === payAccountId);
      if (acc && moneyToCents(acc.balance) < moneyToCents(unitCost)) {
        Alert.alert('错误', '所选资金账户余额不足，无法现场付款');
        return;
      }
    }
    let parsedBatteryHealth: number | null = null;
    if (batteryHealth) {
      const bh = parseInt(batteryHealth, 10);
      if (Number.isNaN(bh) || bh < 0 || bh > 100) {
        Alert.alert('错误', '电池健康度请输入0-100之间的整数');
        return;
      }
      parsedBatteryHealth = bh;
    }

    setLoading(true);
    try {
      const result = await quickInbound({
        storeId,
        organizationId,
        skuId: skuId,
        sn: sn.trim(),
        unitCost: moneyToNumber(unitCost),
        peerPrice: peerPrice ? moneyToNumber(peerPrice) : undefined,
        retailPrice: retailPrice ? moneyToNumber(retailPrice) : undefined,
        condition: condition.trim() || undefined,
        channel: channel.trim() || undefined,
        sourceType: sourceType,
        batteryHealth: parsedBatteryHealth,
        payOnSite:
          payOnSite && payMethod && payAccountId
            ? { paymentMethod: payMethod, cashAccountId: payAccountId }
            : undefined,
      });

      if (!result.success || !result.deviceId) {
        Alert.alert('入库失败', result.success ? '未获取设备ID' : '服务器返回失败');
        return;
      }

      if (inspectionPhotoUrls.length > 0) {
        try {
          await attachDevicePhotos({
            deviceId: result.deviceId,
            photoUrls: inspectionPhotoUrls,
            photoType: 'INSPECTION',
          });
        } catch (e) {
          Alert.alert('提示', '入库成功，但照片绑定失败，可稍后在设备详情补传');
        }
      }

      Alert.alert('入库成功', `设备ID: ${result.deviceId}`, [
        { text: '继续入库', onPress: resetForm },
        { text: '查看库存', onPress: () => { resetForm(); router.push('/(tabs)/inventory' as never); } },
      ]);

      resetForm();

      queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySearch'] });
      queryClient.invalidateQueries({ queryKey: ['outboundSearch'] });
      queryClient.invalidateQueries({ queryKey: ['device'] });
    } catch (err) {
      Alert.alert('入库失败', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    storeId,
    organizationId,
    sn,
    skuId,
    unitCost,
    peerPrice,
    retailPrice,
    condition,
    channel,
    sourceType,
    batteryHealth,
    payOnSite,
    payMethod,
    payAccountId,
    payAccounts,
    router,
    resetForm,
    queryClient,
    loading,
  ]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {showScanner && (
          <View style={styles.scannerContainer}>
            <BarcodeScannerView onBarcodeScanned={onScan} isActive={isScanning} />
            <Button
              mode="text"
              onPress={() => { setShowScanner(false); setScanLoading(false); }}
              style={styles.closeScannerBtn}
              accessibilityLabel="关闭相机"
            >
              关闭相机
            </Button>
          </View>
        )}

        {!showScanner && (
          <>
            {step === 'scan' && (
              <>
                {/* Scan Button - no Card wrapper, direct on page */}
                <View style={styles.section}>
                  <Button
                    mode="contained"
                    icon="barcode-scan"
                    onPress={() => setShowScanner(true)}
                    style={styles.scanBtn}
                    accessibilityLabel="扫码入库"
                  >
                    扫码入库
                  </Button>
                  <View style={styles.manualInput}>
                    <TextInput
                      style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                      placeholder="或手动输入SN/IMEI"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={sn}
                      onChangeText={setSn}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!scanLoading}
                    />
                    <Button
                      mode="outlined"
                      onPress={() => {
                        if (sn.trim()) setStep('info');
                      }}
                      disabled={!sn.trim()}
                      accessibilityLabel="下一步"
                    >
                      下一步
                    </Button>
                  </View>
                </View>

                {/* Scan History */}
                {scanResults.length > 0 && (
                  <View style={styles.scanHistory}>
                    <View style={styles.scanHistoryHeader}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                        扫码记录 ({scanResults.length})
                      </Text>
                      <Button mode="text" compact onPress={clearScanResults} accessibilityLabel="清空">
                        清空
                      </Button>
                    </View>
                    {scanResults.slice(-5).reverse().map((result, idx) => (
                      <ScanResultCard
                        key={`${result.timestamp}-${idx}`}
                        code={result.code}
                        format={result.format}
                        timestamp={result.timestamp}
                        synced={result.synced}
                        onPress={() => {
                          setSn(result.code);
                          setStep('info');
                        }}
                      />
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Inbound Form */}
            {step === 'info' && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>SN: {sn}</Text>

                {/* SKU lookup */}
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>SKU查询 *</Text>
                <View style={styles.skuRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                    placeholder="输入型号ID/名称"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={modelId}
                    onChangeText={(text) => { setModelId(text); setSkuId(''); setSkuName(''); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading && !skuLoading}
                  />
                  <Button
                    mode="contained"
                    onPress={handleLookupSku}
                    loading={skuLoading}
                    disabled={skuLoading || !modelId.trim()}
                    compact
                    accessibilityLabel="查询"
                  >
                    查询
                  </Button>
                </View>
                {skuId ? (
                  <Text style={[styles.skuFound, { color: '#FFD700' }]}>
                    SKU: {skuName || skuId.slice(0, 8)}...
                  </Text>
                ) : null}

                {/* 成色 */}
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>成色</Text>
                <View style={styles.chipRow}>
                  {CONDITION_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.value}
                      selected={condition === opt.value}
                      onPress={() => setCondition(condition === opt.value ? '' : opt.value)}
                      style={[styles.chip, condition === opt.value && { backgroundColor: '#FFD700' }]}
                      selectedColor={condition === opt.value ? '#333333' : undefined}
                      compact
                      accessibilityLabel={opt.value}
                    >
                      {opt.value}
                    </Chip>
                  ))}
                </View>

                {/* 渠道 */}
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>渠道</Text>
                <View style={styles.chipRow}>
                  {CHANNEL_OPTIONS.map((opt) => (
                    <Chip
                      key={opt}
                      selected={channel === opt}
                      onPress={() => setChannel(channel === opt ? '' : opt)}
                      style={[styles.chip, channel === opt && { backgroundColor: '#FFD700' }]}
                      selectedColor={channel === opt ? '#333333' : undefined}
                      compact
                      accessibilityLabel={opt}
                    >
                      {opt}
                    </Chip>
                  ))}
                </View>

                {/* 成本价 - 28px大字号 */}
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>成本价 *</Text>
                <View style={styles.costInputWrap}>
                  <Text style={styles.costPrefix}>¥</Text>
                  <TextInput
                    style={[styles.costInput, { color: '#E53935' }]}
                    placeholder="0.00"
                    placeholderTextColor="#CCCCCC"
                    value={unitCost}
                    onChangeText={setUnitCost}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    editable={!loading}
                  />
                </View>

                {/* 更多入库信息 - 可展开 */}
                <TouchableOpacity
                  style={styles.moreToggle}
                  onPress={() => setShowMore(!showMore)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moreToggleText}>
                    {showMore ? '收起更多入库信息 ▲' : '+ 更多入库信息 ▼'}
                  </Text>
                </TouchableOpacity>

                {showMore && (
                  <>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                      placeholder="同行价"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={peerPrice}
                      onChangeText={setPeerPrice}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      editable={!loading}
                    />
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                      placeholder="零售价"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={retailPrice}
                      onChangeText={setRetailPrice}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      editable={!loading}
                    />
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                      placeholder="电池健康度(%)"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={batteryHealth}
                      onChangeText={setBatteryHealth}
                      keyboardType="number-pad"
                      maxLength={3}
                      editable={!loading}
                    />

                    {/* 三层备注 */}
                    <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>备注</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                      placeholder="同行备注（给同行看的）"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={noteForPeer}
                      onChangeText={setNoteForPeer}
                      editable={!loading}
                    />
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                      placeholder="顾客备注（给顾客看的）"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={noteForCustomer}
                      onChangeText={setNoteForCustomer}
                      editable={!loading}
                    />
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                      placeholder="内部备注（仅内部可见）"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={noteInternal}
                      onChangeText={setNoteInternal}
                      editable={!loading}
                    />

                    <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>来源</Text>
                    <SegmentedButtons
                      value={sourceType}
                      onValueChange={setSourceType}
                      buttons={[
                        { value: 'TRADE_IN', label: '以旧换新' },
                        { value: 'PURCHASE', label: '采购' },
                        { value: 'OTHER', label: '其他' },
                      ]}
                    />

                    <ImageUploader
                      maxCount={13}
                      label="机况照片"
                      photoType="INSPECTION"
                      onUpload={setInspectionPhotoUrls}
                    />
                  </>
                )}

                <View style={styles.payOnSiteRow}>
                  <Text style={{ color: theme.colors.onSurface, flex: 1 }}>现场付款（从资金账户扣减）</Text>
                  <Switch value={payOnSite} onValueChange={setPayOnSite} />
                </View>
                {payOnSite ? (
                  <>
                    <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>支付方式</Text>
                    <View style={styles.chipRow}>
                      {payMethodOpts.map((m) => (
                        <Chip
                          key={m.value}
                          selected={payMethod === m.value}
                          onPress={() => setPayMethod(m.value)}
                          style={[styles.chip, payMethod === m.value && { backgroundColor: '#FFD700' }]}
                          selectedColor={payMethod === m.value ? '#333333' : undefined}
                          compact
                        >
                          {m.label}
                        </Chip>
                      ))}
                    </View>
                    <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>付款资金账户</Text>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        Alert.alert('付款资金账户', undefined, [
                          ...payAccounts.map((a) => ({
                            text: `${a.name}（¥${centsToFixed2(moneyToCents(a.balance))}）`,
                            onPress: () => setPayAccountId(a.id),
                          })),
                          { text: '取消', style: 'cancel' },
                        ]);
                      }}
                    >
                      {payAccountId
                        ? (payAccounts.find((a) => a.id === payAccountId)?.name ?? '已选')
                        : '选择账户'}
                    </Button>
                  </>
                ) : null}

                {/* Dual CTA */}
                <View style={styles.dualCtaWrap}>
                  <DualCTAButton
                    leftLabel="入库并打印"
                    leftOnPress={handleSubmit}
                    leftVariant="dark"
                    rightLabel="确认入库"
                    rightOnPress={handleSubmit}
                    rightVariant="primary"
                  />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scannerContainer: {
    height: 400,
  },
  closeScannerBtn: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  scanBtn: {
    marginBottom: 12,
  },
  manualInput: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  chip: {
    marginBottom: 4,
  },
  scanHistory: {
    marginBottom: 16,
  },
  scanHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  payOnSiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  skuRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  skuFound: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  costInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    marginBottom: 8,
    height: 56,
  },
  costPrefix: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E53935',
    marginRight: 8,
  },
  costInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    padding: 0,
  },
  moreToggle: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  moreToggleText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '500',
  },
  dualCtaWrap: {
    marginTop: 16,
    marginBottom: 8,
  },
});
