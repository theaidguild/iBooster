import { useMemo } from 'react';
import { useTheme } from 'react-native-paper';

export type StableColors = {
  background: string;
  surface: string;
  onSurface: string;
  onSurfaceVariant: string;
  errorContainer: string;
  onErrorContainer: string;
  primary: string;
};

export function useStableColors(): StableColors {
  const theme = useTheme();
  // Pick only the colors we actually use to keep the memo narrow and stable
  return useMemo(
    () => ({
      background: theme.colors.background,
      surface: theme.colors.surface,
      onSurface: theme.colors.onSurface,
      onSurfaceVariant: theme.colors.onSurfaceVariant,
      errorContainer: theme.colors.errorContainer,
      onErrorContainer: theme.colors.onErrorContainer,
      primary: theme.colors.primary,
    }),
    [
      theme.colors.background,
      theme.colors.surface,
      theme.colors.onSurface,
      theme.colors.onSurfaceVariant,
      theme.colors.errorContainer,
      theme.colors.onErrorContainer,
      theme.colors.primary,
    ],
  );
}
