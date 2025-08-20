import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, Button } from 'react-native-paper';
import { QuickActionData } from '../types';

interface QuickActionsProps {
  actions: QuickActionData[];
  isLoading?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, isLoading = false }) => {
  const theme = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
            Quick Actions
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <Button
              key={index}
              mode={index === 0 ? 'contained' : 'outlined'}
              onPress={action.onPress}
              style={[
                styles.actionButton,
                index === 0 && { backgroundColor: theme.colors.primary },
              ]}
              contentStyle={styles.buttonContent}
              icon={action.icon}
              disabled={isLoading}
              accessible={true}
              accessibilityLabel={action.title}
              accessibilityHint={`Tap to ${action.title.toLowerCase()}`}
              accessibilityRole="button"
            >
              {action.title}
            </Button>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  content: {
    paddingVertical: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
