import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  useTheme,
  Text,
  Appbar,
  SegmentedButtons,
  IconButton,
  Snackbar,
  HelperText,
  Card,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { submitInspection } from '../../services/inspection-service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { InspectionTool } from '../../types/inspection';
import { PhotoPickerGrid } from '../../components/common/PhotoPickerGrid';

const TOOLS: { value: InspectionTool; label: string }[] = [
  { value: 'MANUAL', label: '手动' },
  { value: 'AIHUISHOU', label: 'AI回收' },
  { value: 'SHANJIAN', label: '闪匠' },
  { value: 'WEIXUE', label: '微学' },
  { value: 'OTHER', label: '其他' },
];

const MAX_ISSUES = 20;
const MAX_LEN = 200;

export default function InspectionScreen() {
  const { deviceId, sn, model } = useLocalSearchParams<{
    deviceId: string;
    sn?: string;
    model?: string;
  }>();
  const id = deviceId;
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tool, setTool] = useState<InspectionTool>('MANUAL');
  const [score, setScore] = useState('');
  const [grade, setGrade] = useState('');
  const [screen, setScreen] = useState('');
  const [battery, setBattery] = useState('');
  const [board, setBoard] = useState('');
  const [camera, setCamera] = useState('');
  const [sensor, setSensor] = useState('');
  const [network, setNetwork] = useState('');
  const [exterior, setExterior] = useState('');
  const [issues, setIssues] = useState<string[]>(['']);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const scoreHint = useMemo(() => {
    const n = parseInt(score, 10);
    if (Number.isNaN(n) || score === '') return '';
    if (n >= 90) return '建议：优秀';
    if (n >= 80) return '建议：良好';
    if (n >= 60) return '建议：一般';
    return '建议：较差';
  }, [score]);

  const setIssue = useCallback((i: number, v: string) => {
    if (v.length > MAX_LEN) {
      return;
    }
    setIssues((list) => {
      const n = [...list];
      n[i] = v;
      return n;
    });
  }, []);

  const addIssue = useCallback(() => {
    if (issues.length >= MAX_ISSUES) return;
    setIssues((l) => [...l, '']);
  }, [issues.length]);

  const removeIssue = useCallback((i: number) => {
    setIssues((l) => l.filter((_, j) => j !== i));
  }, []);

  const save = useCallback(async () => {
    if (!id) return;
    setErr(null);
    const sc = score.trim() ? parseInt(score, 10) : null;
    if (sc != null && (sc < 0 || sc > 100)) {
      setErr('综合评分 0～100');
      return;
    }
    const cleaned = issues.map((i) => i.trim()).filter(Boolean);
    for (const line of cleaned) {
      if (line.length > MAX_LEN) {
        setErr('每条问题不超过200字');
        return;
      }
    }
    if (cleaned.length > MAX_ISSUES) {
      setErr(`问题最多${MAX_ISSUES}条`);
      return;
    }
    setSaving(true);
    try {
      await submitInspection({
        deviceId: id,
        inspectionTool: tool,
        overallScore: sc,
        overallGrade: grade.trim() || undefined,
        screenCheck: screen.trim() ? { text: screen.trim() } : undefined,
        batteryCheck: battery.trim() ? { text: battery.trim() } : undefined,
        boardCheck: board.trim() ? { text: board.trim() } : undefined,
        cameraCheck: camera.trim() ? { text: camera.trim() } : undefined,
        sensorCheck: sensor.trim() ? { text: sensor.trim() } : undefined,
        networkCheck: network.trim() ? { text: network.trim() } : undefined,
        exteriorCheck: exterior.trim() ? { text: exterior.trim() } : undefined,
        issues: cleaned.length ? cleaned : undefined,
        inspectionData: { note: 'app-inspection' },
        photos: photos.length ? photos : undefined,
      });
      setSnack(true);
      setTimeout(() => router.back(), 500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSaving(false);
    }
  }, [
    battery,
    board,
    camera,
    id,
    exterior,
    grade,
    issues,
    network,
    router,
    score,
    screen,
    sensor,
    tool,
    photos,
  ]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="检测报告" titleStyle={{ color: theme.colors.onSurface }} />
        <Appbar.Action icon="check" onPress={() => void save()} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {sn && (
          <Text style={[styles.head, { color: theme.colors.onSurfaceVariant }]}>SN: {sn}</Text>
        )}
        {model && (
          <Text style={[styles.head, { color: theme.colors.onSurface }]}>型号: {model}</Text>
        )}
        <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>检测工具</Text>
        <SegmentedButtons
          value={tool}
          onValueChange={(v) => setTool(v as InspectionTool)}
          buttons={TOOLS.map((t) => ({ value: t.value, label: t.label }))}
        />
        <TextInput
          label="综合评分 0-100"
          value={score}
          onChangeText={setScore}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.in}
        />
        {!!scoreHint && <Text style={{ color: theme.colors.tertiary, marginBottom: 6 }}>{scoreHint}</Text>}
        <TextInput
          label="综合等级(文字)"
          value={grade}
          onChangeText={setGrade}
          mode="outlined"
          style={styles.in}
        />
        <Card style={styles.card} mode="outlined">
          <Card.Title title="分项" titleStyle={{ color: theme.colors.onSurface }} />
          <Card.Content>
            <TextInput label="屏幕" value={screen} onChangeText={setScreen} multiline mode="outlined" style={styles.in} />
            <TextInput label="电池" value={battery} onChangeText={setBattery} multiline mode="outlined" style={styles.in} />
            <TextInput label="主板" value={board} onChangeText={setBoard} multiline mode="outlined" style={styles.in} />
            <TextInput label="相机" value={camera} onChangeText={setCamera} multiline mode="outlined" style={styles.in} />
            <TextInput label="传感器" value={sensor} onChangeText={setSensor} multiline mode="outlined" style={styles.in} />
            <TextInput label="网络" value={network} onChangeText={setNetwork} multiline mode="outlined" style={styles.in} />
            <TextInput label="外观" value={exterior} onChangeText={setExterior} multiline mode="outlined" style={styles.in} />
          </Card.Content>
        </Card>
        <Text style={{ color: theme.colors.onSurface, marginTop: 8, marginBottom: 4 }}>问题</Text>
        {issues.map((iss, i) => (
          <View key={i} style={styles.issueRow}>
            <TextInput
              style={styles.issueIn}
              mode="outlined"
              value={iss}
              onChangeText={(t) => setIssue(i, t)}
              multiline
              maxLength={MAX_LEN}
            />
            <IconButton icon="close" onPress={() => removeIssue(i)} />
          </View>
        ))}
        <Button onPress={addIssue} disabled={issues.length >= MAX_ISSUES} style={{ marginBottom: 12 }}>
          添加问题
        </Button>

        <PhotoPickerGrid title="照片（可选）" value={photos} onChange={setPhotos} max={6} />

        {err && <HelperText type="error">{err}</HelperText>}
        <Button mode="contained" loading={saving} onPress={() => void save()}>
          提交
        </Button>
      </ScrollView>
      <Snackbar visible={snack} onDismiss={() => setSnack(false)} duration={2000}>
        检测已记录
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  head: { marginBottom: 4, fontSize: 14 },
  in: { marginBottom: 8 },
  card: { marginTop: 8, marginBottom: 8 },
  issueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  issueIn: { flex: 1, marginRight: 4 },
});
