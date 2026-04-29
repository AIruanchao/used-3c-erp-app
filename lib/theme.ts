/**
 * App theme constants — single source of truth for brand colors.
 *
 * 品牌色 #FFD700 不变，只是从硬编码改为引用。
 * 浅色模式下 #FFD700 背景 + 白字对比度仅 1.7:1（WCAG 要求 4.5:1），
 * 因此提供 BRAND_TEXT_ON_BRAND 深色文字常量。
 */

/** 主品牌色 — 金色 */
export const BRAND_COLOR = '#FFD700';

/** 强调/次要品牌色 — 橙色 */
export const BRAND_ACCENT = '#FF6D00';

/**
 * 品牌色背景上的文字色。
 * 浅色模式用深色（#1a1a1a）保证 4.5:1+ 对比度；
 * 暗色模式仍可用白色。
 */
export const BRAND_TEXT_ON_BRAND_LIGHT = '#1a1a1a';
export const BRAND_TEXT_ON_BRAND_DARK = '#FFFFFF';

/** 品牌色背景的浅色变体（柔和底色） */
export const BRAND_SURFACE_LIGHT = '#FFF8E1';

/** 辅助：品牌色相关的完整色板 */
export const BrandPalette = {
  main: BRAND_COLOR,
  accent: BRAND_ACCENT,
  surface: BRAND_SURFACE_LIGHT,
  textOnBrandLight: BRAND_TEXT_ON_BRAND_LIGHT,
  textOnBrandDark: BRAND_TEXT_ON_BRAND_DARK,
} as const;
