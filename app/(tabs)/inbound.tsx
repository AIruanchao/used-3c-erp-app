import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Card, Chip, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useScanner } from '../../hooks/useScanner';
import { useInboundStore } from '../../stores/inbound-store';
import { quickInbound, checkImei, getSkuInfo } from '../../services/inbound-service';
import { CONDITION_OPTIONS, CHANNEL_OPTIONS } from '../../lib/constants';
import { getErrorMessage } from '../../lib/errors';
import { BarcodeScannerView } from '../../components/scanner/BarcodeScannerView';
import { ScanResultCard } from '../../components/scanner/ScanResultCard';

type InboundStep = 'scan' | 'info' | 'confirm';

export default function InboundScreen() {
  const router = useRouter();
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

  React.useEffect(() => {
    loadOfflineCache();
  }, [loadOfflineCache]);

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
        setSkuName(info.category ?? 'SKU已找到');
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
          setShowScanner(false);
          setScanLoading(false);
          return;
        }

        if (imeiResult.inThisStore && imeiResult.inventoryStatus === 'IN_STOCK') {
          Alert.alert('提示', '该设备已在本门店库中');
          setShowScanner(false);
          setScanLoading(false);
          return;
        }

        if (imeiResult.inOtherStore) {
          Alert.alert('提示', `该设备在其他门店(${imeiResult.otherStoreName ?? '未知'})库中，请确认后再入库`);
        }
      } catch {
        // IMEI check failure is non-blocking
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
    if (!unitCost || Number.isNaN(parseFloat(unitCost)) || parseFloat(unitCost) <= 0) {
      Alert.alert('错误', '请输入有效的成本价');
      return;
    }
    if (peerPrice && (Number.isNaN(parseFloat(peerPrice)) || parseFloat(peerPrice) < 0)) {
      Alert.alert('错误', '同行价不能为负数');
      return;
    }
    if (retailPrice && (Number.isNaN(parseFloat(retailPrice)) || parseFloat(retailPrice) < 0)) {
      Alert.alert('错误', '零售价不能为负数');
      return;
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
        unitCost: parseFloat(unitCost),
        peerPrice: peerPrice ? parseFloat(peerPrice) : undefined,
        retailPrice: retailPrice ? parseFloat(retailPrice) : undefined,
        condition: condition.trim() || undefined,
        channel: channel.trim() || undefined,
        sourceType: sourceType,
        batteryHealth: parsedBatteryHealth,
      });

      if (!result.success || !result.deviceId) {
        Alert.alert('入库失败', result.success ? '未获取设备ID' : '服务器返回失败');
        return;
      }

      Alert.alert('入库成功', `设备ID: ${result.deviceId}`, [
        { text: '继续入库', onPress: resetForm },
        { text: '查看库存', onPress: () => { resetForm(); router.push('/(tabs)/inventory' as never); } },
      ]);

      // Reset form immediately to prevent double submission
      resetForm();

      // Invalidate related queries so other screens show fresh data
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
    router,
    resetForm,
    queryClient,
    loading,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
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
            >
              关闭相机
            </Button>
          </View>
        )}

        {!showScanner && (
          <>
            {/* Scan Button */}
            <Card style={styles.card} mode="outlined">
              <Card.Content>
                <Button
                  mode="contained"
                  icon="barcode-scan"
                  onPress={() => setShowScanner(true)}
                  style={styles.scanBtn}
                >
                  扫码入库
                </Button>
                <View style={styles.manualInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="或手动输入SN/IMEI"
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
                  >
                    下一步
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Scan History */}
            {scanResults.length > 0 && (
              <View style={styles.scanHistory}>
                <View style={styles.scanHistoryHeader}>
                  <Text style={styles.sectionTitle}>
                    扫码记录 ({scanResults.length})
                  </Text>
                  <Button mode="text" compact onPress={clearScanResults}>
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

            {/* Inbound Form */}
            {step === 'info' && (
              <Card style={styles.card} mode="outlined">
                <Card.Title title="入库信息" />
                <Card.Content>
                  <Text style={styles.label} numberOfLines={1}>SN: {sn}</Text>

                  {/* SKU lookup */}
                  <Text style={styles.sectionTitle}>SKU查询 *</Text>
                  <View style={styles.skuRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="输入型号ID/名称"
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
                    >
                      查询
                    </Button>
                  </View>
                  {skuId ? (
                    <Text style={styles.skuFound}>
                      SKU: {skuName || skuId.slice(0, 8)}...
                    </Text>
                  ) : null}

                  <TextInput
                    style={styles.input}
                    placeholder="成本价 *"
                    value={unitCost}
                    onChangeText={setUnitCost}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    editable={!loading}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="同行价"
                    value={peerPrice}
                    onChangeText={setPeerPrice}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    editable={!loading}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="零售价"
                    value={retailPrice}
                    onChangeText={setRetailPrice}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    editable={!loading}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="电池健康度(%)"
                    value={batteryHealth}
                    onChangeText={setBatteryHealth}
                    keyboardType="number-pad"
                    maxLength={3}
                    editable={!loading}
                  />

                  <Text style={styles.sectionTitle}>成色</Text>
                  <View style={styles.chipRow}>
                    {CONDITION_OPTIONS.slice(0, 8).map((opt) => (
                      <Chip
                        key={opt.value}
                        selected={condition === opt.value}
                        onPress={() => setCondition(condition === opt.value ? '' : opt.value)}
                        style={styles.chip}
                        compact
                      >
                        {opt.value}
                      </Chip>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>渠道</Text>
                  <View style={styles.chipRow}>
                    {CHANNEL_OPTIONS.slice(0, 6).map((opt) => (
                      <Chip
                        key={opt}
                        selected={channel === opt}
                        onPress={() => setChannel(channel === opt ? '' : opt)}
                        style={styles.chip}
                        compact
                      >
                        {opt}
                      </Chip>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>来源</Text>
                  <SegmentedButtons
                    value={sourceType}
                    onValueChange={setSourceType}
                    buttons={[
                      { value: 'TRADE_IN', label: '以旧换新' },
                      { value: 'PURCHASE', label: '采购' },
                      { value: 'OTHER', label: '其他' },
                    ]}
                  />

                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading || !unitCost || !skuId}
                    style={styles.submitBtn}
                  >
                    确认入库
                  </Button>
                </Card.Content>
              </Card>
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
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  scannerContainer: {
    height: 400,
  },
  closeScannerBtn: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  card: {
    margin: 16,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
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
  submitBtn: {
    marginTop: 16,
  },
  skuRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  skuFound: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '500',
    marginBottom: 8,
  },
});
