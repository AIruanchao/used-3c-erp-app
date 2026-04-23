import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, List, Divider } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getCustomerById } from '../../services/finance-service';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { AmountText } from '../../components/finance/AmountText';
import { useAuth } from '../../hooks/useAuth';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { storeId, organizationId } = useAuth();

  const { data: customer, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer', id, storeId, organizationId],
    queryFn: () => getCustomerById(id, organizationId ?? '', storeId ?? ''),
    enabled: !!id && !!storeId && !!organizationId,
  });

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (!customer) return <View style={styles.center}><Text>客户不存在</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.phone}>{customer.phone}</Text>
          <Divider style={styles.divider} />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>等级</Text>
              <Text style={styles.statValue}>{customer.memberLevel ?? customer.tier ?? ''}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>累计消费</Text>
              <AmountText value={customer.lifetimeValue} style={styles.statValue} />
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { margin: 16 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#212121' },
  phone: { fontSize: 16, color: '#757575', marginTop: 4 },
  divider: { marginVertical: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#9e9e9e', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '600' },
});
