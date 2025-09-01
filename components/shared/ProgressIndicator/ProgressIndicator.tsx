import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';
import { Colors } from '../../../colors';
import { DesignTokens } from '../../../styles/tokens';

interface ProgressIndicatorProps {
  value: number; // 0-100
  status?: 'excellent' | 'good' | 'warning' | 'critical';
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  status,
  showPercentage = true,
  showLabel = false,
  label,
  size = 'medium',
  style,
}) => {
  const theme = useTheme();

  const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));
  const clampedValue = clamp(value) / 100; // Convert to 0-1 range

  const getStatusColor = (): string => {
    if (status) {
      switch (status) {
        case 'excellent':
          return Colors.status.excellent;
        case 'good':
          return Colors.status.good;
        case 'warning':
          return Colors.status.warning;
        case 'critical':
          return Colors.status.critical;
        default:
          return theme.colors.primary;
      }
    }

    // Auto-determine status based on value
    if (value >= 80) return Colors.status.excellent;
    if (value >= 60) return Colors.status.good;
    if (value >= 40) return Colors.status.warning;
    return Colors.status.critical;
  };

  const getProgressHeight = (): number => {
    switch (size) {
      case 'small':
        return 4;
      case 'large':
        return 12;
      default:
        return 8;
    }
  };

  const getTextVariant = (): 'labelSmall' | 'labelMedium' | 'bodyMedium' => {
    switch (size) {
      case 'small':
        return 'labelSmall';
      case 'large':
        return 'bodyMedium';
      default:
        return 'labelMedium';
    }
  };

  const progressColor = getStatusColor();
  const progressHeight = getProgressHeight();
  const textVariant = getTextVariant();

  return (
    <View style={[styles.container, style]}>
      {showLabel && label && (
        <Text variant={textVariant} style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      )}

      <View style={styles.progressContainer}>
        <ProgressBar
          progress={clampedValue}
          color={progressColor}
          style={[
            styles.progressBar,
            {
              height: progressHeight,
              backgroundColor: `${progressColor}20`,
            },
          ]}
        />

        {showPercentage && (
          <Text
            variant={textVariant}
            style={[
              styles.percentage,
              { color: theme.colors.onSurfaceVariant },
              size === 'small' && styles.percentageSmall,
            ]}
          >
            {Math.round(value)}%
          </Text>
        )}
      </View>
    </View>
  );
};

// Circular progress indicator for different use cases
interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  status?: 'excellent' | 'good' | 'warning' | 'critical';
  showPercentage?: boolean;
  style?: ViewStyle;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 60,
  strokeWidth = 6,
  status,
  showPercentage = true,
  style,
}) => {
  const theme = useTheme();

  const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));
  const clampedValue = clamp(value);

  const getStatusColor = (): string => {
    if (status) {
      switch (status) {
        case 'excellent':
          return Colors.status.excellent;
        case 'good':
          return Colors.status.good;
        case 'warning':
          return Colors.status.warning;
        case 'critical':
          return Colors.status.critical;
        default:
          return theme.colors.primary;
      }
    }

    // Auto-determine status based on value
    if (value >= 80) return Colors.status.excellent;
    if (value >= 60) return Colors.status.good;
    if (value >= 40) return Colors.status.warning;
    return Colors.status.critical;
  };

  const progressColor = getStatusColor();

  return (
    <View style={[styles.circularContainer, { width: size, height: size }, style]}>
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        {/* Background circle */}
        <View
          style={[
            styles.circularTrack,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: `${progressColor}20`,
            },
          ]}
        />
        {/* Progress arc - would need SVG for true circular progress */}
        <View
          style={[
            styles.circularFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: progressColor,
              borderRightColor: `${progressColor}20`,
              borderBottomColor: `${progressColor}20`,
              transform: [{ rotate: `${(clampedValue / 100) * 360}deg` }],
            },
          ]}
        />
      </View>

      {showPercentage && (
        <View style={styles.circularText}>
          <Text variant="titleMedium" style={[styles.circularPercentage, { color: progressColor }]}>
            {Math.round(clampedValue)}
          </Text>
          <Text
            variant="labelSmall"
            style={[styles.circularUnit, { color: theme.colors.onSurfaceVariant }]}
          >
            %
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: DesignTokens.spacing.xs,
  },
  label: {
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  progressBar: {
    flex: 1,
    borderRadius: DesignTokens.borderRadius.sm,
  },
  percentage: {
    minWidth: 40,
    textAlign: 'right',
    fontWeight: '500',
  },
  percentageSmall: {
    minWidth: 32,
  },
  circularContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgress: {
    position: 'absolute',
  },
  circularTrack: {
    position: 'absolute',
  },
  circularFill: {
    position: 'absolute',
  },
  circularText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularPercentage: {
    fontWeight: '700',
    lineHeight: 20,
  },
  circularUnit: {
    marginTop: -2,
  },
});
