import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════
//  COLORS — Material Design 3 palette (Eventify burgundy theme)
// ═══════════════════════════════════════════════════════════════
export const Colors = {
  // ─── Primary (Burgundy) ───────────────────────────────────
  primary: '#3b0008',              // Burgundy sangat gelap
  primaryContainer: '#5b0f18',     // 🍷 Burgundy utama (header/nav)
  onPrimary: '#ffffff',
  onPrimaryContainer: '#e07578',
  primaryFixed: '#ffdad9',
  primaryFixedDim: '#ffb3b3',
  onPrimaryFixed: '#400009',
  onPrimaryFixedVariant: '#7e2a2f',

  // ─── Secondary (Rose) ─────────────────────────────────────
  secondary: '#a13c46',
  secondaryContainer: '#fe848c',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#751b28',
  secondaryFixed: '#ffdada',
  secondaryFixedDim: '#ffb3b5',
  onSecondaryFixed: '#40000c',
  onSecondaryFixedVariant: '#822530',

  // ─── Tertiary (Dark Rose) ─────────────────────────────────
  tertiary: '#2c1011',
  tertiaryContainer: '#442425',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#b78989',
  tertiaryFixed: '#ffdad9',
  tertiaryFixedDim: '#edbaba',
  onTertiaryFixed: '#2f1314',
  onTertiaryFixedVariant: '#613d3e',

  // ─── Error ────────────────────────────────────────────────
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  // ─── Surface & Background ─────────────────────────────────
  background: '#fcf9f8',
  onBackground: '#1b1b1c',
  surface: '#fcf9f8',
  onSurface: '#1b1b1c',
  surfaceVariant: '#e5e2e1',
  onSurfaceVariant: '#554242',
  surfaceTint: '#9c4145',
  surfaceDim: '#dcd9d9',
  surfaceBright: '#fcf9f8',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f6f3f2',
  surfaceContainer: '#f0eded',
  surfaceContainerHigh: '#eae7e7',
  surfaceContainerHighest: '#e5e2e1',

  // ─── Outline ──────────────────────────────────────────────
  outline: '#887271',
  outlineVariant: '#dbc0c0',

  // ─── Inverse ──────────────────────────────────────────────
  inverseSurface: '#303030',
  inverseOnSurface: '#f3f0ef',
  inversePrimary: '#ffb3b3',

  // ─── Utility ──────────────────────────────────────────────
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(48,48,48,0.6)',
  backdrop: 'rgba(0,0,0,0.4)',

  // Di dalam Colors object, tambahkan:
  espresso: '#1e1e1e',
  burgundy: '#5b0f18',
  wine: '#7a1f2b',
  roseDust: '#d8a7a7',
  cream: '#f8f1e7',
} as const;

export type ColorKey = keyof typeof Colors;

// ═══════════════════════════════════════════════════════════════
//  FONTS — Outfit (loaded via @expo-google-fonts/outfit)
// ═══════════════════════════════════════════════════════════════
export const Fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;

// ═══════════════════════════════════════════════════════════════
//  FONT SIZES — sesuai Tailwind config HTML
// ═══════════════════════════════════════════════════════════════
export const FontSizes = {
  'label-sm': { size: 11, lineHeight: 14, letterSpacing: 0.08 * 11, weight: '700' },
  'label-lg': { size: 14, lineHeight: 20, letterSpacing: 0.04 * 14, weight: '600' },
  'body-sm': { size: 13, lineHeight: 18, letterSpacing: 0.01 * 13, weight: '400' },
  'body-md': { size: 15, lineHeight: 22, letterSpacing: 0, weight: '400' },
  'body-lg': { size: 17, lineHeight: 26, letterSpacing: 0, weight: '400' },
  'headline-sm': { size: 20, lineHeight: 28, letterSpacing: -0.005 * 20, weight: '600' },
  'headline-lg': { size: 28, lineHeight: 36, letterSpacing: -0.01 * 28, weight: '600' },
  'headline-xl': { size: 36, lineHeight: 44, letterSpacing: -0.02 * 36, weight: '600' },
  'headline-xl-mobile': { size: 28, lineHeight: 34, letterSpacing: -0.01 * 28, weight: '600' },
  'display-hero': { size: 56, lineHeight: 64, letterSpacing: -0.03 * 56, weight: '700' },
  'display-hero-mobile': { size: 38, lineHeight: 44, letterSpacing: -0.02 * 38, weight: '700' },
} as const;

// ═══════════════════════════════════════════════════════════════
//  SPACING — konsisten dengan margin/gutter design
// ═══════════════════════════════════════════════════════════════
export const Spacing = {
  xs: 4,       // space-xs
  sm: 8,       // space-sm
  md: 16,      // space-md
  lg: 24,      // space-lg
  xl: 40,      // space-xl
  '2xl': 64,   // space-2xl
  margin: 20,  // margin (1.25rem)
  gutter: 20,  // gutter
} as const;

// ═══════════════════════════════════════════════════════════════
//  RADIUS
// ═══════════════════════════════════════════════════════════════
export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ═══════════════════════════════════════════════════════════════
//  HAIRLINE — garis 0.5px (iOS) / 1px (Android)
// ═══════════════════════════════════════════════════════════════
export const Hairline = Platform.OS === 'ios' ? 0.5 : 1;

// ═══════════════════════════════════════════════════════════════
//  SHADOWS — cross-platform (elevation Android + shadow iOS)
// ═══════════════════════════════════════════════════════════════
export const Shadows = {
  none: {},

  sm: {
    shadowColor: '#1e1e1e',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  card: {
    shadowColor: '#1e1e1e',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  md: {
    shadowColor: '#1e1e1e',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  /** Untuk header (bawah) */
  header: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  /** Untuk bottom nav (atas) */
  bottomNav: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },

  /** Overlay modal */
  modal: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//  TYPOGRAPHY PRESETS — siap pakai di StyleSheet
// ═══════════════════════════════════════════════════════════════
export const Typography = {
  labelSm: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.88,
  },
  labelLg: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.56,
  },
  bodySm: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.13,
  },
  bodyMd: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyLg: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
  },
  headlineSm: {
    fontFamily: Fonts.semibold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.1,
  },
  headlineLg: {
    fontFamily: Fonts.semibold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.28,
  },
  headlineXlMobile: {
    fontFamily: Fonts.semibold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.28,
  },
  displayHeroMobile: {
    fontFamily: Fonts.bold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.76,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//  LAYOUT CONSTANTS — ukuran komponen fixed
// ═══════════════════════════════════════════════════════════════
export const Layout = {
  headerHeight: 64,
  bottomNavHeight: 68,
  bottomNavInnerHeight: 52,
  iconBtnSize: 44,
  avatarSm: 32,
  avatarMd: 36,
  avatarLg: 84,
} as const;

// ═══════════════════════════════════════════════════════════════
//  STATUS BAR — warna untuk <StatusBar style="..." />
// ═══════════════════════════════════════════════════════════════
export const StatusBarStyle = {
  /** Area dengan header gelap (burgundy) */
  onDark: 'light' as const,
  /** Area dengan background terang (login/register) */
  onLight: 'dark' as const,
};

// ═══════════════════════════════════════════════════════════════
//  LEGACY EXPORT — supaya `theme` masih bisa dipakai
//  (kompatibel dengan kode lama `import { theme } from '@/constants/auth-theme'`)
// ═══════════════════════════════════════════════════════════════
export const theme = {
  // Brand
  primary: Colors.primary,
  primaryContainer: Colors.primaryContainer,
  onPrimary: Colors.onPrimary,

  // Secondary
  secondary: Colors.secondary,
  secondaryContainer: Colors.secondaryContainer,
  secondaryFixed: Colors.secondaryFixed,
  onSecondaryContainer: Colors.onSecondaryContainer,

  // Surface
  bg: Colors.background,
  surface: Colors.surface,
  surfaceContainerLowest: Colors.surfaceContainerLowest,
  surfaceContainerLow: Colors.surfaceContainerLow,
  surfaceContainer: Colors.surfaceContainer,
  surfaceContainerHigh: Colors.surfaceContainerHigh,
  surfaceContainerHighest: Colors.surfaceContainerHighest,
  surfaceVariant: Colors.surfaceVariant,

  // Text
  text: Colors.onSurface,
  muted: Colors.onSurfaceVariant,
  outline: Colors.outline,

  // Component
  card: Colors.surfaceContainerLowest,
  input: Colors.surfaceContainerLow,
  border: Colors.outlineVariant,

  // Feedback
  danger: Colors.error,
  dangerContainer: Colors.errorContainer,

  // Radius
  radius: Radius.lg,
  radiusLg: Radius.xl,
  radiusFull: Radius.full,

  // Hairline
  hairline: Hairline,
} as const;

// ═══════════════════════════════════════════════════════════════
//  DEFAULT EXPORT — biar bisa `import theme from '@/constants/theme'`
// ═══════════════════════════════════════════════════════════════
export default {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  Hairline,
  Shadows,
  Typography,
  Layout,
  StatusBarStyle,
  theme,
};