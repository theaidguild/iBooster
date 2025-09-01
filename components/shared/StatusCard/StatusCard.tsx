import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TouchableRipple, ActivityIndicator, Icon, useTheme } from 'react-native-paper';
import { AppCard } from '../Card/AppCard';
import { Colors } from '../../../colors';

interface StatusCardProps {
  title: string;
  value: string;
  percentage?: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: string;
  onPress?: () => void;
  isLoading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  percentage,
  status,
  icon,
  onPress,
  isLoading = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();

  const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

  const hexToRgba = (hex: string, alpha: number) => {
    const normalized = hex.replace('#', '');
    const isShort = normalized.length === 3;
    const r = parseInt(isShort ? normalized[0] + normalized[0] : normalized.substring(0, 2), 16);
    const g = parseInt(isShort ? normalized[1] + normalized[1] : normalized.substring(2, 4), 16);
    const b = parseInt(isShort ? normalized[2] + normalized[2] : normalized.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getStatusColor = (status: string): string => {
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
  };

  const statusColor = getStatusColor(status);

  if (isLoading) {
    return (
      <AppCard variant="default" spacing="default">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </AppCard>
    );
  }

  const content = (
    <View style={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.textColumn}>
          <Text
            variant="titleSmall"
            style={[styles.title, { color: theme.colors.onSurface }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <Text
            variant="headlineSmall"
            style={[styles.value, { color: statusColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {value}
          </Text>
        </View>
        <View style={[styles.iconContainer, { backgroundColor: hexToRgba(statusColor, 0.1) }]}>
          <Icon source={icon} size={18} color={statusColor} />
        </View>
      </View>

      {percentage !== undefined && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: hexToRgba(statusColor, 0.15) }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: statusColor,
                  width: `${clamp(percentage)}%`,
                },
              ]}
            />
          </View>
          <Text
            variant="labelSmall"
            style={[styles.percentageText, { color: theme.colors.onSurfaceVariant }]}
          >
            {Math.round(percentage)}%
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <AppCard variant="default" spacing="default">
        <TouchableRipple
          onPress={onPress}
          borderless
          style={styles.touchable}
          accessible={true}
          accessibilityLabel={accessibilityLabel || `${title}: ${value}`}
          accessibilityHint={accessibilityHint || `Tap to view ${title.toLowerCase()} details`}
          accessibilityRole="button"
        >
          {content}
        </TouchableRipple>
      </AppCard>
    );
  }

  return (
    <AppCard variant="default" spacing="default">
      {content}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  content: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontWeight: '500',
  },
  value: {
    fontWeight: '700',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  percentageText: {
    minWidth: 32,
    textAlign: 'right',
  },
  touchable: {
    borderRadius: 12,
  },
});
