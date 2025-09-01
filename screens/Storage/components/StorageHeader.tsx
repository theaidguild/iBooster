import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useStableColors } from '../../../hooks/useStableColors';

interface StorageHeaderProps {
  usingCache: boolean;
  needsRefresh?: boolean;
  onRefresh: () => void;
}

export const StorageHeader: React.FC<StorageHeaderProps> = ({
  usingCache,
  needsRefresh,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const colors = useStableColors();

  return (
    <Card style={[styles.headerCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={[styles.title, { color: colors.onSurface }]}>
            {t('storage.analysis')}
          </Text>
          {usingCache && (
            <Chip
              compact
              icon="cached"
              onPress={onRefresh}
              style={styles.cachedChip}
              selected={!!needsRefresh}
            >
              {t('storage.cached.chip')}
              {needsRefresh ? ` ${t('storage.cached.stale')}` : ''}
            </Chip>
          )}
        </View>
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
          {t('storage.subtitle')}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
  },
  cachedChip: {
    marginLeft: 8,
  },
});
