import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Text,
  Card,
  List,
  Checkbox,
  Button,
  useTheme,
  IconButton,
  Chip,
  Divider,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LargeFile } from '../../../hooks/useStorageAnalyzer';
import { Colors } from '../../../colors';

interface LargeFilesListProps {
  files: LargeFile[];
  isLoading?: boolean;
  formatBytes: (bytes: number) => string;
  onDeleteFiles?: (files: LargeFile[]) => Promise<boolean>;
}

export const LargeFilesList: React.FC<LargeFilesListProps> = ({
  files,
  isLoading = false,
  formatBytes,
  onDeleteFiles,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getFileIcon = (file: LargeFile): string => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'mkv':
        return 'video';
      case 'mp3':
      case 'wav':
      case 'aac':
      case 'm4a':
        return 'music';
      case 'pdf':
        return 'file-pdf-box';
      case 'txt':
      case 'md':
        return 'file-document';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive';
      default:
        if (file.type === 'cache') return 'cached';
        if (file.type === 'document') return 'file';
        return 'file-question';
    }
  };

  const getFileTypeColor = (type: LargeFile['type']): string => {
    switch (type) {
      case 'cache': return Colors.status.critical; // Red for cache files
      case 'document': return Colors.primary[700]; // Cyan for documents
      case 'media': return Colors.primary[800]; // Blue for media
      case 'other': return Colors.neutral[400]; // Gray for other files
      default: return theme.colors.primary;
    }
  };

  const handleFileToggle = (fileUri: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileUri)) {
      newSelected.delete(fileUri);
    } else {
      newSelected.add(fileUri);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.uri)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!onDeleteFiles || selectedFiles.size === 0) return;

    setIsDeleting(true);
    try {
      const filesToDelete = files.filter(f => selectedFiles.has(f.uri));
      const success = await onDeleteFiles(filesToDelete);
      
      if (success) {
        setSelectedFiles(new Set());
        Alert.alert(
          'Files Deleted',
          `Successfully deleted ${filesToDelete.length} file(s).`,
        );
      } else {
        Alert.alert(
          'Delete Failed',
          'Some files could not be deleted. They might be in use or protected.',
        );
      }
    } catch (_error) {
      Alert.alert(
        'Delete Error',
        'An error occurred while deleting files. Please try again.',
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString();
  };

  const selectedFilesTotalSize = files
    .filter(f => selectedFiles.has(f.uri))
    .reduce((sum, f) => sum + f.size, 0);

  const renderFileItem = ({ item }: { item: LargeFile }) => {
    const isSelected = selectedFiles.has(item.uri);
    
    return (
      <View>
        <List.Item
          title={item.name}
          description={`${formatBytes(item.size)} • ${item.type} • ${formatDate(item.modificationTime)}`}
          left={(props) => (
            <View style={styles.leftContainer}>
              <Checkbox
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => handleFileToggle(item.uri)}
              />
              <List.Icon
                {...props}
                icon={getFileIcon(item)}
                color={getFileTypeColor(item.type)}
              />
            </View>
          )}
          right={() => (
            <View style={styles.rightContainer}>
              <Chip
                mode="outlined"
                compact
                textStyle={{ fontSize: 10 }}
                style={{ backgroundColor: getFileTypeColor(item.type) + '20' }}
              >
                {item.type.toUpperCase()}
              </Chip>
            </View>
          )}
          onPress={() => handleFileToggle(item.uri)}
          style={[
            styles.listItem,
            isSelected && { backgroundColor: theme.colors.primary + '10' }
          ]}
        />
        <Divider />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton
        icon="folder-search"
        size={48}
        iconColor={theme.colors.onSurfaceVariant}
      />
      <Text
        variant="titleMedium"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
      >
        {t('storage.largeFiles.noFilesFound')}
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
      >
        {t('storage.largeFiles.noFilesDescription')}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            {t('storage.largeFiles.title')}
          </Text>
          <View style={styles.loadingContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('storage.largeFiles.scanning')}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {t('storage.largeFiles.title')} ({files.length})
          </Text>
          {files.length > 0 && (
            <Button
              mode="text"
              onPress={handleSelectAll}
              compact
            >
              {selectedFiles.size === files.length ? t('storage.cleanup.deselectAll') : t('storage.cleanup.selectAll')}
            </Button>
          )}
        </View>

        {/* Selection info */}
        {selectedFiles.size > 0 && (
          <View style={styles.selectionInfo}>
            <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
              {selectedFiles.size} selected • {formatBytes(selectedFilesTotalSize)}
            </Text>
            <Button
              mode="contained-tonal"
              onPress={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              loading={isDeleting}
              compact
              icon="delete"
            >
              {t('storage.cleanup.deleteFiles')}
            </Button>
          </View>
        )}

        {/* Files list */}
        {files.length > 0 ? (
          <FlatList
            data={files}
            renderItem={renderFileItem}
            keyExtractor={(item) => item.uri}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false} // Let the parent ScrollView handle scrolling
          />
        ) : (
          renderEmptyState()
        )}
      </Card.Content>

      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
        >
          <Dialog.Title>{t('storage.cleanup.confirmDelete')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {t('storage.cleanup.confirmMessage', { count: selectedFiles.size })}
            </Paragraph>
            <Paragraph style={{ marginTop: 12, fontStyle: 'italic' }}>
              {t('storage.cleanup.cannotUndone')}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>{t('common.cancel')}</Button>
            <Button
              onPress={handleDeleteSelected}
              disabled={isDeleting}
              loading={isDeleting}
            >
              Delete
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
  cardContent: {
    paddingBottom: 8,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
  },
  list: {
    maxHeight: 300, // Limit height to prevent the card from being too tall
  },
  listItem: {
    paddingVertical: 8,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContainer: {
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});