import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../../services/upload-service';

export interface ImageUploaderProps {
  maxCount: number;
  label: string;
  photoType: string;
  deviceId?: string;
  onUpload: (urls: string[]) => void;
}

type Item = { localUri: string; url: string };

export function ImageUploader(props: ImageUploaderProps) {
  const theme = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const canAdd = items.length < props.maxCount;

  const urls = useMemo(() => items.map((i) => i.url), [items]);

  const removeAt = useCallback(
    (idx: number) => {
      setItems((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        props.onUpload(next.map((x) => x.url));
        return next;
      });
    },
    [props],
  );

  const pickAndUpload = useCallback(async () => {
    if (!canAdd || uploading) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('权限不足', '请允许访问相册以选择照片');
      return;
    }

    setUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, props.maxCount - items.length),
        quality: 0.7,
      });

      if (result.canceled) return;

      const assets = result.assets ?? [];
      const pending = assets.slice(0, Math.max(0, props.maxCount - items.length));
      if (pending.length === 0) return;

      const newItems: Item[] = [];
      for (const a of pending) {
        const uri = a.uri;
        const name = (a.fileName || `photo-${Date.now()}.jpg`).slice(0, 200);
        const type = a.mimeType || 'image/jpeg';
        const url = await uploadFile({ uri, name, type });
        newItems.push({ localUri: uri, url });
      }

      setItems((prev) => {
        const next = [...prev, ...newItems].slice(0, props.maxCount);
        props.onUpload(next.map((x) => x.url));
        return next;
      });
    } catch (e) {
      Alert.alert('上传失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setUploading(false);
    }
  }, [canAdd, uploading, props, items.length]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>{props.label}</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          {items.length}/{props.maxCount}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((it, idx) => (
          <Pressable
            key={`${it.url}-${idx}`}
            onPress={() => setPreview(it.url)}
            onLongPress={() =>
              Alert.alert('删除照片', '确定删除这张照片？', [
                { text: '取消', style: 'cancel' },
                { text: '删除', style: 'destructive', onPress: () => removeAt(idx) },
              ])
            }
            style={styles.thumbWrap}
          >
            <Image source={{ uri: it.url }} style={styles.thumb} />
          </Pressable>
        ))}

        <View style={styles.addWrap}>
          <Button
            mode="outlined"
            onPress={() => void pickAndUpload()}
            disabled={!canAdd || uploading}
            icon="plus"
            style={styles.addBtn}
          >
            选择并上传
          </Button>
          {uploading ? <ActivityIndicator style={{ marginTop: 6 }} /> : null}
          <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>点击预览，长按删除</Text>
        </View>
      </ScrollView>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.previewMask}>
          <View style={styles.previewTop}>
            <IconButton icon="close" onPress={() => setPreview(null)} accessibilityLabel="关闭预览" />
          </View>
          {preview ? <Image source={{ uri: preview }} style={styles.previewImg} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  label: { fontSize: 14, fontWeight: '900' },
  row: { paddingVertical: 10, gap: 10, paddingRight: 10 },
  thumbWrap: { width: 78, height: 78, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F5F5F5' },
  thumb: { width: '100%', height: '100%' },
  addWrap: { minWidth: 160, justifyContent: 'center' },
  addBtn: { borderRadius: 12 },
  hint: { fontSize: 12, marginTop: 6 },
  previewMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
  previewTop: { paddingTop: 30, paddingHorizontal: 8, alignItems: 'flex-end' },
  previewImg: { flex: 1, width: '100%' },
});

