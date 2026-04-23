import React, { useState, useCallback } from 'react';
import { StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { createRepair } from '../../services/repair-service';
import { findOrCreateCustomer } from '../../services/finance-service';
import { getErrorMessage } from '../../lib/errors';

export default function NewRepairScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { storeId, organizationId } = useAuth();
  const [sn, setSn] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!storeId || !organizationId) {
      Alert.alert('错误', '请先选择门店');
      return;
    }
    if (!description.trim()) {
      Alert.alert('错误', '请输入故障描述');
      return;
    }

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
        deviceSn: sn.trim() || undefined,
        faultDescription: description.trim(),
        faultCategory: 'OTHER',
        customerName: name,
        customerPhone: phone || undefined,
        deviceBrand: '未知',
        deviceModel: '未知',
      });
      if (!result.ok || !result.order) {
        Alert.alert('创建失败', '服务器返回失败');
        return;
      }
      const order = result.order;
      Alert.alert('成功', '维修工单已创建', [
        {
          text: '查看详情',
          onPress: () =>
            router.replace({
              pathname: '/repair/[id]',
              params: {
                id: order.id,
                status: order.status,
                description: order.faultDescription ?? description,
                sn: order.deviceSn ?? sn,
              },
            } as never),
        },
        { text: '返回', style: 'cancel', onPress: () => router.back() },
      ]);

      queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
    } catch (err) {
      Alert.alert('创建失败', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [storeId, organizationId, sn, description, customerName, customerPhone, router, queryClient]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              style={styles.input}
              placeholder="客户姓名（可选，默认散客）"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <TextInput
              style={styles.input}
              placeholder="客户手机号（可选）"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="SN/IMEI（可选）"
              value={sn}
              onChangeText={setSn}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="故障描述 *"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || !description.trim()}
              style={styles.submitBtn}
            >
              创建工单
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  scroll: { paddingBottom: 24 },
  card: { margin: 16 },
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
  submitBtn: { marginTop: 8 },
});
