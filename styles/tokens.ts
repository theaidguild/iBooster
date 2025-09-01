// Design System Tokens
// Consistent values for spacing, typography, and other design elements

export const DesignTokens = {
  // Spacing system based on 4px baseline grid
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  // Border radius values for consistent rounded corners
  borderRadius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // Elevation/shadow levels for Material Design consistency
  elevation: {
    none: 0,
    card: 2,
    button: 4,
    modal: 8,
    drawer: 16,
    dropdown: 4,
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Common dimensions
  dimensions: {
    minTouchTarget: 44,
    iconSize: {
      sm: 16,
      md: 24,
      lg: 32,
      xl: 48,
    },
  },
} as const;

// Type for TypeScript autocompletion
export type SpacingValue = keyof typeof DesignTokens.spacing;
export type BorderRadiusValue = keyof typeof DesignTokens.borderRadius;
export type ElevationValue = keyof typeof DesignTokens.elevation;