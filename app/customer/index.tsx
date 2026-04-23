import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '../../components/ui/TypedFlashList';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getCustomers } from '../../services/finance-service';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { SearchBar } from '../../components/common/SearchBar';
import { AmountText } from '../../components/finance/AmountText';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import type { CustomerItem } from '../../types/finance';

type CustomerParams = { search?: string };

export default function CustomerListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const params = useMemo<CustomerParams>(
    () => ({ search: search || undefined }),
    [search],
  );

  const { items, isLoading, isRefreshing, isFetchingNextPage, loadMore, refresh } =
    usePaginatedList<CustomerItem, CustomerParams>({
      queryKey: ['customers', search],
      queryFn: getCustomers,
      params,
    });

  const renderItem = useCallback(
    ({ item: customer }: { item: CustomerItem }) => (
      <Card
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
              <AmountText value={customer.lifetimeValue} style={styles.ltv} />
            </View>
          </View>
        </Card.Content>
      </Card>
    ),
    [router],
  );

  const keyExtractor = useCallback((item: CustomerItem) => item.id, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <SearchBar onSearch={setSearch} placeholder="搜索客户名/手机号..." />
      <FlashList
        data={items}
        renderItem={renderItem}
        estimatedItemSize={72}
        keyExtractor={keyExtractor}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        ListEmptyComponent={<EmptyState icon="account-group" title="暂无客户" />}
        ListFooterComponent={
          isFetchingNextPage ? <LoadingScreen message="加载更多..." /> : null
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  listContent: { paddingBottom: 16 },
  card: { marginHorizontal: 16, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#212121' },
  phone: { fontSize: 13, color: '#757575', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  level: { fontSize: 12, color: '#1976d2' },
  ltv: { fontSize: 13, marginTop: 2 },
});
