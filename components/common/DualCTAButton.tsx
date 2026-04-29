import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BRAND_COLOR, BRAND_TEXT_ON_BRAND_LIGHT } from '../../lib/theme';

type LeftVariant = 'red' | 'dark' | 'outlined';
type RightVariant = 'orange' | 'primary' | 'outlined';

interface DualCTAButtonProps {
  leftLabel: string;
  leftSubLabel?: string;
  leftOnPress: () => void;
  leftVariant?: LeftVariant;
  rightLabel: string;
  rightSubLabel?: string;
  rightOnPress: () => void;
  rightVariant?: RightVariant;
}

const LEFT_COLORS: Record<LeftVariant, { bg: string; text: string }> = {
  red: { bg: '#E53935', text: '#FFFFFF' },
  dark: { bg: '#212121', text: '#FFFFFF' },
  outlined: { bg: 'transparent', text: '#757575' },
};

const RIGHT_COLORS: Record<RightVariant, { bg: string; text: string; border?: string }> = {
  orange: { bg: '#FF9800', text: '#FFFFFF' },
  primary: { bg: BRAND_COLOR, text: BRAND_TEXT_ON_BRAND_LIGHT },
  outlined: { bg: 'transparent', text: '#757575', border: '#E0E0E0' },
};

export const DualCTAButton = React.memo(function DualCTAButton({
  leftLabel,
  leftSubLabel,
  leftOnPress,
  leftVariant = 'dark',
  rightLabel,
  rightSubLabel,
  rightOnPress,
  rightVariant = 'primary',
}: DualCTAButtonProps) {
  const leftStyle = LEFT_COLORS[leftVariant];
  const rightStyle = RIGHT_COLORS[rightVariant];

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: leftStyle.bg,
            borderWidth: leftVariant === 'outlined' ? 1 : 0,
            borderColor: '#E0E0E0',
          },
        ]}
        onPress={leftOnPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.mainLabel, { color: leftStyle.text }]}>
          {leftLabel}
        </Text>
        {leftSubLabel && (
          <Text style={[styles.subLabel, { color: leftStyle.text }]}>
            {leftSubLabel}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: rightStyle.bg,
            borderWidth: rightVariant === 'outlined' ? 1 : 0,
            borderColor: rightStyle.border ?? 'transparent',
          },
        ]}
        onPress={rightOnPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.mainLabel, { color: rightStyle.text }]}>
          {rightLabel}
        </Text>
        {rightSubLabel && (
          <Text style={[styles.subLabel, { color: rightStyle.text }]}>
            {rightSubLabel}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  subLabel: {
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
  },
});
