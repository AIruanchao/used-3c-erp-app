import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Card, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { createRepair } from '../../services/repair-service';
import { getErrorMessage } from '../../lib/errors';

export default function NewRepairScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [sn, setSn] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
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
      await createRepair({
        storeId,
        organizationId,
        sn: sn.trim() || undefined,
        description: description.trim(),
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      });
      Alert.alert('成功', '维修工单已创建', [
        { text: '查看列表', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('创建失败', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [storeId, organizationId, sn, description, estimatedCost, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              style={styles.input}
              placeholder="SN/IMEI（可选）"
              value={sn}
              onChangeText={setSn}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="故障描述 *"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
            <TextInput
              style={styles.input}
              placeholder="预估费用（可选）"
              value={estimatedCost}
              onChangeText={setEstimatedCost}
              keyboardType="decimal-pad"
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
