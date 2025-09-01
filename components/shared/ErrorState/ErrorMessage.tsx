import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Icon, useTheme } from 'react-native-paper';
import { AppCard } from '../Card/AppCard';
import { Colors } from '../../../colors';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  onRetry,
  retryText = 'Retry',
  variant = 'default',
}) => {
  const theme = useTheme();

  return (
    <AppCard variant={variant} spacing="comfortable">
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Icon 
            source="alert-circle-outline" 
            size={48} 
            color={Colors.status.critical} 
          />
        </View>
        
        <Text 
          variant="titleMedium" 
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          {title}
        </Text>
        
        <Text 
          variant="bodyMedium" 
          style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
        >
          {message}
        </Text>
        
        {onRetry && (
          <Button 
            mode="contained" 
            onPress={onRetry}
            style={styles.retryButton}
          >
            {retryText}
          </Button>
        )}
      </View>
    </AppCard>
  );
};

interface NetworkErrorProps {
  onRetry?: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry }) => {
  return (
    <ErrorMessage
      title="Connection Error"
      message="Unable to connect to the network. Please check your internet connection and try again."
      onRetry={onRetry}
      retryText="Try Again"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  message: {
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
  },
});