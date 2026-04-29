import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BRAND_COLOR } from '../../lib/theme';

export function PhotoPickerGrid(props: {
  value: string[];
  onChange: (value: string[]) => void;
  title?: string;
  max?: number;
}) {
  const theme = useTheme();
  const max = props.max ?? 9;
  const [url, setUrl] = useState('');

  const add = useCallback(() => {
    const u = url.trim();
    if (!u) return;
    props.onChange([...props.value, u].slice(0, max));
    setUrl('');
  }, [url, props, max]);

  const remove = useCallback(
    (idx: number) => {
      props.onChange(props.value.filter((_, i) => i !== idx));
    },
    [props],
  );

  return (
    <View style={styles.root}>
      {props.title ? (
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{props.title}</Text>
      ) : null}

      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder="粘贴图片URL（后续可接入相册/相机）"
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={[styles.input, { borderColor: theme.colors.outlineVariant, color: theme.colors.onSurface }]}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        onPress={add}
        activeOpacity={0.7}
        style={[styles.addBtn, { backgroundColor: BRAND_COLOR }]}
        disabled={props.value.length >= max}
      >
        <Text style={{ color: '#333', fontWeight: '800' }}>
          {props.value.length >= max ? `最多${max}张` : '添加'}
        </Text>
      </TouchableOpacity>

      <View style={styles.grid}>
        {props.value.map((u, idx) => (
          <View key={`${u}-${idx}`} style={[styles.tile, { borderColor: theme.colors.outlineVariant }]}>
            <Image source={{ uri: u }} style={styles.img} />
            <TouchableOpacity onPress={() => remove(idx)} style={styles.remove} activeOpacity={0.7}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 8 },
  title: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  addBtn: {
    marginTop: 8,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  tile: { width: 86, height: 86, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

