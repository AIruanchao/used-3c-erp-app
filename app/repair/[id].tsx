import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { Card, Button, Dialog, Portal } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { REPAIR_STATUS_LABELS } from '../../lib/constants';
import { quoteRepair, startRepair, completeRepair, qcRepair, deliverRepair, acceptRepairQuote } from '../../services/repair-service';
import { getErrorMessage as getErr } from '../../lib/errors';
import { useAuthStore } from '../../stores/auth-store';

export default function RepairDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    status?: string;
    description?: string;
    sn?: string;
    estimatedCost?: string;
  }>();

  const { id } = params;
  const userId = useAuthStore((s) => s.user?.id);
  const [currentStatus, setCurrentStatus] = useState(params.status ?? 'REGISTERED');
  const [laborCost, setLaborCost] = useState('');
  const [partName, setPartName] = useState('');
  const [partCost, setPartCost] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (action: string) => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      let result: { ok: boolean };
      switch (action) {
        case 'quote':
          setShowQuoteDialog(true);
          return;
        case 'start':
          // If QUOTED, must accept first then start
          if (currentStatus === 'QUOTED') {
            const acceptRes = await acceptRepairQuote(id);
            if (!acceptRes.ok) { Alert.alert('失败', '接受报价失败'); break; }
            setCurrentStatus('ACCEPTED');
          }
          result = await startRepair(id, userId);
          if (result.ok) { Alert.alert('成功', '已开始维修'); setCurrentStatus('IN_REPAIR'); }
          else { Alert.alert('失败', '操作失败'); }
          break;
        case 'complete':
          result = await completeRepair(id);
          if (result.ok) { Alert.alert('成功', '维修完成'); setCurrentStatus('COMPLETED'); }
          else { Alert.alert('失败', '操作失败'); }
          break;
        case 'qc':
          result = await qcRepair(id);
          if (result.ok) { Alert.alert('成功', '质检通过'); setCurrentStatus('WAITING_PICKUP'); }
          else { Alert.alert('失败', '操作失败'); }
          break;
        case 'deliver':
          result = await deliverRepair(id);
          if (result.ok) { Alert.alert('成功', '已安排交付'); setCurrentStatus('DELIVERING'); }
          else { Alert.alert('失败', '操作失败'); }
          break;
      }
    } catch (err) {
      Alert.alert('操作失败', getErr(err));
    } finally {
      setActionLoading(false);
    }
  };

  const submitQuote = async () => {
    if (!id || actionLoading) return;
    const labor = parseFloat(laborCost);
    if (Number.isNaN(labor) || labor < 0) {
      Alert.alert('提示', '请输入有效的人工费');
      return;
    }

    setActionLoading(true);
    try {
      const lines = partName ? [{
        type: 'PART' as const,
        sparePartName: partName,
        quantity: 1,
        unitCost: parseFloat(partCost) || 0,
        unitPrice: parseFloat(partPrice) || 0,
      }] : [];
      const result = await quoteRepair(id, {
        lines,
        laborCost: labor,
      });
      if (!result.ok) {
        Alert.alert('报价失败', '服务器返回失败');
        return;
      }
      setShowQuoteDialog(false);
      setLaborCost('');
      setPartName('');
      setPartCost('');
      setPartPrice('');
      setCurrentStatus('QUOTED');
      Alert.alert('成功', '已报价');
    } catch (err) {
      Alert.alert('报价失败', getErr(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (!id) {
    return (
      <View style={styles.center}>
        <Text>工单不存在</Text>
      </View>
    );
  }

  const description = params.description;
  const sn = params.sn;
  const estimatedCost = params.estimatedCost;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.status}>
            {REPAIR_STATUS_LABELS[currentStatus] ?? currentStatus}
          </Text>
          <Text style={styles.desc}>{description ?? '无描述'}</Text>
          {sn && <Text style={styles.sn} numberOfLines={1}>SN: {sn}</Text>}
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
            <Button mode="contained" onPress={() => handleAction('quote')} loading={actionLoading} disabled={actionLoading}>
              报价
            </Button>
          )}
          {currentStatus === 'QUOTED' && (
            <Button mode="contained" onPress={() => handleAction('start')} loading={actionLoading} disabled={actionLoading}>
              接受报价并开始维修
            </Button>
          )}
          {currentStatus === 'REJECTED' && (
            <Text style={styles.rejectedHint}>客户已拒绝报价，请在Web端处理</Text>
          )}
          {currentStatus === 'ACCEPTED' && (
            <Button mode="contained" onPress={() => handleAction('start')} loading={actionLoading} disabled={actionLoading}>
              开始维修
            </Button>
          )}
          {currentStatus === 'IN_REPAIR' && (
            <Button mode="contained" onPress={() => handleAction('complete')} loading={actionLoading} disabled={actionLoading}>
              完成维修
            </Button>
          )}
          {currentStatus === 'COMPLETED' && (
            <Button mode="contained" onPress={() => handleAction('qc')} loading={actionLoading} disabled={actionLoading}>
              质检通过
            </Button>
          )}
          {currentStatus === 'WAITING_PICKUP' && (
            <Button mode="contained" onPress={() => handleAction('deliver')} loading={actionLoading} disabled={actionLoading}>
              安排交付
            </Button>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={showQuoteDialog} onDismiss={() => { setShowQuoteDialog(false); setLaborCost(''); setPartName(''); setPartCost(''); setPartPrice(''); }}>
          <Dialog.Title>报价</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.quoteInput}
              placeholder="人工费 *"
              value={laborCost}
              onChangeText={setLaborCost}
              keyboardType="decimal-pad"
              returnKeyType="done"
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
                  returnKeyType="done"
                />
                <TextInput
                  style={styles.quoteInput}
                  placeholder="配件报价"
                  value={partPrice}
                  onChangeText={setPartPrice}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setShowQuoteDialog(false); setLaborCost(''); setPartName(''); setPartCost(''); setPartPrice(''); }}>取消</Button>
            <Button onPress={submitQuote} disabled={!laborCost || actionLoading} loading={actionLoading}>确认报价</Button>
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
  rejectedHint: { fontSize: 14, color: '#e53935', textAlign: 'center', paddingVertical: 8 },
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
