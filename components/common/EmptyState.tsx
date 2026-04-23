import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export const EmptyState = React.memo(function EmptyState({
  icon = 'package-variant',
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <IconButton icon={icon} size={64} iconColor="#9e9e9e" />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9e9e9e',
    marginTop: 4,
    textAlign: 'center',
  },
});
