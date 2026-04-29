import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BRAND_COLOR } from '../../lib/theme';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  color?: string;
}

export const FilterChip = React.memo(function FilterChip({
  label,
  active,
  onPress,
  onRemove,
  color = BRAND_COLOR,
}: FilterChipProps) {
  const handlePress = useCallback(() => {
    if (active && onRemove) {
      onRemove();
    } else if (onPress) {
      onPress();
    }
  }, [active, onPress, onRemove]);

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: active ? color : '#FFFFFF',
          borderColor: active ? color : '#E0E0E0',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.label,
          { color: active ? '#333333' : '#757575' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {active && onRemove && (
        <Text style={[styles.remove, { color: '#333333' }]}> ×</Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  remove: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 2,
  },
});
