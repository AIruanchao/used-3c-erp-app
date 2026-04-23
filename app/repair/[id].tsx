import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRepairById, quoteRepair, startRepair, completeRepair, qcRepair, deliverRepair } from '../../services/repair-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { AmountText } from '../../components/finance/AmountText';
import { REPAIR_STATUS_LABELS } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import { getErrorMessage as getErr } from '../../lib/errors';

export default function RepairDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: repair, isLoading } = useQuery({
    queryKey: ['repair', id],
    queryFn: () => getRepairById(id),
    enabled: !!id,
  });

  const invalidateRepair = () => {
    queryClient.invalidateQueries({ queryKey: ['repair', id] });
    queryClient.invalidateQueries({ queryKey: ['repairs'] });
  };

  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case 'quote':
          Alert.alert('报价', '请确认估价', [
            { text: '取消', style: 'cancel' },
            { text: '确认报价 ¥100', onPress: async () => {
              await quoteRepair(id, { estimatedCost: 100 });
              invalidateRepair();
            }},
          ]);
          break;
        case 'start':
          await startRepair(id);
          invalidateRepair();
          break;
        case 'complete':
          await completeRepair(id);
          invalidateRepair();
          break;
        case 'qc':
          await qcRepair(id);
          invalidateRepair();
          break;
        case 'deliver':
          await deliverRepair(id);
          invalidateRepair();
          Alert.alert('成功', '已交付');
          break;
      }
    } catch (err) {
      Alert.alert('操作失败', getErr(err));
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (!repair) return <View style={styles.center}><Text>工单不存在</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.status}>
            {REPAIR_STATUS_LABELS[repair.status] ?? repair.status}
          </Text>
          <Text style={styles.desc}>{repair.description}</Text>
          {repair.sn && <Text style={styles.sn}>SN: {repair.sn}</Text>}
          <Text style={styles.date}>
            创建: {formatDate(repair.createdAt, 'YYYY-MM-DD HH:mm')}
          </Text>
        </Card.Content>
      </Card>

      {repair.estimatedCost && (
        <Card style={styles.card}>
          <Card.Title title="费用" titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>估价</Text>
              <AmountText value={repair.estimatedCost} />
            </View>
            {repair.actualCost && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>实际</Text>
                <AmountText value={repair.actualCost} colorize />
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {repair.Customer && (
        <Card style={styles.card}>
          <Card.Title title="客户" titleStyle={styles.cardTitle} />
          <Card.Content>
            <Text>{repair.Customer.name}</Text>
            <Text style={styles.phone}>{repair.Customer.phone}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Status Actions */}
      <Card style={styles.card}>
        <Card.Title title="操作" titleStyle={styles.cardTitle} />
        <Card.Content style={styles.actions}>
          {repair.status === 'PENDING' && (
            <Button mode="contained" onPress={() => handleAction('quote')}>
              报价
            </Button>
          )}
          {repair.status === 'QUOTED' && (
            <Button mode="contained" onPress={() => handleAction('start')}>
              开始维修
            </Button>
          )}
          {repair.status === 'IN_PROGRESS' && (
            <Button mode="contained" onPress={() => handleAction('complete')}>
              完成维修
            </Button>
          )}
          {repair.status === 'COMPLETED' && (
            <Button mode="contained" onPress={() => handleAction('qc')}>
              质检通过
            </Button>
          )}
          {repair.status === 'QC' && (
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
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  costLabel: { fontSize: 14, color: '#757575' },
  phone: { fontSize: 14, color: '#757575', marginTop: 2 },
  actions: { gap: 8 },
});
