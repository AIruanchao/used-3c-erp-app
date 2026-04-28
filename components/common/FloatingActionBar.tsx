import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export interface FloatingActionItem {
  key: string;
  label: string;
  onPress: () => void;
}

export function FloatingActionBar(props: { items: FloatingActionItem[] }) {
  const theme = useTheme();
  if (!props.items.length) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      {props.items.map((it, idx) => (
        <TouchableOpacity
          key={it.key}
          style={[styles.item, idx === props.items.length - 1 ? undefined : styles.itemDivider]}
          onPress={it.onPress}
          activeOpacity={0.75}
        >
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>{it.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  item: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(0,0,0,0.10)',
  },
  label: { fontSize: 13, fontWeight: '800' },
});

