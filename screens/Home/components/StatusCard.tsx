import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, Icon, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import { StatusCardData } from '../types';
import { Colors } from '../../../colors';

interface StatusCardProps extends StatusCardData {
  isLoading?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  percentage,
  status,
  icon,
  onPress,
  isLoading = false,
}) => {
  const theme = useTheme();

  const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));
  const hexToRgba = (hex: string, alpha: number) => {
    // Support formats like #RRGGBB or #RGB
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
        return Colors.status.excellent; // Bright green from rocket color scheme
      case 'good':
        return Colors.status.good; // Blue from rocket color scheme
      case 'warning':
        return Colors.status.warning; // Amber
      case 'critical':
        return Colors.status.critical; // Red
      default:
        return theme.colors.primary;
    }
  };

  const statusColor = getStatusColor(status);

  if (isLoading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating size="small" color={theme.colors.primary} />
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <TouchableRipple
        onPress={onPress}
        borderless
        style={styles.touchable}
        accessible={true}
        accessibilityLabel={`${title}: ${value}`}
        accessibilityHint={`Tap to view ${title.toLowerCase()} details`}
        accessibilityRole="button"
      >
        <Card.Content style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.textCol}>
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
            <View style={[styles.iconWrap, { backgroundColor: `${statusColor}1A` }]}>
              <Icon source={icon} size={18} color={statusColor} />
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[styles.progressTrack, { backgroundColor: hexToRgba(statusColor, 0.15) }]}
              accessible
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: clamp(Number.isFinite(percentage) ? percentage : 0),
              }}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${clamp(Number.isFinite(percentage) ? percentage : 0)}%`,
                    backgroundColor: statusColor,
                  },
                ]}
              />
            </View>
            <Text
              variant="labelMedium"
              style={[styles.percentage, { color: theme.colors.onSurfaceVariant }]}
            >
              {percentage}%
            </Text>
          </View>
        </Card.Content>
      </TouchableRipple>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    // Fixed width approach for stability
    width: '31%',
    height: 140,
    marginHorizontal: '1%',
    marginVertical: 8,
    elevation: 2,
    borderRadius: 16,
  },
  touchable: {
    borderRadius: 16,
    height: '100%',
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  textCol: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 12,
  },
  value: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 1,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    flex: 1,
    marginRight: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  percentage: {
    fontSize: 10,
    fontWeight: '600',
    width: 25,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
