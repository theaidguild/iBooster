import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Appbar, useTheme, Portal, Dialog, Paragraph, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { useStorageAnalyzer } from '../../hooks/useStorageAnalyzer';
import { StorageBreakdownChart } from './components/StorageBreakdownChart';
import { LargeFilesList } from './components/LargeFilesList';
import { CleanupSuggestions } from './components/CleanupSuggestions';
import { StorageHeader } from './components/StorageHeader';
import { StorageProgressBanner } from './components/StorageProgressBanner';
import { MediaSettings } from './components/MediaSettings';
import { ErrorMessage } from '../../components/shared/ErrorState';

interface StorageScreenProps {
  onNavigateBack?: () => void;
}

export const StorageScreen: React.FC<StorageScreenProps> = ({ onNavigateBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  // Local state for UI interactions
  const [showMediaPermissionDialog, setShowMediaPermissionDialog] = useState(false);
  const [showResumedSnack, setShowResumedSnack] = useState(false);

  // Storage analyzer hook with all the business logic
  const {
    breakdown,
    largeFiles,
    cleanupSuggestions,
    error,
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
    needsRefresh,
    skippedSmallMediaCount,
    mediaScanTimeLimitMs,
    scanDeepFolders,
    // Actions
    refresh,
    clearSelectedFiles,
    pauseScan,
    cancelScan,
    resumeScan,
    requestMediaPermission,
    saveMediaScansEnabled,
    saveMediaScanTimeLimit,
    saveScanDeepFolders,
    formatBytes,
  } = useStorageAnalyzer();

  const usingCache = Boolean(lastScanTime && !isLoading && !isScanning);

  // Progress calculation
  const progressPct = useMemo(() => {
    if (scanProgress.phase === 'scanning-media') {
      const { current, total } = scanProgress.media;
      if (total && total > 0) return Math.min(1, current / total);
      return undefined;
    }
    if (scanProgress.phase === 'scanning-app' && scanProgress.directories.total) {
      return scanProgress.directories.current / (scanProgress.directories.total || 1);
    }
    return undefined;
  }, [scanProgress]);

  // Time estimates (simplified - the full implementation would need scanStartTime tracking)
  const estimatedRemaining = useMemo(() => {
    // This is a simplified version - full implementation would need more state tracking
    return undefined;
  }, []);

  // Handlers
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

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
        <StorageHeader
          usingCache={usingCache}
          needsRefresh={needsRefresh}
          onRefresh={refresh}
        />

        {/* Media Settings */}
        <MediaSettings
          mediaScansEnabled={mediaScansEnabled}
          hasMediaPermission={hasMediaPermission}
          mediaScanTimeLimitMs={mediaScanTimeLimitMs}
          scanDeepFolders={scanDeepFolders}
          isLoading={isLoading}
          isScanning={isScanning}
          onToggleMediaScans={handleMediaToggle}
          onSaveMediaScanTimeLimit={saveMediaScanTimeLimit}
          onSaveScanDeepFolders={saveScanDeepFolders}
        />

        {/* Error Display */}
        {error && (
          <View style={styles.section}>
            <ErrorMessage
              title={t('storage.analysisError')}
              message={error}
              onRetry={refresh}
              retryText={t('common.tryAgain')}
            />
          </View>
        )}

        {/* Progress Banner */}
        <StorageProgressBanner
          scanProgress={scanProgress}
          isScanning={isScanning}
          isPaused={isPaused}
          hasCheckpoint={hasCheckpoint}
          largeFiles={largeFiles}
          progressPct={progressPct}
          estimatedRemaining={estimatedRemaining}
          lastScanDurationMs={lastScanDurationMs}
          pauseScan={pauseScan}
          cancelScan={cancelScan}
          onResume={handleResume}
        />

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
            style={[styles.skippedInfo, { color: theme.colors.onSurfaceVariant }]}
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
        <Dialog
          visible={showMediaPermissionDialog}
          onDismiss={() => setShowMediaPermissionDialog(false)}
        >
          <Dialog.Title>{t('storage.mediaPermission.title')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{t('storage.mediaPermission.description')}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowMediaPermissionDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onPress={async () => {
                setShowMediaPermissionDialog(false);
                await requestMediaPermission();
              }}
            >
              {t('storage.mediaPermission.grant')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Success Snackbar */}
      <Snackbar
        visible={showResumedSnack}
        onDismiss={() => setShowResumedSnack(false)}
        duration={3000}
      >
        {t('storage.progress.resumed')}
      </Snackbar>
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
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  skippedInfo: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  bottomSpacing: {
    height: 32,
  },
});