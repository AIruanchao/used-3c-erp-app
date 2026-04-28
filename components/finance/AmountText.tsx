import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useAppStore } from '../../stores/app-store';
import { formatMoney } from '../../lib/money';

interface AmountTextProps {
  value: string | number | null | undefined;
  prefix?: string;
  style?: object;
  colorize?: boolean;
}

export const AmountText = React.memo(function AmountText({
  value,
  prefix = '¥',
  style,
  colorize = false,
}: AmountTextProps) {
  const hideAmounts = useAppStore((s) => s.hideAmounts);
  const display = formatMoney(value, { prefix, hide: hideAmounts });

  const color = colorize
    ? display.startsWith('-')
      ? '#e53935'
      : display.includes('***')
        ? '#757575'
        : display !== `${prefix}0.00`
        ? '#2e7d32'
        : '#757575'
    : undefined;

  return (
    <Text style={[styles.text, color ? { color } : undefined, style]}>
      {display}
    </Text>
  );
});

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
});
