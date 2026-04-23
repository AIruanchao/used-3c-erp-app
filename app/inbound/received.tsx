import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';

export default function InboundReceivedScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="package-down"
        title="入库签收记录"
        subtitle="暂无独立API支持签收列表，请前往Web端查看"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
