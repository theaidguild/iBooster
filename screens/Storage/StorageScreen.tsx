import React, { useMemo, useState, useCallback } from 'react';
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
    skippedSmallMediaCount,
    scanDeepFolders,
    mediaScanTimeLimitMs,
    error,
    refresh,
    requestMediaPermission,
    clearSelectedFiles,
    formatBytes,
    saveMediaScansEnabled,
    saveScanDeepFolders,
    saveMediaScanTimeLimit,
    pauseScan,
    resumeScan,
    cancelScan,
  } = useStorageAnalyzer();

  const [showMediaPermissionDialog, setShowMediaPermissionDialog] = useState(false);
  const [showResumedSnack, setShowResumedSnack] = useState(false);
  // Toggle value comes from hook persistence

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleMediaPermissionRequest = useCallback(async () => {
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
  }, [requestMediaPermission, saveMediaScansEnabled]);

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

  const handleResume = useCallback(async () => {
    const ok = await resumeScan();
    if (ok && !showResumedSnack) setShowResumedSnack(true);
  }, [resumeScan, showResumedSnack]);

  const handleMediaToggle = useCallback(async () => {
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
  }, [hasMediaPermission, mediaPermissionRequested, saveMediaScansEnabled, mediaScansEnabled]);

  const renderHeader = useMemo(
    () => (
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Button
                        compact
                        onPress={() => saveMediaScanTimeLimit(15000)}
                        disabled={isScanning}
                      >
                        15s
                      </Button>
                      <Button
                        compact
                        onPress={() => saveMediaScanTimeLimit(30000)}
                        disabled={isScanning}
                      >
                        30s
                      </Button>
                      <Button
                        compact
                        onPress={() => saveMediaScanTimeLimit(60000)}
                        disabled={isScanning}
                      >
                        60s
                      </Button>
                      <Button
                        compact
                        onPress={() => saveMediaScanTimeLimit(0)}
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
                      onValueChange={saveScanDeepFolders}
                      disabled={isLoading || isScanning}
                    />
                  )}
                />
              </>
            )}
          </View>
        </Card.Content>
      </Card>
    ),
    [
      theme.colors.surface,
      theme.colors.onSurface,
      theme.colors.onSurfaceVariant,
      t,
      usingCache,
      refresh,
      needsRefresh,
      mediaScansEnabled,
      hasMediaPermission,
      isLoading,
      isScanning,
      mediaScanTimeLimitMs,
      scanDeepFolders,
      saveMediaScanTimeLimit,
      saveScanDeepFolders,
      handleMediaToggle,
    ],
  );

  const renderError = useMemo(() => {
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
  }, [
    error,
    theme.colors.errorContainer,
    theme.colors.onErrorContainer,
    t,
    refresh,
    isLoading,
    isScanning,
  ]);

  const renderProgressBanner = useMemo(() => {
    const phase = scanProgress.phase;
    const isActive =
      isScanning || phase === 'paused' || phase === 'scanning-media' || phase === 'scanning-app';
    if (!isActive) return null;

    let title = t('storage.progress.preparing');
    if (phase === 'scanning-app')
      title = t('storage.progress.scanningApp', {
        current: scanProgress.directories.current,
        total: scanProgress.directories.total ?? 2,
      });
    if (phase === 'scanning-media') {
      // Base text shows current count; append total if available to avoid i18n conditional templating
      const base = t('storage.progress.scanningMedia', {
        current: scanProgress.media.current,
      });
      title =
        scanProgress.media.total && Number.isFinite(scanProgress.media.total)
          ? `${base}/${scanProgress.media.total}`
          : base;
      if (Array.isArray(largeFiles) && largeFiles.length > 0) {
        title += ` (${t('storage.progress.largeFilesFound', { count: largeFiles.length })})`;
      }
    }
    if (phase === 'paused') title = t('storage.progress.paused');

    return (
      <Card style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.progressHeader}>
            <View style={styles.titleContainer}>
              <Text
                variant="titleSmall"
                style={[{ color: theme.colors.onSurface }, styles.titleText]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              {isScanning && phase !== 'paused' && (
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
                  {t('storage.progress.pause')}
                </Button>
              )}
              {isScanning &&
                scanProgress.phase === 'scanning-media' &&
                scanProgress.media.current > 100 && (
                  <Button compact mode="text" onPress={cancelScan} icon="fast-forward">
                    {t('storage.progress.skipMedia')}
                  </Button>
                )}
              {!isScanning && (isPaused || hasCheckpoint) && (
                <Button compact mode="contained-tonal" onPress={handleResume}>
                  {t('storage.progress.resume')}
                </Button>
              )}
              {(isScanning || isPaused) && (
                <Button compact mode="text" onPress={cancelScan}>
                  {t('storage.progress.cancel')}
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
              {t('storage.progress.lastScan', {
                minutes: Math.max(0, Math.floor((Date.now() - lastScanTime) / 60000)),
              })}
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
  }, [
    scanProgress,
    isScanning,
    isPaused,
    hasCheckpoint,
    theme.colors.surface,
    theme.colors.onSurface,
    theme.colors.onSurfaceVariant,
    theme.colors.primary,
    t,
    largeFiles,
    progressPct,
    estimatedRemaining,
    lastScanTime,
    lastScanDurationMs,
    pauseScan,
    cancelScan,
    handleResume,
  ]);

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
        {renderHeader}

        {/* Error Display */}
        {renderError}

        {/* Progress Banner */}
        {renderProgressBanner}

        {/* Storage Breakdown Chart */}
        <StorageBreakdownChart
          breakdown={breakdown}
          isLoading={isLoading}
          formatBytes={formatBytes}
        />

        {/* Skipped media info */}
        {mediaScansEnabled && skippedSmallMediaCount > 0 && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 16, marginTop: 8 }}
          >
            {t('storage.media.skippedSmallFiles', { count: skippedSmallMediaCount })}
          </Text>
        )}

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
    flexShrink: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    flexShrink: 1,
  },
  inlineSpinner: {
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 32,
  },
});
