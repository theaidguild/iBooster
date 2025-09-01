import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, List, Switch, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useStableColors } from '../../../hooks/useStableColors';

interface MediaSettingsProps {
  mediaScansEnabled: boolean;
  hasMediaPermission: boolean;
  mediaScanTimeLimitMs: number;
  scanDeepFolders: boolean;
  isLoading: boolean;
  isScanning: boolean;
  onToggleMediaScans: () => void;
  onSaveMediaScanTimeLimit: (limit: number) => void;
  onSaveScanDeepFolders: (enabled: boolean) => void;
}

export const MediaSettings: React.FC<MediaSettingsProps> = ({
  mediaScansEnabled,
  hasMediaPermission,
  mediaScanTimeLimitMs,
  scanDeepFolders,
  isLoading,
  isScanning,
  onToggleMediaScans,
  onSaveMediaScanTimeLimit,
  onSaveScanDeepFolders,
}) => {
  const { t } = useTranslation();
  const colors = useStableColors();

  return (
    <Card style={[styles.card, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.mediaToggleContainer}>
          <List.Item
            title={t('storage.mediaToggle.title')}
            description={t('storage.mediaToggle.description')}
            left={(props) => <List.Icon {...props} icon="image-multiple" />}
            right={() => (
              <Switch
                value={mediaScansEnabled && hasMediaPermission}
                onValueChange={onToggleMediaScans}
                disabled={isLoading || isScanning}
              />
            )}
            style={styles.mediaToggleItem}
          />
          
          {mediaScansEnabled && hasMediaPermission && (
            <>
              <List.Item
                title={t('storage.options.mediaScanTimeLimit')}
                description={
                  mediaScanTimeLimitMs === 0
                    ? t('storage.options.noTimeLimit')
                    : t('storage.options.seconds', {
                        count: Math.round(mediaScanTimeLimitMs / 1000),
                      })
                }
                left={(props) => <List.Icon {...props} icon="timer-outline" />}
                right={() => (
                  <View style={styles.timeLimitButtons}>
                    <Button
                      compact
                      onPress={() => onSaveMediaScanTimeLimit(15000)}
                      disabled={isScanning}
                      style={styles.timeLimitButton}
                    >
                      15s
                    </Button>
                    <Button
                      compact
                      onPress={() => onSaveMediaScanTimeLimit(30000)}
                      disabled={isScanning}
                      style={styles.timeLimitButton}
                    >
                      30s
                    </Button>
                    <Button
                      compact
                      onPress={() => onSaveMediaScanTimeLimit(60000)}
                      disabled={isScanning}
                      style={styles.timeLimitButton}
                    >
                      60s
                    </Button>
                    <Button
                      compact
                      onPress={() => onSaveMediaScanTimeLimit(0)}
                      disabled={isScanning}
                    >
                      {t('storage.options.noTimeLimit')}
                    </Button>
                  </View>
                )}
              />
              <List.Item
                title={t('storage.options.scanDeepFolders.title')}
                description={t('storage.options.scanDeepFolders.description')}
                left={(props) => <List.Icon {...props} icon="folder-search" />}
                right={() => (
                  <Switch
                    value={scanDeepFolders}
                    onValueChange={onSaveScanDeepFolders}
                    disabled={isLoading || isScanning}
                  />
                )}
              />
            </>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginTop: 8,
  },
  mediaToggleContainer: {
    marginTop: 8,
  },
  mediaToggleItem: {
    paddingHorizontal: 0,
  },
  timeLimitButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeLimitButton: {
    marginRight: 4,
  },
});