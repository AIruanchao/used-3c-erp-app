import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { decStr } from '../../lib/utils';

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
  const strVal = decStr(value);
  const num = parseFloat(strVal);
  const isNegative = num < 0;
  const absStr = Math.abs(num).toFixed(2);
  const formatted = absStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  let display = `${prefix}${formatted}`;
  if (isNegative) {
    display = `-${prefix}${formatted}`;
  }

  const color = colorize
    ? isNegative
      ? '#e53935'
      : num > 0
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
