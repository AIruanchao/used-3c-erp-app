import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

type Variant = 'default' | 'success' | 'warning' | 'error';

function colors(variant: Variant): { bg: string; fg: string } {
  if (variant === 'success') return { bg: '#E8F5E9', fg: '#43A047' };
  if (variant === 'warning') return { bg: '#FFF8E1', fg: '#8D6E00' };
  if (variant === 'error') return { bg: '#FFEBEE', fg: '#E53935' };
  return { bg: '#F5F5F5', fg: '#616161' };
}

export function StatusBadge(props: { status: string; variant?: Variant }) {
  const v = props.variant ?? 'default';
  const c = colors(v);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]} numberOfLines={1}>
        {props.status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '800' },
});

