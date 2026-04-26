import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { DeviceStatusBadge } from './DeviceStatusBadge';
import { AmountText } from '../finance/AmountText';
import { formatDate } from '../../lib/utils';
import type { Device } from '../../types/device';

interface DeviceCardProps {
  device: Device;
  onPress: (id: string) => void;
}

export const DeviceCard = React.memo(function DeviceCard({
  device,
  onPress,
}: DeviceCardProps) {
  const theme = useTheme();
  const skuName = device.Sku?.name ?? device.Sku?.Model?.name ?? '未知型号';
  const brandName = device.Sku?.Model?.Brand?.name ?? '';

  return (
    <TouchableOpacity onPress={() => onPress(device.id)} activeOpacity={0.7} accessibilityLabel={skuName}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[styles.brandText, { color: theme.colors.onSurfaceVariant }]}>
                {brandName}
              </Text>
              <Text style={[styles.skuName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {skuName}
              </Text>
            </View>
            <DeviceStatusBadge status={device.inventoryStatus} />
          </View>
          <View style={styles.details}>
            <Text style={[styles.sn, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>SN: {device.sn}</Text>
            {device.DevicePricing && (
              <View style={styles.priceRow}>
                {device.DevicePricing.retailPrice && (
                  <AmountText
                    value={device.DevicePricing.retailPrice}
                    prefix="零售: ¥"
                    style={styles.price}
                  />
                )}
                {device.DevicePricing.unitCost && (
                  <AmountText
                    value={device.DevicePricing.unitCost}
                    prefix="成本: ¥"
                    style={styles.price}
                  />
                )}
              </View>
            )}
            {device.inboundAt && (
              <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                入库: {formatDate(device.inboundAt)}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flex: 1,
    marginRight: 8,
  },
  brandText: {
    fontSize: 12,
  },
  skuName: {
    fontSize: 15,
    fontWeight: '600',
  },
  details: {
    marginTop: 8,
  },
  sn: {
    fontSize: 13,
    fontFamily: 'Courier',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  price: {
    fontSize: 13,
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
});
