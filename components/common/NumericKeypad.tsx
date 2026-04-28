import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

function clampMoneyInput(next: string): string {
  // Keep only digits and dot; ensure max 2 decimals and single dot.
  const cleaned = next.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const intPart = (parts[0] ?? '').replace(/^0+(?=\d)/, '');
  const decPart = (parts[1] ?? '').slice(0, 2);
  if (parts.length <= 1) return intPart;
  return `${intPart || '0'}.${decPart}`;
}

export function NumericKeypad(props: {
  value: string;
  onChange: (v: string) => void;
}) {
  const theme = useTheme();

  const press = useCallback(
    (k: string) => {
      if (k === 'DEL') {
        props.onChange(props.value.slice(0, -1));
        return;
      }
      if (k === 'CLR') {
        props.onChange('');
        return;
      }
      const next = clampMoneyInput(`${props.value}${k}`);
      props.onChange(next);
    },
    [props],
  );

  const keys: Array<{ k: string; label: string }> = [
    { k: '1', label: '1' },
    { k: '2', label: '2' },
    { k: '3', label: '3' },
    { k: '4', label: '4' },
    { k: '5', label: '5' },
    { k: '6', label: '6' },
    { k: '7', label: '7' },
    { k: '8', label: '8' },
    { k: '9', label: '9' },
    { k: '.', label: '.' },
    { k: '0', label: '0' },
    { k: 'DEL', label: '⌫' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.grid}>
        {keys.map((x) => (
          <TouchableOpacity
            key={x.k}
            onPress={() => press(x.k)}
            activeOpacity={0.75}
            style={[styles.key, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
          >
            <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>{x.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        onPress={() => press('CLR')}
        activeOpacity={0.75}
        style={[styles.clear, { borderColor: theme.colors.outlineVariant }]}
      >
        <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: '800' }}>清空</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  key: {
    width: '30%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 18, fontWeight: '800' },
  clear: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

