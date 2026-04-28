import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Portal, Text, useTheme } from 'react-native-paper';
import { ConditionTagGroup } from '../common/ConditionTagGroup';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;
const ANIMATION_DURATION = 280;

export interface AdvancedFilterValues {
  condition?: string;
  storage?: string;
  inboundStart?: string;
  inboundEnd?: string;
  sn?: string;
  unitCostMin?: string;
  unitCostMax?: string;
  peerPriceMin?: string;
  peerPriceMax?: string;
  retailPriceMin?: string;
  retailPriceMax?: string;
}

interface AdvancedFilterSheetProps {
  visible: boolean;
  values: AdvancedFilterValues;
  onDismiss: () => void;
  onReset: () => void;
  onConfirm: (values: AdvancedFilterValues) => void;
}

export function AdvancedFilterSheet({
  visible,
  values,
  onDismiss,
  onReset,
  onConfirm,
}: AdvancedFilterSheetProps) {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [local, setLocal] = useState<AdvancedFilterValues>({});

  useEffect(() => {
    if (visible) setLocal({ ...values });
  }, [visible, values]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 1, duration: ANIMATION_DURATION, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: ANIMATION_DURATION, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: ANIMATION_DURATION, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: ANIMATION_DURATION, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  const surfaceColor = theme.dark ? theme.colors.elevation.level2 : '#FFFFFF';

  const storageOptions = useMemo(
    () => ['128G', '256G', '512G', '1T'].map((x) => ({ label: x, value: x })),
    [],
  );

  const setField = useCallback(<K extends keyof AdvancedFilterValues>(k: K, v: AdvancedFilterValues[K]) => {
    setLocal((p) => ({ ...p, [k]: v }));
  }, []);

  const handleReset = useCallback(() => {
    setLocal({});
    onReset();
  }, [onReset]);

  const handleConfirm = useCallback(() => {
    onConfirm(local);
  }, [local, onConfirm]);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} transparent animationType="none" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={onDismiss}>
          <Animated.View style={[styles.overlay, { opacity: opacityAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            { height: SHEET_HEIGHT, backgroundColor: surfaceColor, transform: [{ translateY }] },
          ]}
        >
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: theme.dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)' },
              ]}
            />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>成色</Text>
            <ConditionTagGroup
              value={local.condition ? [local.condition] : []}
              onChange={(v) => setField('condition', v[0] ?? '')}
              mode="single"
            />

            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>存储规格</Text>
            <View style={styles.chipsRow}>
              {storageOptions.map((o) => {
                const active = (local.storage ?? '') === o.value;
                return (
                  <TouchableOpacity
                    key={o.value}
                    style={[
                      styles.chip,
                      { borderColor: active ? '#FFD700' : theme.colors.outlineVariant },
                      active && styles.chipActive,
                    ]}
                    onPress={() => setField('storage', active ? '' : o.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: active ? '#333' : theme.colors.onSurfaceVariant }]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>入库时间</Text>
            <View style={styles.row2}>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                placeholder="开始（YYYY-MM-DD）"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={local.inboundStart ?? ''}
                onChangeText={(v) => setField('inboundStart', v)}
              />
              <TextInput
                style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                placeholder="结束（YYYY-MM-DD）"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={local.inboundEnd ?? ''}
                onChangeText={(v) => setField('inboundEnd', v)}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>SN/IMEI</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
              placeholder="输入SN/IMEI"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={local.sn ?? ''}
              onChangeText={(v) => setField('sn', v)}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>价格区间</Text>
            <Text style={[styles.subTitle, { color: theme.colors.onSurfaceVariant }]}>成本</Text>
            <View style={styles.row2}>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                placeholder="最低"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={local.unitCostMin ?? ''}
                onChangeText={(v) => setField('unitCostMin', v)}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                placeholder="最高"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={local.unitCostMax ?? ''}
                onChangeText={(v) => setField('unitCostMax', v)}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={[styles.subTitle, { color: theme.colors.onSurfaceVariant }]}>同行</Text>
            <View style={styles.row2}>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                placeholder="最低"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={local.peerPriceMin ?? ''}
                onChangeText={(v) => setField('peerPriceMin', v)}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                placeholder="最高"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={local.peerPriceMax ?? ''}
                onChangeText={(v) => setField('peerPriceMax', v)}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={[styles.subTitle, { color: theme.colors.onSurfaceVariant }]}>零售</Text>
            <View style={styles.row2}>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                placeholder="最低"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={local.retailPriceMin ?? ''}
                onChangeText={(v) => setField('retailPriceMin', v)}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}
                placeholder="最高"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={local.retailPriceMax ?? ''}
                onChangeText={(v) => setField('retailPriceMax', v)}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>

          <View style={[styles.buttonRow, { borderTopColor: theme.colors.elevation.level3 }]}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={handleReset} activeOpacity={0.7}>
              <Text style={[styles.btnText, { color: theme.colors.onSurfaceVariant }]}>重置</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleConfirm} activeOpacity={0.7}>
              <Text style={[styles.btnText, { color: '#333' }]}>确认</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleContainer: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  subTitle: { fontSize: 12, fontWeight: '600', marginTop: 6, marginBottom: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive: { backgroundColor: '#FFF8E1' },
  chipText: { fontSize: 13, fontWeight: '600' },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  row2: { flexDirection: 'row', gap: 10 },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  btn: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(128,128,128,0.4)' },
  btnPrimary: { backgroundColor: '#FFD700' },
  btnText: { fontSize: 15, fontWeight: '700' },
});

