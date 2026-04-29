import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { Button, Card, TextInput, Text, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BarcodeScannerView } from '../../components/scanner/BarcodeScannerView';
import { checkWarranty, type WarrantyResult } from '../../services/warranty-service';
import { formatDate } from '../../lib/utils';
import { BRAND_COLOR } from '../../lib/theme';

function repairStatusLabel(status: string): string {
  const m: Record<string, string> = {
    REGISTERED: '已登记',
    IN_PROGRESS: '维修中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    WAITING_PICKUP: '待取机',
    DELIVERING: '交付中',
  };
  return m[status] ?? status;
}

export default function WarrantyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [sn, setSn] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WarrantyResult | null>(null);
  const [scan, setScan] = useState(false);

  const runSearch = useCallback(async () => {
    const q = sn.trim();
    if (!q) {
      Alert.alert('提示', '请输入 IMEI / SN');
      return;
    }
    setLoading(true);
    try {
      const r = await checkWarranty(q);
      setResult(r);
    } catch (e) {
      Alert.alert('查询失败', e instanceof Error ? e.message : '');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [sn]);

  const goRepair = useCallback(() => {
    if (!result?.found || !sn.trim()) return;
    router.push(`/repair/new?sn=${encodeURIComponent(sn.trim())}` as never);
  }, [result?.found, router, sn]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <PageHeader title="质保查询" showBack />
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.row}>
          <TextInput
            mode="outlined"
            label="IMEI / SN"
            value={sn}
            onChangeText={setSn}
            style={{ flex: 1 }}
            onSubmitEditing={() => void runSearch()}
          />
          <Button mode="contained-tonal" icon="barcode-scan" onPress={() => setScan(true)} style={{ marginLeft: 8 }}>
            扫码
          </Button>
        </View>
        <Button mode="contained" onPress={() => void runSearch()} loading={loading} style={{ marginTop: 8 }}>
          查询
        </Button>

        {loading ? <ActivityIndicator style={{ marginTop: 24 }} /> : null}

        {!loading && result && !result.found ? (
          <EmptyState icon="shield-off" title="未找到该设备，请确认 IMEI/SN 是否正确" />
        ) : null}

        {!loading && result?.found ? (
          <>
            <Card style={styles.card}>
              <Card.Title title="保修信息" />
              <Card.Content>
                <Text style={{ color: result.isInWarranty ? BRAND_COLOR : theme.colors.error }}>
                  {result.warrantyLabel ?? '—'}
                </Text>
                <Text style={{ marginTop: 8 }}>类型 {result.warrantyTypeLabel ?? '—'}</Text>
                <Text style={{ marginTop: 4 }}>
                  起止{' '}
                  {result.warrantyStartDate ? formatDate(result.warrantyStartDate) : '—'} ~{' '}
                  {result.warrantyEndDate ? formatDate(result.warrantyEndDate) : '—'}
                </Text>
                <Text style={{ marginTop: 4 }}>天数 {result.warrantyDays ?? '—'} 天</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title="维修记录" />
              <Card.Content>
                {result.repairHistory?.length ? (
                  result.repairHistory.map((h) => (
                    <View key={h.id} style={{ marginBottom: 12 }}>
                      <Text style={{ fontWeight: '600' }}>{h.orderNo}</Text>
                      <StatusBadge status={repairStatusLabel(h.status)} />
                      <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        {formatDate(h.createdAt)}
                        {h.completedAt ? ` · 完工 ${formatDate(h.completedAt)}` : ''}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>无维修记录</Text>
                )}
              </Card.Content>
            </Card>

            <Button mode="contained" icon="wrench" onPress={goRepair} style={{ marginTop: 8 }}>
              创建维修单
            </Button>
            <Button mode="outlined" onPress={() => Alert.alert('提示', '打印功能开发中')} style={{ marginTop: 8 }}>
              打印保修凭证
            </Button>
          </>
        ) : null}
      </ScrollView>

      <Modal visible={scan} animationType="slide" onRequestClose={() => setScan(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <IconButton
            icon="close"
            iconColor="#fff"
            style={{ position: 'absolute', top: 48, right: 8, zIndex: 10 }}
            onPress={() => setScan(false)}
          />
          <BarcodeScannerView
            isActive={scan}
            onBarcodeScanned={(code) => {
              setSn(code);
              setScan(false);
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { marginTop: 16 },
});
