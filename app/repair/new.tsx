import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Button, Chip, Divider, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { acceptRepairQuote, createRepair, createRepairPayment, quoteRepair } from '../../services/repair-service';
import { findOrCreateCustomer } from '../../services/finance-service';
import { getErrorMessage } from '../../lib/errors';
import { BrandModelPicker } from '../../components/inventory/BrandModelPicker';
import { StepProgress } from '../../components/common/StepProgress';
import { FormSection } from '../../components/common/FormSection';
import { DualCTAButton } from '../../components/common/DualCTAButton';
import { centsToFixed2, moneyToCents } from '../../lib/money';
import { ConditionTagGroup } from '../../components/common/ConditionTagGroup';
import { isValidMoneyInput, moneyToNumber } from '../../lib/utils';
import { fetchActivePosMethodOptions } from '../../lib/org-payment-channels';
import { fetchCashAccountsForFlow, type CashAccountRow } from '../../lib/cash-accounts-api';
import { BarcodeScannerView } from '../../components/scanner/BarcodeScannerView';
import { BRAND_COLOR, BRAND_SURFACE_LIGHT } from '../../lib/theme';

export default function NewRepairScreen() {
  const theme = useTheme();

  const router = useRouter();
  const params = useLocalSearchParams<{ sn?: string; deviceId?: string }>();
  const queryClient = useQueryClient();
  const { storeId, organizationId } = useAuth();
  const [step, setStep] = useState(0);
  const steps = useMemo(() => ['信息', '报价', '结算'], []);

  // Step 1
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceSn, setDeviceSn] = useState('');
  /** 质保页跳转携带的已建档设备 ID（任务卡：/repair/new?deviceId=） */
  const [linkedDeviceId, setLinkedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof params.sn === 'string' && params.sn.trim()) {
      setDeviceSn(params.sn.trim());
    }
  }, [params.sn]);

  useEffect(() => {
    if (typeof params.deviceId === 'string' && params.deviceId.trim()) {
      setLinkedDeviceId(params.deviceId.trim());
    }
  }, [params.deviceId]);
  const [password, setPassword] = useState('');
  const [source, setSource] = useState<string>('OFFLINE');
  const [keepStatus, setKeepStatus] = useState<string>('REPAIR_NOW');
  const [repairStatusTags, setRepairStatusTags] = useState<string[]>([]);
  const [deviceConditionTags, setDeviceConditionTags] = useState<string[]>([]);
  const [faultCategory, setFaultCategory] = useState<string>('OTHER');
  const [faultDescription, setFaultDescription] = useState('');
  const [deviceBrand, setDeviceBrand] = useState<string>('未知');
  const [deviceModel, setDeviceModel] = useState<string>('未知');
  const [brandModelPickerVisible, setBrandModelPickerVisible] = useState(false);

  const [scanVisible, setScanVisible] = useState(false);

  // Step 2
  const [selectedLines, setSelectedLines] = useState<
    Array<{ id: string; type: string; name: string; unitPrice: string; warrantyDays: number }>
  >([]);
  const [laborCost, setLaborCost] = useState('');

  // Step 3
  const [deposit, setDeposit] = useState('');
  const [payMethod, setPayMethod] = useState<string>('WECHAT');
  const [payMethodOpts, setPayMethodOpts] = useState<{ value: string; label: string }[]>([]);
  const [payAccounts, setPayAccounts] = useState<CashAccountRow[]>([]);
  const [payAccountId, setPayAccountId] = useState('');

  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setCustomerName('');
    setCustomerPhone('');
    setDeviceSn('');
    setPassword('');
    setSource('OFFLINE');
    setKeepStatus('REPAIR_NOW');
    setRepairStatusTags([]);
    setDeviceConditionTags([]);
    setFaultCategory('OTHER');
    setFaultDescription('');
    setDeviceBrand('未知');
    setDeviceModel('未知');
    setSelectedLines([]);
    setLaborCost('');
    setDeposit('');
    setPayAccountId('');
    setLinkedDeviceId(null);
    setStep(0);
    setScanVisible(false);
  }, []);

  React.useEffect(() => {
    if (!organizationId || !storeId) return;
    let alive = true;
    Promise.all([
      fetchActivePosMethodOptions(organizationId),
      fetchCashAccountsForFlow(organizationId, storeId, 'RECEIVE'),
    ])
      .then(([methods, accounts]) => {
        if (!alive) return;
        setPayMethodOpts(methods);
        if (methods.length) {
          setPayMethod((prev) => (methods.some((m) => m.value === prev) ? prev : methods[0]!.value));
        }
        setPayAccounts(accounts);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [organizationId, storeId]);

  const toggleTag = useCallback((arr: string[], v: string, setArr: (x: string[]) => void) => {
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }, []);

  const totalQuoteCents = useMemo(() => {
    const parts = selectedLines.reduce(
      (s, l) => s + (isValidMoneyInput(l.unitPrice) ? moneyToCents(l.unitPrice) : 0n),
      0n,
    );
    const labor = isValidMoneyInput(laborCost) ? moneyToCents(laborCost) : 0n;
    return parts + labor;
  }, [selectedLines, laborCost]);

  const remainingCents = useMemo(() => {
    const dep = isValidMoneyInput(deposit) ? moneyToCents(deposit) : 0n;
    const remain = totalQuoteCents - dep;
    return remain < 0n ? 0n : remain;
  }, [totalQuoteCents, deposit]);

  const handleSubmit = useCallback(async () => {
    if (loading) return;
    if (!storeId || !organizationId) {
      Alert.alert('错误', '请先选择门店');
      return;
    }
    if (!faultDescription.trim()) return Alert.alert('错误', '请输入故障描述');
    if (!deviceBrand.trim() || !deviceModel.trim()) return Alert.alert('错误', '请选择机型');

    setLoading(true);
    try {
      const name = customerName.trim() || '散客';
      const phone = customerPhone.trim();

      // Ensure customer exists (find by phone or create)
      const customer = await findOrCreateCustomer({
        storeId,
        organizationId,
        name,
        phone: phone || undefined,
      });

      const result = await createRepair({
        storeId,
        organizationId,
        customerId: customer.id,
        deviceId: linkedDeviceId ?? undefined,
        deviceSn: deviceSn.trim() || undefined,
        faultDescription: faultDescription.trim(),
        faultCategory,
        customerName: name,
        customerPhone: phone || undefined,
        deviceBrand,
        deviceModel,
        source,
        password: password.trim() || undefined,
        keepStatus,
        repairStatusTags,
        deviceConditionTags,
      });
      if (!result.ok || !result.order) {
        Alert.alert('创建失败', '服务器返回失败');
        return;
      }
      const order = result.order;

      // Step2: quote lines + accept
      if (selectedLines.length > 0 || (isValidMoneyInput(laborCost) && moneyToNumber(laborCost) > 0)) {
        await quoteRepair(order.id, {
          lines: selectedLines.map((l) => ({
            type: l.type,
            sparePartName: l.name,
            quantity: 1,
            unitCost: 0,
            unitPrice: isValidMoneyInput(l.unitPrice) ? moneyToNumber(l.unitPrice) : 0,
          })),
          laborCost: isValidMoneyInput(laborCost) ? moneyToNumber(laborCost) : 0,
        });
        await acceptRepairQuote(order.id);
      }

      // Step3: optional deposit payment
      if (isValidMoneyInput(deposit) && moneyToNumber(deposit) > 0) {
        if (!payMethod) throw new Error('请选择收款方式');
        await createRepairPayment({
          repairOrderId: order.id,
          amount: moneyToNumber(deposit),
          method: payMethod,
        });
      }

      const descriptionParam = order.faultDescription ?? faultDescription;
      const snParam = order.deviceSn ?? deviceSn;
      resetForm();
      Alert.alert('成功', '维修工单已创建', [
        {
          text: '查看详情',
          onPress: () =>
            router.replace({
              pathname: '/repair/[id]',
              params: {
                id: order.id,
                status: order.status,
                description: descriptionParam,
                sn: snParam,
              },
            } as never),
        },
      ]);

      queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err) {
      Alert.alert('创建失败', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    storeId,
    organizationId,
    customerName,
    customerPhone,
    deviceSn,
    linkedDeviceId,
    faultDescription,
    faultCategory,
    deviceBrand,
    deviceModel,
    source,
    password,
    keepStatus,
    repairStatusTags,
    deviceConditionTags,
    selectedLines,
    laborCost,
    deposit,
    payMethod,
    router,
    queryClient,
    resetForm,
  ]);

  const canNextStep1 =
    !!deviceBrand.trim() &&
    !!deviceModel.trim() &&
    !!faultDescription.trim() &&
    (!customerPhone.trim() || customerPhone.trim().length >= 7);

  const canNextStep2 = selectedLines.length > 0 || (isValidMoneyInput(laborCost) && moneyToNumber(laborCost) >= 0);

  const FAULT_CATEGORIES = useMemo(
    () => [
      {
        id: 'screen',
        name: '屏幕故障',
        items: [
          { id: 'screen_assembly', name: '更换屏幕总成', defaultPrice: '', warrantyDays: 90 },
          { id: 'outer_glass', name: '更换外屏玻璃', defaultPrice: '', warrantyDays: 30 },
        ],
      },
      {
        id: 'battery',
        name: '电池/续航',
        items: [
          { id: 'battery_replace', name: '更换电池', defaultPrice: '', warrantyDays: 90 },
          { id: 'power_issue', name: '不开机/掉电排查', defaultPrice: '', warrantyDays: 30 },
        ],
      },
      {
        id: 'port',
        name: '接口/排线',
        items: [
          { id: 'charging_port', name: '尾插排线', defaultPrice: '', warrantyDays: 30 },
          { id: 'earpiece', name: '听筒排线', defaultPrice: '', warrantyDays: 30 },
        ],
      },
      {
        id: 'other',
        name: '其他',
        items: [
          { id: 'cleaning', name: '清洁保养', defaultPrice: '', warrantyDays: 7 },
          { id: 'diagnosis', name: '检测/排查', defaultPrice: '', warrantyDays: 7 },
        ],
      },
    ],
    [],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <StepProgress steps={steps.map((label) => ({ label }))} currentStep={step} />
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 8 }}>
          {steps.map((label, idx) => (
            <Chip
              key={label}
              selected={step === idx}
              onPress={() => setStep(idx)}
              style={[styles.chip, step === idx && { backgroundColor: BRAND_COLOR }]}
              selectedColor={step === idx ? '#333' : undefined}
              compact
            >
              {label}
            </Chip>
          ))}
        </View>

        {scanVisible && (
          <View style={styles.scannerBox}>
            <BarcodeScannerView
              isActive
              onBarcodeScanned={(code) => {
                setDeviceSn(code);
                setScanVisible(false);
              }}
            />
            <Button mode="text" onPress={() => setScanVisible(false)}>
              关闭相机
            </Button>
          </View>
        )}

        {!scanVisible && step === 0 && (
          <View style={styles.card}>
            <FormSection title="客户信息">
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                placeholder="客户姓名（可选，默认散客）"
                value={customerName}
                onChangeText={setCustomerName}
                editable={!loading}
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                placeholder="客户手机号（可选）"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </FormSection>

            <Divider style={styles.divider} />

            <FormSection title="设备信息" required>
              <TouchableOpacity
                style={[styles.pickerBtn, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                onPress={() => setBrandModelPickerVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={{ color: theme.colors.onSurface }}>
                  机型：{deviceBrand} {deviceModel}
                </Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>选择</Text>
              </TouchableOpacity>

              <View style={styles.snRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                  placeholder="IMEI（可选）"
                  value={deviceSn}
                  onChangeText={setDeviceSn}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <Button mode="outlined" onPress={() => setScanVisible(true)}>
                  扫码
                </Button>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                placeholder="锁屏密码（可选）"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </FormSection>

            <Text style={styles.sectionTitle}>来源</Text>
            <View style={styles.chipRow}>
              {['OFFLINE', 'PRIVATE', 'AMAP', 'DOUYIN', 'MEITUAN'].map((v) => (
                <Chip
                  key={v}
                  selected={source === v}
                  onPress={() => setSource(v)}
                  style={[styles.chip, source === v && { backgroundColor: BRAND_COLOR }]}
                  selectedColor={source === v ? '#333' : undefined}
                  compact
                >
                  {v}
                </Chip>
              ))}
            </View>

            <Text style={styles.sectionTitle}>留机状态</Text>
            <View style={styles.chipRow}>
              {[
                { v: 'REPAIR_NOW', t: '维修中' },
                { v: 'KEEP', t: '留机' },
              ].map((x) => (
                <Chip
                  key={x.v}
                  selected={keepStatus === x.v}
                  onPress={() => setKeepStatus(x.v)}
                  style={[styles.chip, keepStatus === x.v && { backgroundColor: BRAND_COLOR }]}
                  selectedColor={keepStatus === x.v ? '#333' : undefined}
                  compact
                >
                  {x.t}
                </Chip>
              ))}
            </View>

            <Text style={styles.sectionTitle}>维修状态标签</Text>
            <View style={styles.chipRow}>
              {['检测中', '待回复', '等配件', '不同意', '维修中', '完成'].map((t) => (
                <Chip
                  key={t}
                  selected={repairStatusTags.includes(t)}
                  onPress={() => toggleTag(repairStatusTags, t, setRepairStatusTags)}
                  style={[styles.chip, repairStatusTags.includes(t) && { backgroundColor: BRAND_COLOR }]}
                  selectedColor={repairStatusTags.includes(t) ? '#333' : undefined}
                  compact
                >
                  {t}
                </Chip>
              ))}
            </View>

            <Text style={styles.sectionTitle}>机况标签</Text>
            <ConditionTagGroup value={deviceConditionTags} onChange={setDeviceConditionTags} mode="multi" />

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>故障信息</Text>
            <View style={styles.chipRow}>
              {['SCREEN', 'BATTERY', 'PORT', 'BOARD', 'OTHER'].map((v) => (
                <Chip
                  key={v}
                  selected={faultCategory === v}
                  onPress={() => setFaultCategory(v)}
                  style={[styles.chip, faultCategory === v && { backgroundColor: BRAND_COLOR }]}
                  selectedColor={faultCategory === v ? '#333' : undefined}
                  compact
                >
                  {v}
                </Chip>
              ))}
            </View>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
              placeholder="故障描述 *"
              value={faultDescription}
              onChangeText={setFaultDescription}
              multiline
              numberOfLines={4}
              editable={!loading}
            />

            <View style={styles.dualCtaWrap}>
              <DualCTAButton
                leftLabel="直接开单"
                leftOnPress={() => setStep(2)}
                leftVariant="dark"
                rightLabel="下一步 →"
                rightOnPress={() => setStep(1)}
                rightVariant="primary"
              />
            </View>
          </View>
        )}

        {!scanVisible && step === 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>故障报价</Text>
            <Text style={styles.hint}>选择项目并填写价格（可留空为0）</Text>

            {FAULT_CATEGORIES.map((c) => (
              <View key={c.id} style={styles.quoteGroup}>
                <Text style={styles.quoteGroupTitle}>{c.name}</Text>
                {c.items.map((it) => {
                  const picked = selectedLines.some((l) => l.id === it.id);
                  const line = selectedLines.find((l) => l.id === it.id);
                  return (
                    <View key={it.id} style={styles.quoteItemRow}>
                      <TouchableOpacity
                        style={[styles.quotePick, picked && styles.quotePickActive]}
                        onPress={() => {
                          if (picked) {
                            setSelectedLines((prev) => prev.filter((x) => x.id !== it.id));
                          } else {
                            setSelectedLines((prev) => [
                              ...prev,
                              { id: it.id, type: 'LABOR', name: it.name, unitPrice: '', warrantyDays: it.warrantyDays },
                            ]);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: picked ? '#333' : theme.colors.onSurface }}>
                          {picked ? '✓ ' : ''}{it.name}
                        </Text>
                        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                          质保{it.warrantyDays}天
                        </Text>
                      </TouchableOpacity>
                      {picked && (
                        <TextInput
                          style={[styles.priceInput, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                          placeholder="¥0.00"
                          value={line?.unitPrice ?? ''}
                          onChangeText={(v) => {
                            setSelectedLines((prev) =>
                              prev.map((x) => (x.id === it.id ? { ...x, unitPrice: v } : x)),
                            );
                          }}
                          keyboardType="decimal-pad"
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}

            <Text style={styles.sectionTitle}>人工费（可选）</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
              placeholder="人工费"
              value={laborCost}
              onChangeText={setLaborCost}
              keyboardType="decimal-pad"
            />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>已选 {selectedLines.length} 项</Text>
              <Text style={styles.summaryAmount}>合计 ¥{centsToFixed2(totalQuoteCents)}</Text>
            </View>

            <View style={styles.dualCtaWrap}>
              <DualCTAButton
                leftLabel="上一步"
                leftOnPress={() => setStep(0)}
                leftVariant="outlined"
                rightLabel="下一步 →"
                rightOnPress={() => setStep(2)}
                rightVariant="primary"
              />
            </View>
          </View>
        )}

        {!scanVisible && step === 2 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>结算</Text>
            <Text style={styles.hint}>可选：收取定金（将调用维修收款接口）</Text>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>报价合计</Text>
              <Text style={styles.summaryAmount}>¥{centsToFixed2(totalQuoteCents)}</Text>
            </View>

            <Text style={styles.sectionTitle}>定金（可选）</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
              placeholder="0.00"
              value={deposit}
              onChangeText={setDeposit}
              keyboardType="decimal-pad"
            />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>应收（合计-定金）</Text>
              <Text style={styles.summaryAmount}>¥{centsToFixed2(remainingCents)}</Text>
            </View>

            <Text style={styles.sectionTitle}>收款方式</Text>
            <View style={styles.chipRow}>
              {payMethodOpts.length
                ? payMethodOpts.map((m) => (
                    <Chip
                      key={m.value}
                      selected={payMethod === m.value}
                      onPress={() => setPayMethod(m.value)}
                      style={[styles.chip, payMethod === m.value && { backgroundColor: BRAND_COLOR }]}
                      selectedColor={payMethod === m.value ? '#333' : undefined}
                      compact
                    >
                      {m.label}
                    </Chip>
                  ))
                : ['WECHAT', 'ALIPAY', 'CASH', 'BANK'].map((v) => (
                    <Chip
                      key={v}
                      selected={payMethod === v}
                      onPress={() => setPayMethod(v)}
                      style={[styles.chip, payMethod === v && { backgroundColor: BRAND_COLOR }]}
                      selectedColor={payMethod === v ? '#333' : undefined}
                      compact
                    >
                      {v}
                    </Chip>
                  ))}
            </View>

            <Text style={styles.sectionTitle}>收款账户（可选）</Text>
            <Button
              mode="outlined"
              onPress={() => {
                if (!payAccounts.length) return;
                Alert.alert('选择账户', undefined, [
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

            <View style={styles.dualCtaWrap}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !canNextStep1}
              >
                提交
              </Button>
              <Button mode="text" onPress={() => setStep(1)} disabled={loading}>
                上一步
              </Button>
            </View>
          </View>
        )}

        <BrandModelPicker
          visible={brandModelPickerVisible}
          onDismiss={() => setBrandModelPickerVisible(false)}
          organizationId={organizationId ?? ''}
          onSelect={() => {
            setBrandModelPickerVisible(false);
          }}
          onSelectNames={(brandName, modelName) => {
            if (brandName) setDeviceBrand(brandName);
            if (modelName) setDeviceModel(modelName);
          }}
          onManualInput={(brandName, modelName) => {
            setDeviceBrand(brandName);
            setDeviceModel(modelName);
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  scroll: { paddingBottom: 24 },
  card: { margin: 16, borderRadius: 12, padding: 16, backgroundColor: '#fff' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 8 },
  divider: { marginVertical: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { marginBottom: 4 },
  dualCtaWrap: { marginTop: 12, gap: 8 },
  pickerBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  snRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  scannerBox: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  hint: { fontSize: 12, color: '#757575', marginBottom: 12 },
  quoteGroup: { marginBottom: 12 },
  quoteGroupTitle: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 8 },
  quoteItemRow: { marginBottom: 8 },
  quotePick: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, backgroundColor: '#fff' },
  quotePickActive: { backgroundColor: BRAND_SURFACE_LIGHT, borderColor: BRAND_COLOR },
  priceInput: { marginTop: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  summaryBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  summaryText: { fontSize: 13, color: '#757575' },
  summaryAmount: { fontSize: 16, fontWeight: '800', color: '#212121' },
});
