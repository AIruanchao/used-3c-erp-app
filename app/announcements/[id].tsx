import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Card, Appbar, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '../../services/announcement-service';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { QueryError } from '../../components/common/QueryError';
import { formatDate } from '../../lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organizationId, storeId } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['announcements', organizationId, storeId],
    queryFn: () => getAnnouncements({ organizationId: organizationId ?? '', storeId: storeId ?? undefined }),
    enabled: !!organizationId,
  });

  const item = (data?.items ?? []).find((i) => i.id === id);

  if (!organizationId) {
    return <LoadingScreen message="需要组织" />;
  }
  if (isLoading) return <LoadingScreen />;
  if (isError) return <QueryError onRetry={() => refetch()} />;

  if (!item) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center' }}>未找到该公告</Text>
        <Text style={{ textAlign: 'center', color: theme.colors.primary, marginTop: 8 }} onPress={() => router.back()}>
          返回
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="公告" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h1, { color: theme.colors.onSurface }]}>{item.title}</Text>
        <View style={styles.row}>
          <Chip compact>{item.type}</Chip>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
            {item.publishedAt ? formatDate(item.publishedAt, 'YYYY-MM-DD HH:mm') : '—'}
          </Text>
        </View>
        {item.expiredAt && (
          <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 4 }}>
            过期: {formatDate(item.expiredAt, 'YYYY-MM-DD HH:mm')}
          </Text>
        )}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text style={{ color: theme.colors.onSurface, lineHeight: 24 }}>{item.content}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  h1: { fontSize: 22, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  card: { marginTop: 12 },
});
