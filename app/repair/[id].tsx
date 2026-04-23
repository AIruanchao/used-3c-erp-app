import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { REPAIR_STATUS_LABELS } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import { quoteRepair, startRepair, completeRepair, qcRepair, deliverRepair } from '../../services/repair-service';
import { getErrorMessage as getErr } from '../../lib/errors';

/**
 * Repair detail screen.
 * Note: The backend doesn't have a GET /api/repair/[id] endpoint.
 * Repair details are passed via router params when navigating from the create result.
 */
export default function RepairDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    status?: string;
    description?: string;
    sn?: string;
    estimatedCost?: string;
  }>();
  const router = useRouter();

  const { id, status, description, sn, estimatedCost } = params;

  const handleAction = async (action: string) => {
    try {
      let result: { ok: boolean };
      switch (action) {
        case 'quote':
          Alert.alert('报价', '请确认估价 ¥100', [
            { text: '取消', style: 'cancel' },
            { text: '确认报价', onPress: async () => {
              await quoteRepair(id, { estimatedCost: 100 });
              Alert.alert('成功', '已报价');
            }},
          ]);
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
          {(currentStatus === 'REGISTERED' || currentStatus === 'PENDING') && (
            <Button mode="contained" onPress={() => handleAction('quote')}>
              报价
            </Button>
          )}
          {currentStatus === 'QUOTED' && (
            <Button mode="contained" onPress={() => handleAction('start')}>
              开始维修
            </Button>
          )}
          {currentStatus === 'IN_PROGRESS' && (
            <Button mode="contained" onPress={() => handleAction('complete')}>
              完成维修
            </Button>
          )}
          {currentStatus === 'COMPLETED' && (
            <Button mode="contained" onPress={() => handleAction('qc')}>
              质检通过
            </Button>
          )}
          {currentStatus === 'QC' && (
            <Button mode="contained" onPress={() => handleAction('deliver')}>
              交付
            </Button>
          )}
        </Card.Content>
      </Card>
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
});
