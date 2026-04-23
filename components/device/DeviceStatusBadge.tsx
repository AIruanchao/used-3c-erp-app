import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { INVENTORY_STATUS_LABELS } from '../../lib/constants';

interface DeviceStatusBadgeProps {
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  IN_STOCK: '#4caf50',
  SOLD: '#2196f3',
  RETURNED_OUT: '#ff9800',
};

export const DeviceStatusBadge = React.memo(function DeviceStatusBadge({
  status,
}: DeviceStatusBadgeProps) {
  const label = INVENTORY_STATUS_LABELS[status] ?? status;
  const color = STATUS_COLORS[status] ?? '#9e9e9e';

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
