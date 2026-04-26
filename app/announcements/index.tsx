import React, { useCallback } from 'react';
import { View, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Text, useTheme, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '../../components/ui/TypedFlashList';
import { getAnnouncements } from '../../services/announcement-service';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState } from '../../components/common/EmptyState';
import { QueryError } from '../../components/common/QueryError';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { formatDate, truncate } from '../../lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Announcement, AnnouncementType } from '../../types/announcement';
import type { MD3Theme } from 'react-native-paper';

function typeColor(theme: MD3Theme, t: AnnouncementType): string {
  switch (t) {
    case 'INFO':
      return theme.colors.primary;
    case 'WARNING':
      return theme.colors.tertiary ?? '#f9a825';
    case 'URGENT':
      return theme.colors.error;
    case 'SYSTEM':
    default:
      return theme.colors.outline;
  }
}

export default function AnnouncementsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organizationId, storeId } = useAuth();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['announcements', organizationId, storeId],
    queryFn: () => getAnnouncements({ organizationId: organizationId ?? '', storeId: storeId ?? undefined }),
    enabled: !!organizationId,
  });

  const items = data?.items ?? [];

  const renderItem = useCallback(
    ({ item }: { item: Announcement }) => (
      <Pressable onPress={() => router.push(`/announcements/${item.id}` as never)}>
        <Card
          style={[
            styles.card,
            { backgroundColor: item.isPinned ? theme.colors.secondaryContainer : theme.colors.surface },
          ]}
          mode="outlined"
        >
          <Card.Content>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={2}>
              {item.isPinned ? '📌 ' : ''}
              {item.title}
            </Text>
            <Text style={{ color: typeColor(theme, item.type), fontSize: 11, fontWeight: '700' }}>{item.type}</Text>
          </View>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }} numberOfLines={2}>
            {truncate(item.content.replace(/\s+/g, ' '), 120)}
          </Text>
          <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 6 }}>
            {item.publishedAt ? formatDate(item.publishedAt, 'YYYY-MM-DD HH:mm') : formatDate(item.createdAt, 'YYYY-MM-DD')}
          </Text>
        </Card.Content>
        </Card>
      </Pressable>
    ),
    [router, theme],
  );

  if (!organizationId) return <LoadingScreen message="需要组织" />;
  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      {items.length === 0 ? (
        <EmptyState icon="bell" title="暂无公告" />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          estimatedItemSize={100}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: 8, paddingBottom: 24 },
  card: { marginHorizontal: 6, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '600' },
});
