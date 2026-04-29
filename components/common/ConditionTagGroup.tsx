import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { CONDITION_OPTIONS } from '../../lib/constants';
import { BRAND_COLOR } from '../../lib/theme';

interface ConditionTagGroupProps {
  value: string[];
  onChange: (v: string[]) => void;
  mode?: 'single' | 'multi';
}

export const ConditionTagGroup = React.memo(function ConditionTagGroup({
  value,
  onChange,
  mode = 'multi',
}: ConditionTagGroupProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof CONDITION_OPTIONS[number][]>();
    for (const opt of CONDITION_OPTIONS) {
      const g = opt.group;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(opt);
    }
    return Array.from(map.entries());
  }, []);

  const handlePress = useCallback(
    (itemValue: string) => {
      if (mode === 'single') {
        onChange(value.includes(itemValue) ? [] : [itemValue]);
      } else {
        if (value.includes(itemValue)) {
          onChange(value.filter((v) => v !== itemValue));
        } else {
          onChange([...value, itemValue]);
        }
      }
    },
    [mode, value, onChange],
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {grouped.map(([group, items]) => (
        <View key={group} style={styles.group}>
          <Text style={styles.groupTitle}>{group}</Text>
          <View style={styles.tagRow}>
            {items.map((item) => {
              const active = value.includes(item.value);
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: active ? BRAND_COLOR : '#F5F5F5',
                    },
                  ]}
                  onPress={() => handlePress(item.value)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: active ? '#333333' : '#757575' },
                    ]}
                  >
                    {item.value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
  },
  group: {
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
