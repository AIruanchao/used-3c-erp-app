import React, { useState, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Card, SegmentedButtons, FAB, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { createRepair, type RepairItem } from '../../services/repair-service';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { REPAIR_STATUS_LABELS } from '../../lib/constants';

export default function RepairListScreen() {
  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

  // Note: Backend doesn't have a GET list endpoint for repairs.
  // Repairs are rendered via server components in the web app.
  // The RN app can create new repairs and view details by ID.
  // For now, show a placeholder with a link to create new.

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
      >
        <EmptyState
          icon="wrench"
          title="维修工单"
          subtitle="后端暂无列表API。请点击右下角+创建新工单"
        />
      </ScrollView>

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
