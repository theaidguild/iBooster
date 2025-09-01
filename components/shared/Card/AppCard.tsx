import React from 'react';
import { ViewStyle } from 'react-native';
import { Card, useTheme } from 'react-native-paper';

interface AppCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  spacing?: 'compact' | 'default' | 'comfortable';
  style?: ViewStyle;
  onPress?: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  variant = 'default',
  spacing = 'default',
  style,
  onPress,
}) => {
  const theme = useTheme();

  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          elevation: 4,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          elevation: 0,
        };
      default:
        return {
          ...baseStyle,
          elevation: 2,
        };
    }
  };

  const getContentPadding = () => {
    switch (spacing) {
      case 'compact':
        return 12;
      case 'comfortable':
        return 20;
      default:
        return 16;
    }
  };

  return (
    <Card
      style={[getCardStyle(), style]}
      onPress={onPress}
      mode={variant === 'outlined' ? 'outlined' : 'contained'}
    >
      <Card.Content style={{ padding: getContentPadding() }}>{children}</Card.Content>
    </Card>
  );
};
