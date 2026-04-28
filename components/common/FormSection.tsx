import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export function FormSection(props: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#757575' }]}>{props.title}</Text>
        {props.required ? <Text style={styles.required}>*</Text> : null}
      </View>
      <View style={[styles.body, { backgroundColor: theme.colors.surface }]}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  title: { fontSize: 13, fontWeight: '600' },
  required: { color: '#E53935', fontSize: 14, fontWeight: '900' },
  body: { borderRadius: 12 },
});

