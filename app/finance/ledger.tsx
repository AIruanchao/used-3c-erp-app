import React, { useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SegmentedButtons, Card } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getLedgerEntries } from '../../services/finance-service';
import { SearchBar } from '../../components/common/SearchBar';
import { AmountText } from '../../components/finance/AmountText';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { LEDGER_TYPE_LABELS } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import type { LedgerEntry } from '../../types/finance';

export default function LedgerScreen() {
  const { storeId, organizationId } = useAuth();
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ledger', storeId, typeFilter],
    queryFn: () =>
      getLedgerEntries({
        storeId: storeId ?? undefined,
        organizationId: organizationId ?? undefined,
        type: typeFilter || undefined,
      }),
    enabled: !!storeId,
  });

  if (isLoading) return <LoadingScreen />;

  const entries = data?.items ?? [];

  const renderEntry = (entry: LedgerEntry) => {
    const amount = parseFloat(entry.amount);
    const isExpense = amount < 0;
    const typeLabel = LEDGER_TYPE_LABELS[entry.type] ?? entry.type;

    return (
      <Card key={entry.id} style={styles.entryCard} mode="outlined">
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
  };

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

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {entries.length === 0 ? (
          <EmptyState icon="receipt" title="暂无记录" />
        ) : (
          entries.map(renderEntry)
        )}
      </ScrollView>
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
  list: {
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
