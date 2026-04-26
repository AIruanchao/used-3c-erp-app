import { useTheme } from 'react-native-paper';
import { useMemo } from 'react';

/**
 * 生成dark mode兼容的文本颜色。
 * 用法: const tc = useTextColors();
 *      <Text style={{ color: tc.primary }}>标题</Text>
 *      <Text style={{ color: tc.secondary }}>辅助文字</Text>
 */
export function useTextColors() {
  const theme = useTheme();
  return useMemo(
    () => ({
      primary: theme.colors.onSurface,        // 主文字（dark: ~white, light: ~black）
      secondary: theme.colors.onSurfaceVariant, // 次要文字
      hint: theme.colors.onSurfaceVariant,     // placeholder/hint
      disabled: theme.colors.onSurfaceDisabled, // 禁用态
    }),
    [theme],
  );
}
