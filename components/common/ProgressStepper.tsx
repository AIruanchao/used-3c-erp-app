import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BRAND_COLOR } from '../../lib/theme';

interface ProgressStepperProps {
  steps: string[];
  currentStep: number;
  onStepPress?: (index: number) => void;
}

export const ProgressStepper = React.memo(function ProgressStepper({
  steps,
  currentStep,
  onStepPress,
}: ProgressStepperProps) {
  const handlePress = useCallback(
    (index: number) => {
      if (onStepPress && index < currentStep) {
        onStepPress(index);
      }
    },
    [onStepPress, currentStep],
  );

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isFuture = index > currentStep;

        const circleBg = isCurrent
          ? BRAND_COLOR
          : isCompleted
            ? '#43A047'
            : '#F5F5F5';
        const circleText = isCurrent
          ? '#333333'
          : isCompleted
            ? '#FFFFFF'
            : '#9E9E9E';

        return (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={styles.stepWrap}
              onPress={() => handlePress(index)}
              disabled={!onStepPress || index >= currentStep}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.circle,
                  { backgroundColor: circleBg },
                ]}
              >
                {isCompleted ? (
                  <Text style={[styles.checkmark, { color: circleText }]}>
                    ✓
                  </Text>
                ) : (
                  <Text style={[styles.stepNum, { color: circleText }]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepName,
                  {
                    color: isCurrent
                      ? BRAND_COLOR
                      : isCompleted
                        ? '#43A047'
                        : '#9E9E9E',
                    fontWeight: isCurrent || isCompleted ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {step}
              </Text>
            </TouchableOpacity>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor: isCompleted ? '#43A047' : '#E0E0E0',
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  stepWrap: {
    alignItems: 'center',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepName: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 18,
  },
});
