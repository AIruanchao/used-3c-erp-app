import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { Card, Button, Dialog, Portal } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { REPAIR_STATUS_LABELS } from '../../lib/constants';
import { quoteRepair, startRepair, completeRepair, qcRepair, deliverRepair } from '../../services/repair-service';
import { getErrorMessage as getErr } from '../../lib/errors';

export default function RepairDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    status?: string;
    description?: string;
    sn?: string;
    estimatedCost?: string;
  }>();

  const { id, status, description, sn, estimatedCost } = params;
  const [laborCost, setLaborCost] = useState('');
  const [partName, setPartName] = useState('');
  const [partCost, setPartCost] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);

  const handleAction = async (action: string) => {
    if (!id) return;
    try {
      let result: { ok: boolean };
      switch (action) {
        case 'quote':
          setShowQuoteDialog(true);
          return;
        case 'start':
          result = await startRepair(id);
          Alert.alert('成功', result.ok ? '已开始维修' : '操作失败');
          break;
        case 'complete':
          result = await completeRepair(id);
          Alert.alert('成功', result.ok ? '维修完成' : '操作失败');
          break;
        case 'qc':
          result = await qcRepair(id);
          Alert.alert('成功', result.ok ? '质检通过' : '操作失败');
          break;
        case 'deliver':
          result = await deliverRepair(id);
          Alert.alert('成功', result.ok ? '已交付' : '操作失败');
          break;
      }
    } catch (err) {
      Alert.alert('操作失败', getErr(err));
    }
  };

  const submitQuote = async () => {
    if (!id) return;
    const labor = parseFloat(laborCost);
    if (Number.isNaN(labor) || labor < 0) {
      Alert.alert('提示', '请输入有效的人工费');
      return;
    }

    try {
      await quoteRepair(id, {
        lines: partName ? [{
          type: 'PART',
          sparePartName: partName,
          quantity: 1,
          unitCost: parseFloat(partCost) || 0,
          unitPrice: parseFloat(partPrice) || 0,
        }] : [],
        laborCost: labor,
      });
      setShowQuoteDialog(false);
      Alert.alert('成功', '已报价');
    } catch (err) {
      Alert.alert('报价失败', getErr(err));
    }
  };

  if (!id) {
    return (
      <View style={styles.center}>
        <Text>工单不存在</Text>
      </View>
    );
  }

  const currentStatus = status ?? 'REGISTERED';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.status}>
            {REPAIR_STATUS_LABELS[currentStatus] ?? currentStatus}
          </Text>
          <Text style={styles.desc}>{description ?? '无描述'}</Text>
          {sn && <Text style={styles.sn}>SN: {sn}</Text>}
          <Text style={styles.date}>工单ID: {id}</Text>
          {estimatedCost && (
            <Text style={styles.cost}>估价: ¥{estimatedCost}</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="操作" titleStyle={styles.cardTitle} />
        <Card.Content style={styles.actions}>
          {(currentStatus === 'REGISTERED' || currentStatus === 'DIAGNOSED') && (
            <Button mode="contained" onPress={() => handleAction('quote')}>
              报价
            </Button>
          )}
          {currentStatus === 'QUOTED' && (
            <Button mode="contained" onPress={() => handleAction('start')}>
              接受报价并开始维修
            </Button>
          )}
          {currentStatus === 'IN_REPAIR' && (
            <Button mode="contained" onPress={() => handleAction('complete')}>
              完成维修
            </Button>
          )}
          {currentStatus === 'COMPLETED' && (
            <Button mode="contained" onPress={() => handleAction('qc')}>
              质检通过
            </Button>
          )}
          {currentStatus === 'WAITING_PICKUP' && (
            <Button mode="contained" onPress={() => handleAction('deliver')}>
              安排交付
            </Button>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={showQuoteDialog} onDismiss={() => setShowQuoteDialog(false)}>
          <Dialog.Title>报价</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.quoteInput}
              placeholder="人工费 *"
              value={laborCost}
              onChangeText={setLaborCost}
              keyboardType="decimal-pad"
            />
            <Text style={styles.fieldLabel}>配件信息(可选)</Text>
            <TextInput
              style={styles.quoteInput}
              placeholder="配件名称"
              value={partName}
              onChangeText={setPartName}
            />
            {partName ? (
              <>
                <TextInput
                  style={styles.quoteInput}
                  placeholder="配件成本"
                  value={partCost}
                  onChangeText={setPartCost}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={styles.quoteInput}
                  placeholder="配件报价"
                  value={partPrice}
                  onChangeText={setPartPrice}
                  keyboardType="decimal-pad"
                />
              </>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowQuoteDialog(false)}>取消</Button>
            <Button onPress={submitQuote} disabled={!laborCost}>确认报价</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginHorizontal: 16, marginTop: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  status: { fontSize: 16, fontWeight: 'bold', color: '#1976d2' },
  desc: { fontSize: 15, color: '#212121', marginTop: 8 },
  sn: { fontSize: 14, color: '#757575', fontFamily: 'Courier', marginTop: 4 },
  date: { fontSize: 12, color: '#bdbdbd', marginTop: 4 },
  cost: { fontSize: 14, color: '#616161', marginTop: 4 },
  actions: { gap: 8 },
  quoteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
    marginBottom: 4,
  },
});
