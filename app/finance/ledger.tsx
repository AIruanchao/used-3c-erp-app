import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { SegmentedButtons, Card, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { getLedgerEntries } from '../../services/finance-service';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { FlashList } from '../../components/ui/TypedFlashList';
import { AmountText } from '../../components/finance/AmountText';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { LEDGER_TYPE_LABELS } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import type { LedgerEntry } from '../../types/finance';

type LedgerParams = {
  storeId?: string;
  organizationId?: string;
  type?: string;
};

export default function LedgerScreen() {
  const { storeId, organizationId } = useAuth();
  const [typeFilter, setTypeFilter] = useState('');

  const params = useMemo<LedgerParams>(
    () => ({
      storeId: storeId ?? undefined,
      organizationId: organizationId ?? undefined,
      type: typeFilter || undefined,
    }),
    [storeId, organizationId, typeFilter],
  );

  const { items, isLoading, isRefreshing, isFetchingNextPage, loadMore, refresh } =
    usePaginatedList<LedgerEntry, LedgerParams>({
      queryKey: ['ledger', storeId, typeFilter],
      queryFn: getLedgerEntries,
      params,
      enabled: !!storeId,
    });

  const renderItem = useCallback(({ item: entry }: { item: LedgerEntry }) => {
    const typeLabel = LEDGER_TYPE_LABELS[entry.type] ?? entry.type;

    return (
      <Card style={styles.entryCard} mode="outlined">
        <Card.Content style={styles.entryContent}>
          <View style={styles.entryLeft}>
            <Text style={styles.entryType}>{typeLabel}</Text>
            <Text style={styles.entryDesc} numberOfLines={1}>
              {entry.description}
            </Text>
            <Text style={styles.entryDate}>
              {formatDate(entry.createdAt, 'MM-DD HH:mm')}
            </Text>
          </View>
          <AmountText
            value={entry.amount}
            showSign
            colorize
            style={styles.entryAmount}
          />
        </Card.Content>
      </Card>
    );
  }, []);

  const keyExtractor = useCallback((item: LedgerEntry) => item.id, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={typeFilter}
        onValueChange={setTypeFilter}
        buttons={[
          { value: '', label: '全部' },
          { value: 'SALE_INCOME', label: '收入' },
          { value: 'PURCHASE_COST', label: '支出' },
        ]}
        style={styles.filter}
      />

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
        ListEmptyComponent={<EmptyState icon="receipt" title="暂无记录" />}
        ListFooterComponent={
          isFetchingNextPage ? <LoadingScreen message="加载更多..." /> : null
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  filter: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  entryCard: {
    marginHorizontal: 16,
    marginVertical: 2,
  },
  entryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryLeft: {
    flex: 1,
  },
  entryType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  entryDesc: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  entryDate: {
    fontSize: 11,
    color: '#bdbdbd',
    marginTop: 2,
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
