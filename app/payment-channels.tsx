import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  Switch,
  Dialog,
  Portal,
  TextInput,
  FAB,
  Chip,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/errors';

interface PaymentChannelRow {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  isBuiltin: boolean;
}

export default function PaymentChannelsScreen() {
  const theme = useTheme();
  const { organizationId } = useAuth();
  const [channels, setChannels] = useState<PaymentChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addLabel, setAddLabel] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const firstLoadInOrg = useRef(true);

  useEffect(() => {
    firstLoadInOrg.current = true;
    setChannels([]);
  }, [organizationId]);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (!organizationId) return;
      if (isRefresh) {
        setRefreshing(true);
      } else if (firstLoadInOrg.current) {
        setLoading(true);
      }
      try {
        const res = await api.get<{ channels: PaymentChannelRow[] }>('/api/payment-channels', {
          params: { organizationId },
        });
        setChannels(res.data?.channels ?? []);
        firstLoadInOrg.current = false;
      } catch (e) {
        Alert.alert('加载失败', getErrorMessage(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [organizationId],
  );

  useFocusEffect(
    useCallback(() => {
      if (!organizationId) return;
      void load(false);
    }, [organizationId, load]),
  );

  const onRefresh = useCallback(() => {
    void load(true);
  }, [load]);

  const toggleActive = useCallback(
    async (row: PaymentChannelRow, isActive: boolean) => {
      if (!organizationId) return;
      setSavingId(row.id);
      try {
        await api.patch(`/api/payment-channels/${row.id}`, {
          organizationId,
          isActive,
        });
        setChannels((prev) => prev.map((c) => (c.id === row.id ? { ...c, isActive } : c)));
      } catch (e) {
        Alert.alert('操作失败', getErrorMessage(e));
      } finally {
        setSavingId(null);
      }
    },
    [organizationId],
  );

  const openEdit = useCallback((row: PaymentChannelRow) => {
    setEditId(row.id);
    setEditLabel(row.label);
    setEditOpen(true);
  }, []);

  const submitEdit = useCallback(async () => {
    if (!organizationId || !editId) return;
    const label = editLabel.trim();
    if (!label) {
      Alert.alert('提示', '请填写展示名称');
      return;
    }
    setEditSubmitting(true);
    try {
      await api.patch(`/api/payment-channels/${editId}`, { organizationId, label });
      setChannels((prev) => prev.map((c) => (c.id === editId ? { ...c, label } : c)));
      setEditOpen(false);
      setEditId(null);
    } catch (e) {
      Alert.alert('保存失败', getErrorMessage(e));
    } finally {
      setEditSubmitting(false);
    }
  }, [organizationId, editId, editLabel]);

  const submitAdd = useCallback(async () => {
    if (!organizationId) return;
    const label = addLabel.trim();
    if (!label) {
      Alert.alert('提示', '请填写展示名称');
      return;
    }
    setAddSubmitting(true);
    try {
      const res = await api.post<{ channel: PaymentChannelRow }>('/api/payment-channels', {
        organizationId,
        label,
      });
      const ch = res.data?.channel;
      if (ch) {
        setChannels((prev) => [...prev, ch].sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code)));
      } else {
        await load(true);
      }
      setAddLabel('');
      setAddOpen(false);
    } catch (e) {
      Alert.alert('添加失败', getErrorMessage(e));
    } finally {
      setAddSubmitting(false);
    }
  }, [organizationId, addLabel, load]);

  const confirmDelete = useCallback(
    (row: PaymentChannelRow) => {
      if (row.isBuiltin) {
        Alert.alert('提示', '内置通道不可删除，可改为停用。');
        return;
      }
      if (!organizationId) return;
      Alert.alert('删除通道', `确定删除「${row.label}」？已产生的收款记录不受影响。`, [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setSavingId(row.id);
            try {
              await api.delete(`/api/payment-channels/${row.id}`, {
                params: { organizationId },
              });
              setChannels((prev) => prev.filter((c) => c.id !== row.id));
            } catch (e) {
              Alert.alert('删除失败', getErrorMessage(e));
            } finally {
              setSavingId(null);
            }
          },
        },
      ]);
    },
    [organizationId],
  );

  if (!organizationId) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>请先选择门店</Text>
      </View>
    );
  }

  if (loading && channels.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>加载中…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scroll}
      >
        <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
          名称与启停会同步到收银台、H5 等端。历史订单仍按代码存证，展示取当前名称。
        </Text>
        {channels.map((c) => (
          <Card key={c.id} style={styles.card} mode="outlined">
            <Card.Content>
              <View style={styles.titleRow}>
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>{c.label}</Text>
                {c.isBuiltin ? <Chip compact>内置</Chip> : <Chip compact>自定义</Chip>}
              </View>
              <Text style={[styles.code, { color: theme.colors.onSurfaceVariant }]}>代码: {c.code}</Text>
              <View style={styles.row}>
                <Text style={{ color: theme.colors.onSurface }}>启用</Text>
                <Switch
                  value={c.isActive}
                  onValueChange={(v) => void toggleActive(c, v)}
                  disabled={savingId === c.id}
                />
              </View>
              <View style={styles.btnRow}>
                <Button mode="text" onPress={() => openEdit(c)} disabled={savingId === c.id} accessibilityLabel="改名称">
                  改名称
                </Button>
                {!c.isBuiltin && (
                  <Button
                    mode="text"
                    textColor={theme.colors.error}
                    onPress={() => confirmDelete(c)}
                    disabled={savingId === c.id}
                    accessibilityLabel="删除通道"
                  >
                    删除
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => setAddOpen(true)} accessibilityLabel="新增通道" />

      <Portal>
        <Dialog
          visible={addOpen}
          onDismiss={() => {
            if (!addSubmitting) {
              setAddOpen(false);
              setAddLabel('');
            }
          }}
        >
          <Dialog.Title>新增自定义通道</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="展示名称"
              value={addLabel}
              onChangeText={setAddLabel}
              mode="outlined"
              maxLength={64}
              disabled={addSubmitting}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setAddOpen(false);
                setAddLabel('');
              }}
              disabled={addSubmitting}
            >
              取消
            </Button>
            <Button onPress={() => void submitAdd()} loading={addSubmitting} disabled={addSubmitting}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={editOpen}
          onDismiss={() => {
            if (!editSubmitting) {
              setEditOpen(false);
              setEditId(null);
            }
          }}
        >
          <Dialog.Title>改名称</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="展示名称"
              value={editLabel}
              onChangeText={setEditLabel}
              mode="outlined"
              maxLength={64}
              disabled={editSubmitting}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setEditOpen(false);
                setEditId(null);
              }}
              disabled={editSubmitting}
            >
              取消
            </Button>
            <Button onPress={() => void submitEdit()} loading={editSubmitting} disabled={editSubmitting}>
              保存
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 96 },
  hint: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  card: { marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  code: { fontSize: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  fab: { position: 'absolute', bottom: 16, right: 16 },
});
