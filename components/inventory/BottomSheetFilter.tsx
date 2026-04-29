import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { Portal, Text, useTheme } from 'react-native-paper';
import { BRAND_COLOR, BRAND_TEXT_ON_BRAND_LIGHT } from '../../lib/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;
const ANIMATION_DURATION = 280;

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

interface BottomSheetFilterProps {
  visible: boolean;
  onDismiss: () => void;
  groups: FilterGroup[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  onConfirm: () => void;
}

export function BottomSheetFilter({
  visible,
  onDismiss,
  groups,
  values,
  onChange,
  onReset,
  onConfirm,
}: BottomSheetFilterProps) {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  // Sync initial values when visible changes
  useEffect(() => {
    if (visible) {
      setLocalValues({ ...values });
    }
  }, [visible, values]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const handleLocalChange = useCallback((key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    const resetValues: Record<string, string> = {};
    groups.forEach((g) => {
      resetValues[g.key] = '';
    });
    setLocalValues(resetValues);
  }, [groups]);

  const handleConfirm = useCallback(() => {
    // Push local values up
    Object.entries(localValues).forEach(([key, value]) => {
      onChange(key, value);
    });
    onConfirm();
  }, [localValues, onChange, onConfirm]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  const surfaceColor = theme.dark ? theme.colors.elevation.level2 : '#FFFFFF';

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={onDismiss}>
          <Animated.View
            style={[
              styles.overlay,
              { backgroundColor: 'rgba(0,0,0,0.4)' },
              { opacity: opacityAnim },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: SHEET_HEIGHT,
              backgroundColor: surfaceColor,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: theme.dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)' },
              ]}
            />
          </View>

          {/* Filter content */}
          <View style={styles.contentArea}>
            {groups.map((group) => (
              <View key={group.key} style={styles.groupContainer}>
                <Text style={[styles.groupLabel, { color: theme.colors.onSurface }]}>
                  {group.label}
                </Text>
                <View style={styles.chipsGrid}>
                  {group.options.map((opt) => {
                    const isActive = localValues[group.key] === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value || '__all__'}
                        style={[
                          styles.chip,
                          isActive && {
                            backgroundColor: '#e6f7ff',
                            borderColor: BRAND_COLOR,
                          },
                          { borderColor: theme.colors.outlineVariant },
                        ]}
                        onPress={() => handleLocalChange(group.key, opt.value)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isActive ? BRAND_COLOR : theme.colors.onSurfaceVariant,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Bottom buttons */}
          <View style={[styles.buttonRow, { borderTopColor: theme.colors.elevation.level3 }]}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.colors.onSurfaceVariant }]}>
                重置
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: BRAND_TEXT_ON_BRAND_LIGHT }]}>确定</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.4)',
  },
  confirmButton: {
    backgroundColor: BRAND_COLOR,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
