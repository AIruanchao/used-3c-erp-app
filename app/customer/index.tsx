import React, { useState, useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, useTheme, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { listCustomers } from '../../services/customer-service';
import { SearchBar } from '../../components/common/SearchBar';
import { AmountText } from '../../components/finance/AmountText';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import type { CustomerListItem } from '../../types/customer';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';

export default function CustomerListScreen() {
  const theme = useTheme();

  const router = useRouter();
  const { storeId, organizationId } = useAuth();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['customers', storeId, organizationId, search],
    queryFn: () =>
      listCustomers({
        storeId: storeId ?? '',
        organizationId: organizationId ?? '',
        keyword: search || undefined,
        pageSize: 30,
        page: 1,
      }),
    enabled: !!storeId && !!organizationId,
  });

  const items: CustomerListItem[] = data?.items ?? [];

  const renderItem = useCallback(
    ({ item: customer }: { item: CustomerListItem }) => (
      <Card
        style={styles.card}
        mode="outlined"
        onPress={() => router.push(`/customer/${customer.id}` as never)}
        accessibilityLabel={customer.name}
      >
        <Card.Content>
          <View style={styles.row}>
            <View>
              <Text style={[styles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>{customer.name}</Text>
              <Text style={[styles.phone, { color: theme.colors.onSurfaceVariant }]}>{customer.phone || '未留电话'}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.level}>{customer.memberLevel ?? customer.tier ?? ''}</Text>
              <AmountText value={customer.lifetimeValue} style={styles.ltv} />
            </View>
          </View>
        </Card.Content>
      </Card>
    ),
    [router],
  );

  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar onSearch={setSearch} placeholder="搜索客户名/手机号..." />
      {items.length === 0 ? (
        <EmptyState icon="account-group" title="暂无客户" />
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      <FAB
        icon="account-plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/customer/new' as never)}
        accessibilityLabel="新建客户"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  listContent: { paddingBottom: 88 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
  card: { marginHorizontal: 16, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#212121' },
  phone: { fontSize: 13, color: '#757575', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  level: { fontSize: 12, color: '#1976d2' },
  ltv: { fontSize: 13, marginTop: 2 },
});
