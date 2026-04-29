import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  Switch,
  HelperText,
  useTheme,
  Text,
  Appbar,
  List,
  Portal,
  Dialog,
  RadioButton,
  Card,
} from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getStoreTeam, createHandover } from '../../services/handover-service';
import { getDailyReport } from '../../services/stats-service';
import { yuan } from '../../lib/utils';
import { centsToFixed2, moneyToCents } from '../../lib/money';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewHandoverScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, organizationId, user } = useAuth();

  const [toUserId, setToUserId] = useState<string | null>(null);
  const [cash, setCash] = useState('');
  const [keyH, setKeyH] = useState(false);
  const [safeH, setSafeH] = useState(false);
  const [note, setNote] = useState('');
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { data: team } = useQuery({
    queryKey: ['storeTeam', organizationId, storeId],
    queryFn: () => getStoreTeam({ organizationId: organizationId ?? '', storeId: storeId ?? '' }),
    enabled: !!organizationId && !!storeId,
  });

  const { data: todayReport } = useQuery({
    queryKey: ['dailyReport', organizationId, storeId, 'handover-preview'],
    queryFn: () =>
      getDailyReport({
        organizationId: organizationId ?? '',
        storeId: storeId ?? '',
      }),
    enabled: !!organizationId && !!storeId,
  });

  const members = useMemo(() => {
    const items = team?.items ?? [];
    if (!user?.id) return items;
    return items.filter((m) => m.userId !== user.id);
  }, [team?.items, user?.id]);

  const toName = useMemo(
    () => members.find((m) => m.userId === toUserId)?.name ?? '选择接收人',
    [members, toUserId],
  );

  const submit = useCallback(async () => {
    if (!storeId || !organizationId) return;
    if (!toUserId) {
      setErr('请选择接收人');
      return;
    }
    let n: number | undefined;
    if (cash.trim()) {
      const cents = moneyToCents(cash);
      if (cents < 0n) {
        setErr('现金交接金额不能为负');
        return;
      }
      n = Number(centsToFixed2(cents));
      if (!Number.isFinite(n) || n < 0 || n > 99999999) {
        setErr('现金交接金额 0～99999999');
        return;
      }
    }
    if (note.length > 500) {
      setErr('备注不超过500字');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await createHandover({
        organizationId,
        storeId,
        toUserId,
        cashHandover: n,
        keyHandover: keyH,
        safeHandover: safeH,
        specialNotes: note.trim() || undefined,
      });
      router.back();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSaving(false);
    }
  }, [cash, keyH, note, organizationId, router, safeH, storeId, toUserId]);

  if (!storeId || !organizationId) {
    return <Text style={{ padding: 16 }}>请先选择门店</Text>;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="新建交接班" titleStyle={{ color: theme.colors.onSurface }} />
        <Appbar.Action icon="check" onPress={() => void submit()} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Button mode="outlined" onPress={() => setPicker(true)} style={styles.in}>
          {toName}
        </Button>
        <TextInput
          label="现金交接 (可选)"
          value={cash}
          onChangeText={setCash}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.in}
        />
        <View style={styles.row}>
          <Text style={{ color: theme.colors.onSurface }}>钥匙交接</Text>
          <Switch value={keyH} onValueChange={setKeyH} />
        </View>
        <View style={styles.row}>
          <Text style={{ color: theme.colors.onSurface }}>保险柜交接</Text>
          <Switch value={safeH} onValueChange={setSafeH} />
        </View>
        <TextInput label="特殊备注" value={note} onChangeText={setNote} multiline numberOfLines={3} maxLength={500} mode="outlined" style={styles.in} />
        {todayReport ? (
          <Card style={[styles.in, { padding: 12 }]}>
            <Text style={{ fontWeight: '600', marginBottom: 8 }}>今日业务概况（预览）</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              入库 {todayReport.purchase.count} 台 · 出库 {todayReport.sales.count} 台 · 净现金流 {yuan(todayReport.netCashFlow)}
            </Text>
          </Card>
        ) : null}
        {err && <HelperText type="error">{err}</HelperText>}
        <Button mode="contained" onPress={() => void submit()} loading={saving}>
          提交
        </Button>
      </ScrollView>
      <Portal>
        <Dialog visible={picker} onDismiss={() => setPicker(false)} style={{ maxHeight: '80%' }}>
          <Dialog.Title>选择接收人</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 360 }}>
              {members.map((m) => (
                <List.Item
                  key={m.userId}
                  title={m.name}
                  description={m.phone ?? m.email ?? ''}
                  onPress={() => {
                    setToUserId(m.userId);
                    setPicker(false);
                  }}
                  right={() => <RadioButton value={m.userId} status={toUserId === m.userId ? 'checked' : 'unchecked'} onPress={() => {}} />}
                />
              ))}
            </ScrollView>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  in: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingVertical: 4 },
});
