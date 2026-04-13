import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { usePreferencesStore } from '@/stores/preferencesStore';

// ─── Semantic Color Tokens ───────────────────────────────────────────────────

const lightColors = {
  background: Colors.white,
  surface: Colors.neutral[50],
  surfaceElevated: Colors.white,
  text: Colors.neutral[900],
  textSecondary: Colors.neutral[500],
  textTertiary: Colors.neutral[400],
  border: Colors.neutral[200],
  borderFocused: Colors.primary[500],
  primary: Colors.primary[600],
  primaryLight: Colors.primary[100],
  error: Colors.error[600],
  errorLight: Colors.error[50],
  success: Colors.success[600],
  successLight: Colors.success[50],
  warning: Colors.warning[600],
  warningLight: Colors.warning[50],
  icon: Colors.neutral[500],
  iconActive: Colors.primary[600],
  tabBar: Colors.white,
  card: Colors.white,
  shadow: Colors.neutral[900],
} as const;

const darkColors = {
  background: Colors.neutral[950],
  surface: Colors.neutral[900],
  surfaceElevated: Colors.neutral[800],
  text: Colors.white,
  textSecondary: Colors.neutral[400],
  textTertiary: Colors.neutral[500],
  border: Colors.neutral[700],
  borderFocused: Colors.primary[400],
  primary: Colors.primary[500],
  primaryLight: Colors.primary[950],
  error: Colors.error[500],
  errorLight: Colors.error[700],
  success: Colors.success[500],
  successLight: Colors.success[700],
  warning: Colors.warning[500],
  warningLight: Colors.warning[700],
  icon: Colors.neutral[400],
  iconActive: Colors.primary[400],
  tabBar: Colors.neutral[900],
  card: Colors.neutral[800],
  shadow: Colors.black,
} as const;

export type SemanticColors = typeof lightColors | typeof darkColors;

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useColors(): SemanticColors {
  const isDark = usePreferencesStore((s) => s.isDarkMode);
  return isDark ? darkColors : lightColors;
}

export function useTheme() {
  const isDark = usePreferencesStore((s) => s.isDarkMode);
  const toggleTheme = usePreferencesStore((s) => s.toggleDarkMode);

  return {
    isDark,
    toggleTheme,
    colors: isDark ? darkColors : lightColors,
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: Shadows,
  };
}
