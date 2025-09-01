import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { AppCard } from '../Card/AppCard';

interface LoadingCardProps {
  message?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  message = 'Loading...',
  variant = 'default',
}) => {
  const theme = useTheme();

  return (
    <AppCard variant={variant} spacing="comfortable">
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        {message && (
          <Text
            variant="bodyMedium"
            style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
          >
            {message}
          </Text>
        )}
      </View>
    </AppCard>
  );
};

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ size = 'large', message }) => {
  const theme = useTheme();

  return (
    <View style={styles.indicatorContainer}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && (
        <Text
          variant="bodyMedium"
          style={[styles.indicatorMessage, { color: theme.colors.onSurfaceVariant }]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
  },
  indicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  indicatorMessage: {
    marginTop: 8,
    textAlign: 'center',
  },
});
