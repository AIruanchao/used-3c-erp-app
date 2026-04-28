import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  color?: string;
  compact?: boolean;
}

export const StatsCard = React.memo(function StatsCard({
  value,
  label,
  icon,
  trend,
  trendValue,
  color,
  compact = false,
}: StatsCardProps) {
  const trendColor =
    trend === 'up' ? '#43A047' : trend === 'down' ? '#E53935' : '#9E9E9E';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text
        style={[
          styles.value,
          compact ? styles.valueCompact : styles.valueDefault,
          color ? { color } : undefined,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {trend && trendValue && (
        <Text style={[styles.trend, { color: trendColor }]}>
          {trendIcon} {trendValue}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardCompact: {
    padding: 12,
  },
  iconWrap: {
    marginBottom: 4,
  },
  valueDefault: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
  },
  valueCompact: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  value: {},
  label: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  trend: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
});
