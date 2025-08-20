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
            <ProgressBar 
              indeterminate 
              style={styles.loadingBar}
              color={theme.colors.primary}
            />
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
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Icon 
                source={icon} 
                size={24} 
                color={statusColor}
              />
              <Text 
                variant="titleMedium" 
                style={[styles.title, { color: theme.colors.onSurface }]}
              >
                {title}
              </Text>
            </View>
            <Text 
              variant="titleLarge" 
              style={[styles.value, { color: statusColor }]}
            >
              {value}
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={percentage / 100}
              color={statusColor}
              style={[
                styles.progressBar,
                { backgroundColor: theme.colors.surfaceVariant }
              ]}
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
    flex: 1,
    marginHorizontal: 6,
    marginVertical: 8,
    elevation: 2,
    borderRadius: 12,
  },
  touchable: {
    borderRadius: 12,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontWeight: '600',
  },
  value: {
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  percentage: {
    fontSize: 12,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingBar: {
    width: '100%',
  },
});