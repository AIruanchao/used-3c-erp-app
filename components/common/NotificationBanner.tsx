import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export type BannerTone = 'info' | 'warning' | 'error' | 'success';

export function NotificationBanner(props: {
  tone?: BannerTone;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}) {
  const theme = useTheme();
  const tone = props.tone ?? 'info';

  const colors: Record<BannerTone, { bg: string; fg: string; border: string }> = {
    info: { bg: '#FFFDF3', fg: theme.colors.onSurface, border: 'rgba(0,0,0,0.08)' },
    warning: { bg: '#FFF8E1', fg: theme.colors.onSurface, border: 'rgba(0,0,0,0.10)' },
    error: { bg: '#FFEBEE', fg: theme.colors.onSurface, border: 'rgba(0,0,0,0.10)' },
    success: { bg: '#E8F5E9', fg: theme.colors.onSurface, border: 'rgba(0,0,0,0.10)' },
  };
  const c = colors[tone];

  return (
    <View style={[styles.root, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={styles.body}>
        <Text style={[styles.title, { color: c.fg }]} numberOfLines={1}>
          {props.title}
        </Text>
        {props.message ? (
          <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
            {props.message}
          </Text>
        ) : null}
        {props.actionLabel && props.onAction ? (
          <TouchableOpacity onPress={props.onAction} activeOpacity={0.7} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: '#B88700' }]}>{props.actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {props.onClose ? (
        <TouchableOpacity onPress={props.onClose} activeOpacity={0.7} style={styles.closeBtn}>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16 }}>×</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '800' },
  message: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  actionBtn: { marginTop: 8, alignSelf: 'flex-start' },
  actionText: { fontSize: 12, fontWeight: '800' },
  closeBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});

