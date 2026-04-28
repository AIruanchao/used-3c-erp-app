import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Switch, Dialog, Portal, TextInput, FAB, Chip, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import {
  fetchCashAccountsAdmin,
  createCashAccount,
  patchCashAccount,
  type CashAccountRow,
} from '../lib/cash-accounts-api';
import { getErrorMessage } from '../lib/errors';
import { centsToFixed2, moneyToCents } from '../lib/money';

const TYPE_LABEL: Record<string, string> = {
  CASH: '现金',
  WECHAT: '微信',
  ALIPAY: '支付宝',
  BANK: '银行',
  OTHER: '其他',
};

const FLOW_LABEL: Record<string, string> = {
  RECEIVE: '仅收款',
  PAY: '仅付款',
  BOTH: '通用',
};

const ACCOUNT_TYPES = ['CASH', 'WECHAT', 'ALIPAY', 'BANK', 'OTHER'] as const;
const FLOW_KINDS = ['RECEIVE', 'PAY', 'BOTH'] as const;

export default function CashAccountsScreen() {
  const theme = useTheme();
  const { organizationId, storeId } = useAuth();
  const [items, setItems] = useState<CashAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const firstLoad = useRef(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<(typeof ACCOUNT_TYPES)[number]>('CASH');
  const [newFlow, setNewFlow] = useState<(typeof FLOW_KINDS)[number]>('BOTH');
  const [addSubmit, setAddSubmit] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubmit, setEditSubmit] = useState(false);

  useEffect(() => {
    firstLoad.current = true;
    setItems([]);
  }, [organizationId, storeId]);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (!organizationId || !storeId) return;
      if (isRefresh) setRefreshing(true);
      else if (firstLoad.current) setLoading(true);
      try {
        const list = await fetchCashAccountsAdmin(organizationId, storeId);
        setItems(list);
        firstLoad.current = false;
      } catch (e) {
        Alert.alert('加载失败', getErrorMessage(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [organizationId, storeId],
  );

  useFocusEffect(
    useCallback(() => {
      if (!organizationId || !storeId) return;
      void load(false);
    }, [organizationId, storeId, load]),
  );

  const onRefresh = useCallback(() => {
    void load(true);
  }, [load]);

  const pickAccountType = () => {
    Alert.alert('资金类型', undefined, [
      ...ACCOUNT_TYPES.map((t) => ({
        text: TYPE_LABEL[t],
        onPress: () => setNewType(t),
      })),
      { text: '取消', style: 'cancel' },
    ]);
  };

  const pickFlowKind = () => {
    Alert.alert('用途', '销售收款等选仅收款或通用；现场付款、采购选仅付款或通用', [
      ...FLOW_KINDS.map((fk) => ({
        text: FLOW_LABEL[fk],
        onPress: () => setNewFlow(fk),
      })),
      { text: '取消', style: 'cancel' },
    ]);
  };

  const toggle = useCallback(
    async (row: CashAccountRow, isActive: boolean) => {
      if (!organizationId || !storeId) return;
      setSavingId(row.id);
      try {
        await patchCashAccount(row.id, { organizationId, storeId, isActive });
        setItems((prev) => prev.map((a) => (a.id === row.id ? { ...a, isActive } : a)));
      } catch (e) {
        Alert.alert('操作失败', getErrorMessage(e));
      } finally {
        setSavingId(null);
      }
    },
    [organizationId, storeId],
  );

  const setFlow = useCallback(
    async (row: CashAccountRow, flowKind: (typeof FLOW_KINDS)[number]) => {
      if (!organizationId || !storeId) return;
      setSavingId(row.id);
      try {
        await patchCashAccount(row.id, { organizationId, storeId, flowKind });
        setItems((prev) => prev.map((a) => (a.id === row.id ? { ...a, flowKind } : a)));
      } catch (e) {
        Alert.alert('保存失败', getErrorMessage(e));
      } finally {
        setSavingId(null);
      }
    },
    [organizationId, storeId],
  );

  const changeFlow = (row: CashAccountRow) => {
    if (savingId === row.id) return;
    Alert.alert('资金用途', undefined, [
      ...FLOW_KINDS.map((fk) => ({
        text: FLOW_LABEL[fk],
        onPress: () => void setFlow(row, fk),
      })),
      { text: '取消', style: 'cancel' },
    ]);
  };

  const openEdit = (row: CashAccountRow) => {
    setEditId(row.id);
    setEditName(row.name);
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!organizationId || !storeId || !editId) return;
    const name = editName.trim();
    if (!name) {
      Alert.alert('提示', '请填写名称');
      return;
    }
    setEditSubmit(true);
    try {
      await patchCashAccount(editId, { organizationId, storeId, name });
      setItems((prev) => prev.map((a) => (a.id === editId ? { ...a, name } : a)));
      setEditOpen(false);
      setEditId(null);
    } catch (e) {
      Alert.alert('保存失败', getErrorMessage(e));
    } finally {
      setEditSubmit(false);
    }
  };

  const submitAdd = async () => {
    if (!organizationId || !storeId) return;
    const name = newName.trim();
    if (!name) {
      Alert.alert('提示', '请填写账户名称');
      return;
    }
    setAddSubmit(true);
    try {
      await createCashAccount({
        organizationId,
        storeId,
        name,
        accountType: newType,
        flowKind: newFlow,
      });
      setNewName('');
      setNewType('CASH');
      setNewFlow('BOTH');
      setAddOpen(false);
      await load(true);
    } catch (e) {
      Alert.alert('创建失败', getErrorMessage(e));
    } finally {
      setAddSubmit(false);
    }
  };

  if (!organizationId || !storeId) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>请先选择门店</Text>
      </View>
    );
  }

  if (loading && items.length === 0) {
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
          销售收银计入「仅收款/通用」资金账户；收机现场付款、采购等出账用「仅付款/通用」账户。与 Web/H5 共用同一数据。
        </Text>
        {items.map((a) => (
          <Card key={a.id} style={styles.card} mode="outlined">
            <Card.Content>
              <View style={styles.titleRow}>
                <Text style={[styles.name, { color: theme.colors.onSurface }]}>{a.name}</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>¥{centsToFixed2(moneyToCents(a.balance))}</Text>
              </View>
              <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
                类型: {TYPE_LABEL[a.accountType] ?? a.accountType}
              </Text>
              <View style={styles.rowChips}>
                <Chip compact>{FLOW_LABEL[a.flowKind] ?? a.flowKind}</Chip>
                <Button mode="text" compact onPress={() => changeFlow(a)} disabled={savingId === a.id}>
                  改用途
                </Button>
              </View>
              <View style={styles.row}>
                <Text style={{ color: theme.colors.onSurface }}>启用</Text>
                <Switch
                  value={a.isActive}
                  onValueChange={(v) => void toggle(a, v)}
                  disabled={savingId === a.id}
                />
              </View>
              <Button mode="text" onPress={() => openEdit(a)} disabled={savingId === a.id}>
                改名称
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => setAddOpen(true)} accessibilityLabel="新建账户" />

      <Portal>
        <Dialog
          visible={addOpen}
          onDismiss={() => {
            if (!addSubmit) setAddOpen(false);
          }}
        >
          <Dialog.Title>新建资金账户</Dialog.Title>
          <Dialog.Content>
            <TextInput label="名称" value={newName} onChangeText={setNewName} mode="outlined" maxLength={50} />
            <Button mode="outlined" style={styles.inBtn} onPress={pickAccountType}>
              资金类型: {TYPE_LABEL[newType]}
            </Button>
            <Button mode="outlined" style={styles.inBtn} onPress={pickFlowKind}>
              用途: {FLOW_LABEL[newFlow]}
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddOpen(false)} disabled={addSubmit}>
              取消
            </Button>
            <Button onPress={() => void submitAdd()} loading={addSubmit} disabled={addSubmit}>
              创建
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={editOpen}
          onDismiss={() => {
            if (!editSubmit) {
              setEditOpen(false);
              setEditId(null);
            }
          }}
        >
          <Dialog.Title>改名称</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="名称"
              value={editName}
              onChangeText={setEditName}
              mode="outlined"
              maxLength={50}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setEditOpen(false);
                setEditId(null);
              }}
              disabled={editSubmit}
            >
              取消
            </Button>
            <Button onPress={() => void submitEdit()} loading={editSubmit} disabled={editSubmit}>
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  sub: { fontSize: 12, marginTop: 4 },
  rowChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  fab: { position: 'absolute', bottom: 16, right: 16 },
  inBtn: { marginTop: 8 },
});
