import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  List,
  Button,
  useTheme,
  IconButton,
  Portal,
  Dialog,
  Paragraph,
  ProgressBar,
} from 'react-native-paper';
import { CleanupSuggestion } from '../../../hooks/useStorageAnalyzer';
import { Colors } from '../../../colors';

interface CleanupSuggestionsProps {
  suggestions: CleanupSuggestion[];
  isLoading?: boolean;
  formatBytes: (bytes: number) => string;
  onRefreshAfterCleanup?: () => void;
}

export const CleanupSuggestions: React.FC<CleanupSuggestionsProps> = ({
  suggestions,
  isLoading = false,
  formatBytes,
  onRefreshAfterCleanup,
}) => {
  const theme = useTheme();
  const [executingSuggestion, setExecutingSuggestion] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);

  const getIconColor = (type: CleanupSuggestion['type']): string => {
    switch (type) {
      case 'cache':
        return Colors.status.critical; // Red for cache cleanup
      case 'temp':
        return Colors.status.warning; // Amber for temp files
      case 'media':
        return Colors.primary[700]; // Cyan for media optimization
      case 'settings':
        return Colors.status.excellent; // Green for settings optimization
      default:
        return theme.colors.primary;
    }
  };

  const executeSuggestion = async (suggestion: CleanupSuggestion) => {
    setExecutingSuggestion(suggestion.id);

    try {
      const success = await suggestion.action();

      if (success) {
        Alert.alert(
          'Success',
          suggestion.estimatedSize > 0
            ? `${suggestion.title} completed successfully! Freed up ${formatBytes(suggestion.estimatedSize)}.`
            : `${suggestion.title} completed successfully!`,
        );

        // Refresh storage data after cleanup
        if (onRefreshAfterCleanup) {
          onRefreshAfterCleanup();
        }
      } else {
        Alert.alert(
          'Action Failed',
          `${suggestion.title} could not be completed. Please try again or check if you have the necessary permissions.`,
        );
      }
    } catch (error) {
      console.error('Error executing suggestion:', error);
      Alert.alert(
        'Error',
        `An error occurred while executing ${suggestion.title}. Please try again.`,
      );
    } finally {
      setExecutingSuggestion(null);
      setShowConfirmDialog(null);
    }
  };

  const handleSuggestionPress = (suggestion: CleanupSuggestion) => {
    if (suggestion.type === 'cache' || suggestion.estimatedSize > 10 * 1024 * 1024) {
      // Show confirmation for cache clearing or large operations
      setShowConfirmDialog(suggestion.id);
    } else {
      // Execute directly for settings/small operations
      executeSuggestion(suggestion);
    }
  };

  const renderSuggestionItem = (suggestion: CleanupSuggestion) => {
    const isExecuting = executingSuggestion === suggestion.id;
    const iconColor = getIconColor(suggestion.type);

    return (
      <List.Item
        key={suggestion.id}
        title={suggestion.title}
        description={
          <View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {suggestion.description}
            </Text>
            {suggestion.estimatedSize > 0 && (
              <Text variant="labelMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>
                Potential savings: {formatBytes(suggestion.estimatedSize)}
              </Text>
            )}
          </View>
        }
        left={(props) => <List.Icon {...props} icon={suggestion.icon} color={iconColor} />}
        right={() => (
          <Button
            mode={suggestion.type === 'cache' ? 'contained-tonal' : 'outlined'}
            onPress={() => handleSuggestionPress(suggestion)}
            disabled={isExecuting}
            loading={isExecuting}
            compact
          >
            {suggestion.type === 'settings'
              ? 'Open'
              : suggestion.type === 'cache'
                ? 'Clear'
                : 'Run'}
          </Button>
        )}
        style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton icon="check-circle" size={48} iconColor={theme.colors.primary} />
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
        All Clean!
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
      >
        No cleanup suggestions available. Your storage is optimized!
      </Text>
    </View>
  );

  const confirmationSuggestion = suggestions.find((s) => s.id === showConfirmDialog);

  if (isLoading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            Cleanup Suggestions
          </Text>
          <View style={styles.loadingContainer}>
            <ProgressBar indeterminate color={theme.colors.primary} />
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}
            >
              Analyzing cleanup opportunities...
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            Cleanup Suggestions
          </Text>
          {suggestions.length > 0 && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {suggestions.length > 0 ? (
          <View style={styles.suggestionsContainer}>{suggestions.map(renderSuggestionItem)}</View>
        ) : (
          renderEmptyState()
        )}
      </Card.Content>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={showConfirmDialog !== null} onDismiss={() => setShowConfirmDialog(null)}>
          <Dialog.Title>Confirm Action</Dialog.Title>
          <Dialog.Content>
            {confirmationSuggestion && (
              <View>
                <Paragraph>{confirmationSuggestion.description}</Paragraph>
                {confirmationSuggestion.estimatedSize > 0 && (
                  <Paragraph style={{ marginTop: 12, fontWeight: 'bold' }}>
                    This will free up approximately{' '}
                    {formatBytes(confirmationSuggestion.estimatedSize)}.
                  </Paragraph>
                )}
                {confirmationSuggestion.type === 'cache' && (
                  <Paragraph style={{ marginTop: 12, fontStyle: 'italic' }}>
                    Note: Clearing cache may cause apps to take longer to load initially.
                  </Paragraph>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmDialog(null)}>Cancel</Button>
            <Button
              onPress={() => confirmationSuggestion && executeSuggestion(confirmationSuggestion)}
              disabled={executingSuggestion !== null}
            >
              Continue
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  loadingContainer: {
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestionsContainer: {
    gap: 8,
  },
  listItem: {
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});
