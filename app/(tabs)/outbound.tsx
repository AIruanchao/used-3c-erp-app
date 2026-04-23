import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getInventory } from '../../services/inventory-service';
import { getDevices } from '../../services/device-service';
import { SearchBar } from '../../components/common/SearchBar';
import { DeviceCard } from '../../components/device/DeviceCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { BarcodeScannerView } from '../../components/scanner/BarcodeScannerView';
import { cashierCheckout } from '../../services/cashier-service';
import { getErrorMessage } from '../../lib/errors';
import { INVENTORY_STATUS_LABELS } from '../../lib/constants';

export default function OutboundScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [filterStatus, setFilterStatus] = useState('IN_STOCK');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['outboundDevices', storeId, search, filterStatus],
    queryFn: () =>
      getDevices({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
        inventoryStatus: filterStatus,
        search: search || undefined,
      }),
    enabled: !!storeId && !!organizationId,
  });

  const handleDevicePress = useCallback(
    (id: string) => {
      router.push(`/device/${id}` as never);
    },
    [router],
  );

  const handleSale = useCallback(
    async (deviceId: string, salePrice: number) => {
      if (!storeId || !organizationId) return;
      try {
        await cashierCheckout({
          storeId,
          organizationId,
          deviceId,
          salePrice,
          Payment: [{ method: 'CASH', amount: salePrice }],
        });
        Alert.alert('出库成功', '设备已成功出售');
        refetch();
      } catch (err) {
        Alert.alert('出库失败', getErrorMessage(err));
      }
    },
    [storeId, organizationId, refetch],
  );

  if (isLoading) return <LoadingScreen />;

  const devices = data?.items ?? [];

  return (
    <View style={styles.container}>
      <SearchBar onSearch={setSearch} placeholder="搜索SN/型号..." />

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {devices.length === 0 ? (
          <EmptyState
            icon="package-up"
            title="暂无在库设备"
            subtitle="入库设备后会显示在这里"
          />
        ) : (
          devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onPress={handleDevicePress}
            />
          ))
        )}
      </ScrollView>

      <Button
        mode="contained"
        icon="barcode-scan"
        onPress={() => setShowScanner(true)}
        style={styles.scanBtn}
      >
        扫码出库
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  list: {
    paddingBottom: 80,
  },
  scanBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 24,
  },
});
