import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import {  Card, List, Switch, Divider, Button, Portal, Modal, RadioButton, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../stores/app-store';
import { COMPANY_NAME } from '../../lib/constants';

export default function ProfileScreen() {
const paperTheme = useTheme();

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, stores, currentStore, selectStore, logout } = useAuth();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const isOffline = useAppStore((s) => s.isOffline);
  const [showStorePicker, setShowStorePicker] = useState(false);

  const handleStoreSelect = useCallback(() => {
    if (stores.length === 0) {
      Alert.alert('提示', '当前没有可用的门店');
      return;
    }
    if (stores.length <= 3) {
      Alert.alert(
        '切换门店',
        '请选择门店',
        stores.map((s) => ({
          text: `${s.storeName} (${s.orgName})`,
          onPress: () => selectStore(s),
        })),
      );
    } else {
      setShowStorePicker(true);
    }
  }, [stores, selectStore]);

  const handleLogout = useCallback(() => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => {
          logout();
          queryClient.clear();
          router.replace('/(auth)/login' as never);
        },
      },
    ]);
  }, [logout, router]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      {/* User Info */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0) ?? '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: paperTheme.colors.onSurface }]}>{user?.name ?? '未知用户'}</Text>
              <Text style={[styles.userEmail, { color: paperTheme.colors.onSurfaceVariant }]}>{user?.email ?? ''}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Current Store */}
      <Card style={styles.card}>
        <List.Item
          title="当前门店"
          description={currentStore?.storeName ?? '未选择'}
          left={(props) => <List.Icon {...props} icon="store" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleStoreSelect}
          accessibilityLabel="选择门店"
        />
      </Card>

      {/* Quick Links */}
      <Card style={styles.card}>
        <List.Item
          title="财务"
          left={(props) => <List.Icon {...props} icon="cash-multiple" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/finance/index' as never)}
          accessibilityLabel="财务"
        />
        <Divider />
        <List.Item
          title="维修"
          left={(props) => <List.Icon {...props} icon="wrench" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/repair/index' as never)}
          accessibilityLabel="维修"
        />
        <Divider />
        <List.Item
          title="客户"
          left={(props) => <List.Icon {...props} icon="account-group" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/customer/index' as never)}
          accessibilityLabel="客户"
        />
        <Divider />
        <List.Item
          title="统计"
          left={(props) => <List.Icon {...props} icon="chart-bar" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/stats' as never)}
          accessibilityLabel="统计"
        />
        <Divider />
        <List.Item
          title="收银台"
          left={(props) => <List.Icon {...props} icon="cash-register" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/cashier' as never)}
          accessibilityLabel="收银台"
        />
        <Divider />
        <List.Item
          title="收款方式"
          description="全端同步：名称、启停、自定义通道"
          left={(props) => <List.Icon {...props} icon="bank-transfer" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/payment-channels' as never)}
          accessibilityLabel="收款方式"
        />
        <Divider />
        <List.Item
          title="资金账户"
          description="收款/付款/通用，与收银与入库出账一致"
          left={(props) => <List.Icon {...props} icon="wallet" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/cash-accounts' as never)}
          accessibilityLabel="资金账户"
        />
        <Divider />
        <List.Item
          title="入库记录"
          left={(props) => <List.Icon {...props} icon="history" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/inbound/received' as never)}
          accessibilityLabel="入库记录"
        />
        <Divider />
        <List.Item
          title="盘点"
          left={(props) => <List.Icon {...props} icon="clipboard-check" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/stocktake/index' as never)}
          accessibilityLabel="盘点"
        />
        <Divider />
        <List.Item
          title="日结"
          left={(props) => <List.Icon {...props} icon="calculator" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settlement/index' as never)}
          accessibilityLabel="日结"
        />
      </Card>

      {/* Settings */}
      <Card style={styles.card}>
        <List.Item
          title="深色模式"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={theme === 'dark'}
              onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
              accessibilityLabel="深色模式"
            />
          )}
        />
        <Divider />
        <List.Item
          title="设置"
          left={(props) => <List.Icon {...props} icon="cog" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings' as never)}
          accessibilityLabel="设置"
        />
      </Card>

      {/* Network Status */}
      {isOffline && (
        <Card style={[styles.card, styles.offlineCard]}>
          <Card.Content>
            <Text style={styles.offlineText}>当前处于离线状态</Text>
          </Card.Content>
        </Card>
      )}

      {/* Logout */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutBtn}
        textColor="#e53935"
        accessibilityLabel="退出登录"
      >
        退出登录
      </Button>

      <Text style={[styles.footer, { color: paperTheme.colors.onSurfaceVariant }]}>{COMPANY_NAME}</Text>
      <Text style={[styles.version, { color: paperTheme.colors.outline }]}>v1.0.0</Text>

      <Portal>
        <Modal visible={showStorePicker} onDismiss={() => setShowStorePicker(false)} contentContainerStyle={[styles.modal, { backgroundColor: paperTheme.colors.surface }]}>
          <Text style={[styles.modalTitle, { color: paperTheme.colors.onSurface }]}>选择门店</Text>
          <RadioButton.Group
            value={currentStore?.storeId ?? ''}
            onValueChange={(value) => {
              const found = stores.find((s) => s.storeId === value);
              if (found) selectStore(found);
              setShowStorePicker(false);
            }}
          >
            <ScrollView style={styles.storeList}>
              {stores.map((s) => (
                <RadioButton.Item
                  key={s.storeId}
                  label={`${s.storeName} (${s.orgName})`}
                  value={s.storeId}
                />
              ))}
            </ScrollView>
          </RadioButton.Group>
          <Button onPress={() => setShowStorePicker(false)} style={styles.modalClose} accessibilityLabel="关闭">
            关闭
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  userEmail: {
    fontSize: 14,
    color: '#757575',
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderColor: '#e53935',
  },
  offlineCard: {
    backgroundColor: '#fff3e0',
  },
  offlineText: {
    color: '#e65100',
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#bdbdbd',
    marginTop: 16,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#e0e0e0',
    marginBottom: 24,
  },
  modal: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  storeList: {
    maxHeight: 400,
  },
  modalClose: {
    marginTop: 12,
  },
});
