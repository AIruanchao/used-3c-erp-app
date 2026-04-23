import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';

interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const QueryError = React.memo(function QueryError({
  message = '加载失败',
  onRetry,
}: QueryErrorProps) {
  return (
    <View style={styles.container}>
      <IconButton icon="alert-circle-outline" size={64} iconColor="#e53935" />
      <Text style={styles.title}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryText}>点击重试</Text>
        </TouchableOpacity>
      ) : null}
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
    fontSize: 15,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#1976d2',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
