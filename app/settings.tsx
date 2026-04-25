import React, { useState, useCallback } from 'react';
import { Text, StyleSheet, ScrollView, Alert, View } from 'react-native';
import { Card, List, Switch, Divider, Button, TextInput } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../stores/app-store';
import { APP_DISPLAY_NAME, COMPANY_NAME } from '../lib/constants';
import { API_BASE } from '../lib/api';
import { getApiBaseUrl, setApiBaseUrl, removeApiBaseUrl } from '../lib/storage';
import { printerService } from '../services/printer-service';

export default function SettingsScreen() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [scanning, setScanning] = useState(false);
  const [printers, setPrinters] = useState<Array<{ id: string; name: string | null }>>([]);
  const [connected, setConnected] = useState(printerService.isConnected());
  const [apiBaseDraft, setApiBaseDraft] = useState(getApiBaseUrl() ?? '');

  // Refresh connection state when screen gains focus
  useFocusEffect(
    useCallback(() => {
      setConnected(printerService.isConnected());
    }, []),
  );

  const handleScanPrinters = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    try {
      const found = await printerService.scanPrinters();
      setPrinters(found);
      if (found.length === 0) {
        Alert.alert('提示', '未找到蓝牙打印机');
      }
    } catch (err) {
      Alert.alert('扫描失败', err instanceof Error ? err.message : '请检查蓝牙权限');
    } finally {
      setScanning(false);
    }
  }, [scanning]);

  const handleConnectPrinter = useCallback(async (id: string) => {
    try {
      const ok = await printerService.connect(id);
      setConnected(ok);
      Alert.alert(ok ? '成功' : '失败', ok ? '已连接打印机' : '连接失败，请重试');
    } catch (err) {
      Alert.alert('连接失败', err instanceof Error ? err.message : '未知错误');
    }
  }, []);

  const handleDisconnectPrinter = useCallback(async () => {
    try {
      await printerService.disconnect();
      setConnected(false);
      Alert.alert('提示', '已断开打印机连接');
    } catch {
      Alert.alert('提示', '断开失败，请重试');
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* API Base */}
      <Card style={styles.card}>
        <Card.Title title="服务器地址" titleStyle={styles.cardTitle} />
        <Card.Content>
          <Text style={styles.aboutText}>默认: {API_BASE}</Text>
          <TextInput
            mode="outlined"
            label="自定义 API Base（可选）"
            placeholder="https://your-domain.com"
            value={apiBaseDraft}
            onChangeText={setApiBaseDraft}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ marginTop: 8 }}
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <Button
              mode="contained"
              onPress={() => {
                const v = apiBaseDraft.trim();
                if (!v) {
                  Alert.alert('提示', '请输入 API Base，或点击“清除自定义”');
                  return;
                }
                setApiBaseUrl(v);
                Alert.alert('已保存', '已保存服务器地址。请返回登录页重试。');
              }}
              accessibilityLabel="保存服务器地址"
            >
              保存
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                removeApiBaseUrl();
                setApiBaseDraft('');
                Alert.alert('已清除', '已恢复为默认服务器地址。');
              }}
              accessibilityLabel="清除自定义服务器地址"
            >
              清除自定义
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Theme */}
      <Card style={styles.card}>
        <List.Item
          title="深色模式"
          description="切换深色/浅色主题"
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
          title="跟随系统"
          left={(props) => <List.Icon {...props} icon="cellphone" />}
          right={() => (
            <Switch
              value={theme === 'system'}
              onValueChange={(v) => setTheme(v ? 'system' : 'light')}
              accessibilityLabel="跟随系统"
            />
          )}
        />
      </Card>

      {/* Bluetooth Printer */}
      <Card style={styles.card}>
        <Card.Title title="蓝牙打印" titleStyle={styles.cardTitle} />
        <Card.Content>
          <Button
            mode="outlined"
            icon="bluetooth"
            onPress={handleScanPrinters}
            loading={scanning}
            disabled={scanning}
            style={styles.scanBtn}
            accessibilityLabel="搜索打印机"
          >
            搜索打印机
          </Button>
          {connected && (
            <List.Item
              title={printerService.getConnectedPrinterName() ?? '已连接'}
              description="当前打印机"
              left={(props) => <List.Icon {...props} icon="printer-check" />}
              right={() => (
                <Button mode="text" onPress={handleDisconnectPrinter} textColor="#e53935" accessibilityLabel="断开">
                  断开
                </Button>
              )}
            />
          )}
          {printers.map((printer) => (
            <List.Item
              key={printer.id}
              title={printer.name ?? '未知设备'}
              description={printer.id}
              left={(props) => <List.Icon {...props} icon="printer" />}
              right={(props) => <List.Icon {...props} icon="bluetooth-connect" />}
              onPress={() => handleConnectPrinter(printer.id)}
              accessibilityLabel={printer.name ?? '未知设备'}
            />
          ))}
        </Card.Content>
      </Card>

      {/* About */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.aboutTitle}>关于</Text>
          <Text style={styles.aboutText}>
            {APP_DISPLAY_NAME} - 二手3C管理系统
          </Text>
          <Text style={styles.aboutText}>版本: 1.0.0</Text>
          <Text style={styles.aboutText}>公司: {COMPANY_NAME}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  card: { marginHorizontal: 16, marginTop: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  scanBtn: { marginBottom: 8 },
  aboutTitle: { fontSize: 16, fontWeight: '600', color: '#212121', marginBottom: 8 },
  aboutText: { fontSize: 14, color: '#757575', marginBottom: 4 },
});
