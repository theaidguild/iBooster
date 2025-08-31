import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Appbar,
  useTheme,
  Button,
  Card,
  Portal,
  Dialog,
  Paragraph,
  Switch,
  List,
  Snackbar,
  ProgressBar,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { useStorageAnalyzer } from '../../hooks/useStorageAnalyzer';
import { StorageBreakdownChart } from './components/StorageBreakdownChart';
import { LargeFilesList } from './components/LargeFilesList';
import { CleanupSuggestions } from './components/CleanupSuggestions';

interface StorageScreenProps {
  onNavigateBack?: () => void;
}

export const StorageScreen: React.FC<StorageScreenProps> = ({ onNavigateBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    breakdown,
    largeFiles,
    cleanupSuggestions,
    isLoading,
    isScanning,
    isPaused,
    hasMediaPermission,
    mediaPermissionRequested,
    mediaScansEnabled,
    scanProgress,
    hasCheckpoint,
    lastScanTime,
    lastScanDurationMs,
    usingCache,
    needsRefresh,
    scanStartTime,
    error,
    refresh,
    requestMediaPermission,
    clearSelectedFiles,
    formatBytes,
    saveMediaScansEnabled,
    pauseScan,
    resumeScan,
    cancelScan,
  } = useStorageAnalyzer();

  const [showMediaPermissionDialog, setShowMediaPermissionDialog] = useState(false);
  const [showResumedSnack, setShowResumedSnack] = useState(false);
  // Toggle value comes from hook persistence

  const handleRefresh = async () => {
    await refresh();
  };

  const handleMediaPermissionRequest = async () => {
    setShowMediaPermissionDialog(false);
    const granted = await requestMediaPermission();

    if (granted) {
      await saveMediaScansEnabled(true);
      Alert.alert(
        'Permission Granted',
        'Media library access enabled. You can now scan device media files.',
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert(
        'Permission Denied',
        'Media library access is required to scan device photos and videos. You can enable it later in Settings.',
        [{ text: 'OK' }],
      );
    }
  };

  const progressPct = useMemo(() => {
    if (scanProgress.phase === 'scanning-media') {
      const { current, total } = scanProgress.media;
      if (total && total > 0) return Math.min(1, current / total);
      // Fallback: approximate by directories stage done (1) plus media in progress
      return undefined;
    }
    if (scanProgress.phase === 'scanning-app' && scanProgress.directories.total) {
      return scanProgress.directories.current / (scanProgress.directories.total || 1);
    }
    return undefined;
  }, [scanProgress]);

  const formatDuration = (ms: number) => {
    const totalSec = Math.max(0, Math.round(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min > 0) return `${min}m ${sec}s`;
    return `${sec}s`;
  };

  const estimatedRemaining = useMemo(() => {
    if (
      scanProgress.phase === 'scanning-media' &&
      scanProgress.media.total &&
      scanProgress.media.current > 0 &&
      scanStartTime
    ) {
      const elapsedMs = Date.now() - scanStartTime;
      const ratio = scanProgress.media.current / (scanProgress.media.total || 1);
      if (ratio > 0 && isFinite(ratio)) {
        const totalMs = elapsedMs / ratio;
        const remainingMs = Math.max(0, totalMs - elapsedMs);
        return remainingMs;
      }
    }
    return undefined;
  }, [scanProgress, scanStartTime]);

  const handleResume = async () => {
    const ok = await resumeScan();
    if (ok) setShowResumedSnack(true);
  };

  const handleMediaToggle = async () => {
    if (!hasMediaPermission && !mediaPermissionRequested) {
      setShowMediaPermissionDialog(true);
    } else if (!hasMediaPermission) {
      Alert.alert(
        'Permission Required',
        'Media library permission is needed to scan device photos and videos. Please enable it in iOS Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // This will be handled by the cleanup suggestion
            },
          },
        ],
      );
    } else {
      await saveMediaScansEnabled(!mediaScansEnabled);
    }
  };

  const renderHeader = () => (
    <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
            {t('storage.analysis')}
          </Text>
          {usingCache && (
            <Chip
              compact
              icon="cached"
              onPress={refresh}
              style={styles.cachedChip}
              selected={!!needsRefresh}
            >
              {t('storage.cached.chip')}
              {needsRefresh ? ` ${t('storage.cached.stale')}` : ''}
            </Chip>
          )}
        </View>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('storage.subtitle')}
        </Text>

        {/* Media Permission Toggle */}
        <View style={styles.mediaToggleContainer}>
          <List.Item
            title={t('storage.mediaToggle.title')}
            description={t('storage.mediaToggle.description')}
            left={(props) => <List.Icon {...props} icon="image-multiple" />}
            right={() => (
              <Switch
                value={mediaScansEnabled && hasMediaPermission}
                onValueChange={handleMediaToggle}
                disabled={isLoading || isScanning}
              />
            )}
            style={styles.mediaToggleItem}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderError = () => {
    if (!error) return null;

    return (
      <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
        <Card.Content>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onErrorContainer, marginBottom: 8 }}
          >
            {t('storage.analysisError')}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onErrorContainer, marginBottom: 16 }}
          >
            {error}
          </Text>
          <Button
            mode="contained-tonal"
            onPress={refresh}
            icon="refresh"
            disabled={isLoading || isScanning}
          >
            {t('common.tryAgain')}
          </Button>
        </Card.Content>
      </Card>
    );
  };

  const renderProgressBanner = () => {
    const phase = scanProgress.phase;
    const isActive =
      isScanning || phase === 'paused' || phase === 'scanning-media' || phase === 'scanning-app';
    if (!isActive) return null;

    let title = 'Preparing…';
    if (phase === 'scanning-app')
      title = `Scanning app files (${scanProgress.directories.current}/${scanProgress.directories.total ?? 2})`;
    if (phase === 'scanning-media')
      title = `Scanning media (${scanProgress.media.current}${scanProgress.media.total ? `/${scanProgress.media.total}` : ''})`;
    if (phase === 'paused') title = 'Scan paused';

    return (
      <Card style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.progressHeader}>
            <View style={styles.titleContainer}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                {title}
              </Text>
              {isScanning && (
                <ActivityIndicator
                  size={16}
                  animating
                  color={theme.colors.primary}
                  style={styles.inlineSpinner}
                />
              )}
            </View>
            <View style={styles.progressButtons}>
              {isScanning && (
                <Button compact mode="text" onPress={pauseScan} disabled={isPaused}>
                  Pause
                </Button>
              )}
              {!isScanning && (isPaused || hasCheckpoint) && (
                <Button compact mode="contained-tonal" onPress={handleResume}>
                  Resume
                </Button>
              )}
              {(isScanning || isPaused) && (
                <Button compact mode="text" onPress={cancelScan}>
                  Cancel
                </Button>
              )}
            </View>
          </View>
          {progressPct !== undefined && (
            <ProgressBar progress={progressPct} style={{ marginTop: 8 }} />
          )}
          {scanProgress.phase === 'scanning-media' && estimatedRemaining !== undefined && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
            >
              {t('storage.progress.estimatedRemaining')} {formatDuration(estimatedRemaining)}
            </Text>
          )}
          {lastScanTime && !isScanning && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
            >
              Last scan: {Math.max(0, Math.floor((Date.now() - lastScanTime) / 60000))} min ago
            </Text>
          )}
          {!isScanning && lastScanDurationMs ? (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
            >
              {t('storage.progress.lastDuration')} {formatDuration(lastScanDurationMs)}
            </Text>
          ) : null}
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={onNavigateBack} />
        <Appbar.Content title={t('storage.title')} />
        <Appbar.Action icon="refresh" onPress={refresh} disabled={isLoading || isScanning} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isScanning}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        {renderHeader()}

        {/* Error Display */}
        {renderError()}

        {/* Progress Banner */}
        {renderProgressBanner()}

        {/* Storage Breakdown Chart */}
        <StorageBreakdownChart
          breakdown={breakdown}
          isLoading={isLoading}
          formatBytes={formatBytes}
        />

        {/* Large Files List */}
        <LargeFilesList
          files={largeFiles}
          isLoading={isLoading}
          formatBytes={formatBytes}
          onDeleteFiles={clearSelectedFiles}
        />

        {/* Cleanup Suggestions */}
        <CleanupSuggestions
          suggestions={cleanupSuggestions}
          isLoading={isLoading}
          formatBytes={formatBytes}
          onRefreshAfterCleanup={refresh}
        />

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Media Permission Dialog */}
      <Portal>
        <Snackbar
          visible={showResumedSnack}
          onDismiss={() => setShowResumedSnack(false)}
          duration={2500}
        >
          Scan resumed and completed.
        </Snackbar>
        <Dialog
          visible={showMediaPermissionDialog}
          onDismiss={() => setShowMediaPermissionDialog(false)}
        >
          <Dialog.Title>Media Library Access</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              To scan your device photos and videos for large files, this app needs access to your
              photo library.
            </Paragraph>
            <Paragraph style={{ marginTop: 12 }}>
              This feature is optional and you can skip it if you prefer to analyze only app files.
            </Paragraph>
            <Paragraph style={{ marginTop: 12, fontWeight: 'bold' }}>
              Your photos will never leave your device or be uploaded anywhere.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowMediaPermissionDialog(false)}>Skip</Button>
            <Button onPress={handleMediaPermissionRequest}>Allow Access</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cachedChip: {
    marginLeft: 8,
  },
  mediaToggleContainer: {
    marginTop: 16,
  },
  mediaToggleItem: {
    paddingHorizontal: 0,
  },
  errorCard: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineSpinner: {
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 32,
  },
});
