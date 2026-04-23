import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, List, Switch, Divider, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../stores/app-store';
import { COMPANY_NAME } from '../../lib/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, stores, currentStore, selectStore, logout } = useAuth();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const isOffline = useAppStore((s) => s.isOffline);

  const handleStoreSelect = useCallback(() => {
    Alert.alert(
      '切换门店',
      '请选择门店',
      stores.map((s) => ({
        text: `${s.storeName} (${s.orgName})`,
        onPress: () => selectStore(s),
      })),
    );
  }, [stores, selectStore]);

  const handleLogout = useCallback(() => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login' as never);
        },
      },
    ]);
  }, [logout, router]);

  return (
    <ScrollView style={styles.container}>
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
              <Text style={styles.userName}>{user?.name ?? '未知用户'}</Text>
              <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
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
        />
      </Card>

      {/* Quick Links */}
      <Card style={styles.card}>
        <List.Item
          title="财务"
          left={(props) => <List.Icon {...props} icon="cash-multiple" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/finance/index' as never)}
        />
        <Divider />
        <List.Item
          title="维修"
          left={(props) => <List.Icon {...props} icon="wrench" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/repair/index' as never)}
        />
        <Divider />
        <List.Item
          title="客户"
          left={(props) => <List.Icon {...props} icon="account-group" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/customer/index' as never)}
        />
        <Divider />
        <List.Item
          title="统计"
          left={(props) => <List.Icon {...props} icon="chart-bar" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/stats' as never)}
        />
        <Divider />
        <List.Item
          title="收银台"
          left={(props) => <List.Icon {...props} icon="cash-register" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/cashier' as never)}
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
            />
          )}
        />
        <Divider />
        <List.Item
          title="设置"
          left={(props) => <List.Icon {...props} icon="cog" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings' as never)}
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
      >
        退出登录
      </Button>

      <Text style={styles.footer}>{COMPANY_NAME}</Text>
      <Text style={styles.version}>v1.0.0</Text>
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
});
