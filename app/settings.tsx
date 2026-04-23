import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, List, Switch, Divider } from 'react-native-paper';
import { useAppStore } from '../stores/app-store';
import { COMPANY_NAME } from '../lib/constants';

export default function SettingsScreen() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <List.Item
          title="深色模式"
          description="切换深色/浅色主题"
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
          title="跟随系统"
          left={(props) => <List.Icon {...props} icon="cellphone" />}
          right={() => (
            <Switch
              value={theme === 'system'}
              onValueChange={(v) => setTheme(v ? 'system' : 'light')}
            />
          )}
        />
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.aboutTitle}>关于</Text>
          <Text style={styles.aboutText}>嫩叶ERP - 二手3C管理系统</Text>
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
  aboutTitle: { fontSize: 16, fontWeight: '600', color: '#212121', marginBottom: 8 },
  aboutText: { fontSize: 14, color: '#757575', marginBottom: 4 },
});
