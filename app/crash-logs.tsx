import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { getCrashLogs, clearCrashLogs, exportCrashLogs, type CrashLog } from '../lib/crash-logger';

export default function CrashLogsScreen() {
  const [logs, setLogs] = useState<CrashLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const l = await getCrashLogs();
    setLogs(l);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    const text = await exportCrashLogs();
    await Share.share({ message: text, title: '崩溃日志' });
  };

  const handleClear = () => {
    Alert.alert('确认清除', '将删除所有崩溃日志，不可恢复', [
      { text: '取消', style: 'cancel' },
      {
        text: '清除', style: 'destructive', onPress: async () => {
          await clearCrashLogs();
          setLogs([]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>崩溃日志 ({logs.length})</Text>
        <View style={styles.actions}>
          <Button mode="text" onPress={handleExport} compact>导出</Button>
          <Button mode="text" onPress={handleClear} compact textColor="#e53935">清除</Button>
          <Button mode="text" onPress={load} compact>刷新</Button>
        </View>
      </View>

      <ScrollView style={styles.list} >
        {logs.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无崩溃日志 ✅</Text>
          </View>
        )}
        {logs.map((log) => (
          <View key={log.id} style={[styles.card, log.isFatal && styles.cardFatal]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTime}>
                {new Date(log.timestamp).toLocaleString('zh-CN')}
              </Text>
              <Text style={[styles.badge, log.isFatal && styles.badgeFatal]}>
                {log.isFatal ? '💀 FATAL' : '⚠️'}
              </Text>
            </View>
            <Text style={styles.cardType}>{log.type}</Text>
            <Text style={styles.cardMsg} numberOfLines={3}>{log.message}</Text>
            {log.stack && (
              <Text style={styles.cardStack} numberOfLines={4}>{log.stack.slice(0, 300)}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 4 },
  list: { flex: 1, padding: 12 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#757575' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  cardFatal: { borderColor: '#e53935', borderWidth: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardTime: { fontSize: 12, color: '#757575' },
  badge: { fontSize: 12, fontWeight: 'bold' },
  badgeFatal: { color: '#e53935' },
  cardType: { fontSize: 11, color: '#9e9e9e', marginBottom: 4 },
  cardMsg: { fontSize: 14, color: '#212121', fontFamily: 'monospace' },
  cardStack: { fontSize: 11, color: '#616161', fontFamily: 'monospace', marginTop: 4, backgroundColor: '#fafafa', padding: 6, borderRadius: 4 },
});
