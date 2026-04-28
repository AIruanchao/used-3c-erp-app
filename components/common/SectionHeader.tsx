import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onActionPress?: () => void;
}

export const SectionHeader = React.memo(function SectionHeader({
  title,
  action,
  onActionPress,
}: SectionHeaderProps) {
  const handlePress = useCallback(() => {
    onActionPress?.();
  }, [onActionPress]);

  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {action && onActionPress && (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  action: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '500',
  },
});
