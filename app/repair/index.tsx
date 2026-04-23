import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { EmptyState } from '../../components/common/EmptyState';

export default function RepairListScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <EmptyState
        icon="wrench"
        title="维修工单"
        subtitle="后端暂无列表API。请点击右下角+创建新工单"
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/repair/new' as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  listContent: { paddingBottom: 80 },
  fab: { position: 'absolute', bottom: 16, right: 16 },
});
