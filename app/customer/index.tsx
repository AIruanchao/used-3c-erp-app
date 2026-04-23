import React, { useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '../../services/finance-service';
import { SearchBar } from '../../components/common/SearchBar';
import { AmountText } from '../../components/finance/AmountText';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';

export default function CustomerListScreen() {
  const router = useRouter();
  const { storeId } = useAuth();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => getCustomers({ search: search || undefined }),
    enabled: true,
  });

  if (isLoading) return <LoadingScreen />;

  const customers = data?.items ?? [];

  return (
    <View style={styles.container}>
      <SearchBar onSearch={setSearch} placeholder="搜索客户名/手机号..." />
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {customers.length === 0 ? (
          <EmptyState icon="account-group" title="暂无客户" />
        ) : (
          customers.map((customer) => (
            <Card
              key={customer.id}
              style={styles.card}
              mode="outlined"
              onPress={() => router.push(`/customer/${customer.id}` as never)}
            >
              <Card.Content>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.name}>{customer.name}</Text>
                    <Text style={styles.phone}>{customer.phone}</Text>
                  </View>
                  <View style={styles.right}>
                    <Text style={styles.level}>{customer.level}</Text>
                    <AmountText
                      value={customer.lifetimeValue}
                      prefix="LTV: ¥"
                      style={styles.ltv}
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  list: { paddingBottom: 16 },
  card: { marginHorizontal: 16, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#212121' },
  phone: { fontSize: 13, color: '#757575', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  level: { fontSize: 12, color: '#1976d2' },
  ltv: { fontSize: 13, marginTop: 2 },
});
