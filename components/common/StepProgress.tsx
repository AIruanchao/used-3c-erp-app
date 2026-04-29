import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BRAND_COLOR } from '../../lib/theme';

export function StepProgress(props: {
  steps: { label: string }[];
  currentStep: number;
}) {
  const theme = useTheme();
  const steps = props.steps ?? [];
  const current = Math.max(0, Math.min(props.currentStep ?? 0, Math.max(0, steps.length - 1)));

  return (
    <View style={styles.wrap}>
      {steps.map((s, idx) => {
        const state: 'done' | 'current' | 'todo' =
          idx < current ? 'done' : idx === current ? 'current' : 'todo';
        const circleBg =
          state === 'current' ? BRAND_COLOR : state === 'done' ? '#43A047' : '#F5F5F5';
        const circleText =
          state === 'todo' ? theme.colors.onSurfaceVariant : '#212121';

        return (
          <React.Fragment key={`${s.label}-${idx}`}>
            <View style={styles.step}>
              <View style={[styles.circle, { backgroundColor: circleBg }]}>
                <Text style={[styles.circleText, { color: circleText }]}>{idx + 1}</Text>
              </View>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
            {idx < steps.length - 1 ? (
              <View style={[styles.line, { backgroundColor: '#E0E0E0' }]} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  step: { alignItems: 'center' },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: { fontSize: 12, fontWeight: '900' },
  label: { marginTop: 6, fontSize: 10, fontWeight: '700', maxWidth: 72, textAlign: 'center' },
  line: { height: 2, flex: 1, marginHorizontal: 8 },
});

