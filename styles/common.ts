import { StyleSheet } from 'react-native';
import { DesignTokens } from './tokens';

// Common style patterns used across the app
export const CommonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card styles
  card: {
    borderRadius: DesignTokens.borderRadius.md,
    elevation: DesignTokens.elevation.card,
  },

  cardContent: {
    padding: DesignTokens.spacing.md,
  },

  cardContentCompact: {
    padding: DesignTokens.spacing.sm,
  },

  cardContentComfortable: {
    padding: DesignTokens.spacing.lg,
  },

  // Flex layouts
  row: {
    flexDirection: 'row',
  },

  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Margins and padding
  marginXs: { margin: DesignTokens.spacing.xs },
  marginSm: { margin: DesignTokens.spacing.sm },
  marginMd: { margin: DesignTokens.spacing.md },
  marginLg: { margin: DesignTokens.spacing.lg },

  paddingXs: { padding: DesignTokens.spacing.xs },
  paddingSm: { padding: DesignTokens.spacing.sm },
  paddingMd: { padding: DesignTokens.spacing.md },
  paddingLg: { padding: DesignTokens.spacing.lg },

  // Text alignment
  textCenter: { textAlign: 'center' },
  textLeft: { textAlign: 'left' },
  textRight: { textAlign: 'right' },

  // Common shadows
  shadowSm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  shadowMd: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  shadowLg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
