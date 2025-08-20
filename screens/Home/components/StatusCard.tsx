import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, ProgressBar, Icon, TouchableRipple } from 'react-native-paper';
import { StatusCardData } from '../types';

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent':
        return '#34C759'; // Green
      case 'good':
        return '#007AFF'; // Blue
      case 'warning':
        return '#FFCC00'; // Yellow
      case 'critical':
        return '#FF3B30'; // Red
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
            <ProgressBar indeterminate style={styles.loadingBar} color={theme.colors.primary} />
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
            <ProgressBar
              progress={percentage / 100}
              color={statusColor}
              style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
            />
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
  progressBar: {
    height: 6,
    borderRadius: 3,
    flex: 1,
    marginRight: 6,
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
  loadingBar: {
    width: '80%',
  },
});
