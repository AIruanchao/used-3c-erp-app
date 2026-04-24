import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { INVENTORY_STATUS_LABELS } from '../../lib/constants';

interface DeviceStatusBadgeProps {
  status: string;
}

interface StatusColor {
  bg: string;
  text: string;
}

const STATUS_COLORS: Record<string, StatusColor> = {
  IN_STOCK: { bg: 'rgba(76,175,80,0.12)', text: '#4caf50' },
  SOLD: { bg: 'rgba(33,150,243,0.12)', text: '#2196f3' },
  RETURNED_OUT: { bg: 'rgba(255,152,0,0.12)', text: '#ff9800' },
};

const DEFAULT_COLORS: StatusColor = { bg: 'rgba(158,158,158,0.12)', text: '#9e9e9e' };

export const DeviceStatusBadge = React.memo(function DeviceStatusBadge({
  status,
}: DeviceStatusBadgeProps) {
  const label = INVENTORY_STATUS_LABELS[status] ?? status;
  const colors = STATUS_COLORS[status] ?? DEFAULT_COLORS;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
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
