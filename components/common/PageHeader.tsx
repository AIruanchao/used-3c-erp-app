import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';

export function PageHeader(props: {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}) {
  const theme = useTheme();
  const router = useRouter();
  const showBack = props.showBack ?? true;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.left}>
        {showBack ? (
          <IconButton
            icon="arrow-left"
            onPress={() => router.back()}
            accessibilityLabel="返回"
          />
        ) : (
          <View style={styles.leftPlaceholder} />
        )}
      </View>

      <View style={styles.center}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          {props.title}
        </Text>
      </View>

      <View style={styles.right}>{props.rightAction ?? <View style={styles.rightPlaceholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  left: { width: 52, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  right: { width: 52, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '900' },
  leftPlaceholder: { width: 40, height: 40 },
  rightPlaceholder: { width: 40, height: 40 },
});

