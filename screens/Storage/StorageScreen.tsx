import React, { useState } from 'react';
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
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useStorageAnalyzer } from '../../hooks/useStorageAnalyzer';
import { StorageBreakdownChart } from './components/StorageBreakdownChart';
import { LargeFilesList } from './components/LargeFilesList';
import { CleanupSuggestions } from './components/CleanupSuggestions';

interface StorageScreenProps {
  onNavigateBack?: () => void;
}

export const StorageScreen: React.FC<StorageScreenProps> = ({
  onNavigateBack,
}) => {
  const theme = useTheme();
  const {
    breakdown,
    largeFiles,
    cleanupSuggestions,
    isLoading,
    isScanning,
    hasMediaPermission,
    mediaPermissionRequested,
    error,
    refresh,
    requestMediaPermission,
    clearSelectedFiles,
    formatBytes,
  } = useStorageAnalyzer();

  const [showMediaPermissionDialog, setShowMediaPermissionDialog] = useState(false);
  const [mediaScansEnabled, setMediaScansEnabled] = useState(false);

  const handleRefresh = async () => {
    await refresh();
  };

  const handleMediaPermissionRequest = async () => {
    setShowMediaPermissionDialog(false);
    const granted = await requestMediaPermission();
    
    if (granted) {
      setMediaScansEnabled(true);
      Alert.alert(
        'Permission Granted',
        'Media library access enabled. You can now scan device media files.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Permission Denied',
        'Media library access is required to scan device photos and videos. You can enable it later in Settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMediaToggle = () => {
    if (!hasMediaPermission && !mediaPermissionRequested) {
      setShowMediaPermissionDialog(true);
    } else if (!hasMediaPermission) {
      Alert.alert(
        'Permission Required',
        'Media library permission is needed to scan device photos and videos. Please enable it in iOS Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // This will be handled by the cleanup suggestion
          }},
        ]
      );
    } else {
      setMediaScansEnabled(!mediaScansEnabled);
    }
  };

  const renderHeader = () => (
    <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
          Storage Analysis
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Monitor and manage your app&apos;s storage usage
        </Text>
        
        {/* Media Permission Toggle */}
        <View style={styles.mediaToggleContainer}>
          <List.Item
            title="Scan Device Media"
            description="Include photos and videos in analysis (requires permission)"
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
          <Text variant="titleMedium" style={{ color: theme.colors.onErrorContainer, marginBottom: 8 }}>
            Analysis Error
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer, marginBottom: 16 }}>
            {error}
          </Text>
          <Button
            mode="contained-tonal"
            onPress={refresh}
            icon="refresh"
            disabled={isLoading || isScanning}
          >
            Try Again
          </Button>
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
        <Appbar.Content title="Storage Analyzer" />
        <Appbar.Action 
          icon="refresh" 
          onPress={refresh} 
          disabled={isLoading || isScanning}
        />
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
        <Dialog
          visible={showMediaPermissionDialog}
          onDismiss={() => setShowMediaPermissionDialog(false)}
        >
          <Dialog.Title>Media Library Access</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              To scan your device photos and videos for large files, this app needs
              access to your photo library.
            </Paragraph>
            <Paragraph style={{ marginTop: 12 }}>
              This feature is optional and you can skip it if you prefer to analyze
              only app files.
            </Paragraph>
            <Paragraph style={{ marginTop: 12, fontWeight: 'bold' }}>
              Your photos will never leave your device or be uploaded anywhere.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowMediaPermissionDialog(false)}>
              Skip
            </Button>
            <Button onPress={handleMediaPermissionRequest}>
              Allow Access
            </Button>
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
  bottomSpacing: {
    height: 32,
  },
});