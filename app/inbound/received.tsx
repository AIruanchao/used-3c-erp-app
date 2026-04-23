import React from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';

export default function InboundReceivedScreen() {
  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
      contentContainerStyle={styles.list}
    >
      <EmptyState
        icon="package-down"
        title="入库签收记录"
        subtitle="暂无独立API支持签收列表，请前往Web端查看"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 16 },
});
