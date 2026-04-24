import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, List, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getDeviceById } from '../../services/device-service';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { DeviceStatusBadge } from '../../components/device/DeviceStatusBadge';
import { AmountText } from '../../components/finance/AmountText';
import { formatDate } from '../../lib/utils';
import { printerService } from '../../services/printer-service';

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { organizationId, storeName, user } = useAuth();
  const [printing, setPrinting] = useState(false);

  const { data: device, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['device', id, organizationId],
    queryFn: () => getDeviceById(id, organizationId ?? ''),
    enabled: !!id && !!organizationId,
  });

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (!device) {
    return (
      <View style={styles.error}>
        <Text>设备不存在</Text>
      </View>
    );
  }

  const skuName = device.Sku?.name ?? device.Sku?.Model?.name ?? '未知型号';
  const brandName = device.Sku?.Model?.Brand?.name ?? '';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Header */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.brand}>{brandName}</Text>
              <Text style={styles.model}>{skuName}</Text>
              <Text style={styles.sn} numberOfLines={1}>SN: {device.sn}</Text>
            </View>
            <DeviceStatusBadge status={device.inventoryStatus} />
          </View>
        </Card.Content>
      </Card>

      {/* Pricing */}
      {device.DevicePricing && (
        <Card style={styles.card}>
          <Card.Title title="定价信息" titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.priceGrid}>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>成本价</Text>
                <AmountText
                  value={device.DevicePricing.unitCost}
                  style={styles.priceValue}
                />
              </View>
              {device.DevicePricing.peerPrice && (
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>同行价</Text>
                  <AmountText
                    value={device.DevicePricing.peerPrice}
                    style={styles.priceValue}
                  />
                </View>
              )}
              {device.DevicePricing.retailPrice && (
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>零售价</Text>
                  <AmountText
                    value={device.DevicePricing.retailPrice}
                    style={styles.priceValue}
                  />
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Specs */}
      {device.DeviceSpec && (
        <Card style={styles.card}>
          <Card.Title title="规格信息" titleStyle={styles.cardTitle} />
          <Card.Content>
            {device.DeviceSpec.condition && (
              <List.Item title="成色" description={device.DeviceSpec.condition} />
            )}
            {device.DeviceSpec.channel && (
              <List.Item title="渠道" description={device.DeviceSpec.channel} />
            )}
            {device.DeviceSpec.systemVersion && (
              <List.Item
                title="系统版本"
                description={device.DeviceSpec.systemVersion}
              />
            )}
            <List.Item
              title="锁状态"
              description={device.DeviceSpec.lockStatus}
            />
          </Card.Content>
        </Card>
      )}

      {/* Other Info */}
      <Card style={styles.card}>
        <Card.Title title="其他信息" titleStyle={styles.cardTitle} />
        <Card.Content>
          {device.inboundAt && (
            <List.Item
              title="入库时间"
              description={formatDate(device.inboundAt, 'YYYY-MM-DD HH:mm')}
            />
          )}
          {device.batteryHealthPercent && (
            <List.Item
              title="电池健康"
              description={`${device.batteryHealthPercent}%`}
            />
          )}
          {device.warrantyDays && (
            <List.Item
              title="保修天数"
              description={`${device.warrantyDays}天`}
            />
          )}
        </Card.Content>
      </Card>

      {/* Actions */}
      {device.inventoryStatus === 'IN_STOCK' && (
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="cash-register"
            onPress={() =>
              router.push({
                pathname: '/cashier',
                params: { deviceId: device.id, deviceSn: device.sn, salePrice: device.DevicePricing?.retailPrice ?? '' },
              } as never)
            }
            style={styles.actionBtn}
            accessibilityLabel="前往收银"
          >
            前往收银
          </Button>
          <Button
            mode="outlined"
            icon="printer"
            loading={printing}
            disabled={printing}
            onPress={async () => {
              if (printing) return;
              setPrinting(true);
              try {
                const ok = await printerService.printInboundReceipt({
                  sn: device.sn,
                  skuName: device.Sku?.name ?? '未知',
                  unitCost: device.DevicePricing?.unitCost || '0',
                  storeName: storeName ?? device.Store?.name ?? '未知门店',
                  operatorName: user?.name ?? '未知操作员',
                  date: formatDate(new Date().toISOString()),
                });
                if (!ok) {
                  Alert.alert('打印失败', '请检查打印机连接');
                } else {
                  Alert.alert('成功', '入库单已打印');
                }
              } catch (err) {
                Alert.alert('打印失败', err instanceof Error ? err.message : '请检查打印机连接');
              } finally {
                setPrinting(false);
              }
            }}
            style={styles.actionBtn}
            accessibilityLabel="打印标签"
          >
            打印标签
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  brand: {
    fontSize: 13,
    color: '#9e9e9e',
  },
  model: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 2,
  },
  sn: {
    fontSize: 14,
    color: '#616161',
    fontFamily: 'Courier',
    marginTop: 4,
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  priceItem: {
    flex: 1,
    minWidth: 80,
  },
  priceLabel: {
    fontSize: 12,
    color: '#9e9e9e',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    padding: 16,
  },
  actionBtn: {
    marginBottom: 8,
  },
});
