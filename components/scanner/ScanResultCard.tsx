import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import { formatDate } from '../../lib/utils';

interface ScanResultCardProps {
  code: string;
  format: string;
  timestamp: number;
  synced: boolean;
  onPress?: () => void;
}

export const ScanResultCard = React.memo(function ScanResultCard({
  code,
  format,
  timestamp,
  synced,
  onPress,
}: ScanResultCardProps) {
  return (
    <Card style={styles.card} mode="outlined" onPress={onPress} accessibilityLabel={code}>
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <IconButton
            icon="barcode-scan"
            size={20}
            iconColor="#1976d2"
          />
          <View style={styles.info}>
            <Text style={styles.code} numberOfLines={1}>
              {code}
            </Text>
            <Text style={styles.meta}>
              {format} · {formatDate(new Date(timestamp), 'MM-DD HH:mm')}
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: synced ? '#4caf50' : '#ff9800' },
            ]}
          />
        </View>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 2,
  },
  content: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 4,
  },
  code: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
  },
  meta: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
