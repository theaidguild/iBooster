import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, Chip, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useStableColors } from '../../../hooks/useStableColors';

interface ProgressBannerProps {
  scanProgress: {
    phase: string;
    media: { current: number; total: number | null; cursor?: string | null };
    directories: { current: number; total: number | null };
  };
  isScanning: boolean;
  isPaused: boolean;
  hasCheckpoint: boolean;
  largeFiles: any[];
  progressPct?: number;
  estimatedRemaining?: number;
  lastScanDurationMs?: number | null;
  pauseScan: () => void;
  cancelScan: () => void;
  onResume: () => void;
}

export const StorageProgressBanner: React.FC<ProgressBannerProps> = ({
  scanProgress,
  isScanning,
  isPaused,
  hasCheckpoint,
  largeFiles,
  progressPct,
  estimatedRemaining,
  lastScanDurationMs,
  pauseScan,
  cancelScan,
  onResume,
}) => {
  const { t } = useTranslation();
  const colors = useStableColors();

  const formatDuration = (ms: number) => {
    const totalSec = Math.max(0, Math.round(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min > 0) return `${min}m ${sec}s`;
    return `${sec}s`;
  };

  if (!isScanning && !isPaused && !hasCheckpoint) {
    return null;
  }

  return (
    <Card style={[styles.card, { backgroundColor: colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={{ color: colors.onSurface }}>
            {isScanning
              ? t('storage.progress.scanning')
              : isPaused
                ? t('storage.progress.paused')
                : t('storage.progress.complete')}
          </Text>
          <View style={styles.actions}>
            {isScanning && (
              <>
                <Button mode="outlined" compact onPress={pauseScan} style={styles.actionButton}>
                  {t('storage.progress.pause')}
                </Button>
                <Button mode="text" compact onPress={cancelScan}>
                  {t('storage.progress.cancel')}
                </Button>
              </>
            )}
            {isPaused && (
              <Button mode="contained" compact onPress={onResume}>
                {t('storage.progress.resume')}
              </Button>
            )}
          </View>
        </View>

        {/* Progress indicator */}
        {progressPct !== undefined && (
          <View style={styles.progressContainer}>
            <ProgressBar progress={progressPct} color={colors.primary} style={styles.progressBar} />
            <Text
              variant="bodySmall"
              style={[styles.progressText, { color: colors.onSurfaceVariant }]}
            >
              {Math.round(progressPct * 100)}%
            </Text>
          </View>
        )}

        {/* Status details */}
        <View style={styles.statusContainer}>
          <Chip compact style={styles.statusChip}>
            {t(`storage.progress.phase.${scanProgress.phase}`)}
          </Chip>
          {largeFiles.length > 0 && (
            <Chip compact style={styles.statusChip}>
              {t('storage.progress.found', { count: largeFiles.length })}
            </Chip>
          )}
        </View>

        {/* Time estimates */}
        {estimatedRemaining && (
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
            {t('storage.progress.remaining')} {formatDuration(estimatedRemaining)}
          </Text>
        )}
        {!isScanning && lastScanDurationMs && (
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
            {t('storage.progress.lastDuration')} {formatDuration(lastScanDurationMs)}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginTop: 8,
  },
  content: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    marginRight: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 12,
    minWidth: 35,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
});
