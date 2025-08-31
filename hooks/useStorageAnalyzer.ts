import { useState, useEffect, useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for storage analysis
export interface StorageBreakdown {
  cache: number;
  documents: number;
  // Total size of scanned device media (photos/videos) when enabled
  media?: number;
  other: number;
  total: number;
  free?: number;
  deviceTotal?: number;
}

export interface LargeFile {
  uri: string;
  name: string;
  size: number;
  type: 'cache' | 'document' | 'media' | 'other';
  modificationTime?: number;
  // For media assets, keep the underlying MediaLibrary asset id for deletion
  assetId?: string;
}

export interface CleanupSuggestion {
  id: string;
  title: string;
  description: string;
  icon: string;
  estimatedSize: number;
  action: () => Promise<boolean>;
  type: 'cache' | 'temp' | 'media' | 'settings';
}

export interface StorageAnalyzerState {
  breakdown: StorageBreakdown | null;
  largeFiles: LargeFile[];
  cleanupSuggestions: CleanupSuggestion[];
  isLoading: boolean;
  isScanning: boolean;
  hasMediaPermission: boolean;
  mediaPermissionRequested: boolean;
  mediaScansEnabled: boolean;
  error: string | null;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const scanDirectory = async (dirUri: string): Promise<{ size: number; files: LargeFile[] }> => {
  try {
    const info = await FileSystem.getInfoAsync(dirUri);
    if (!info.exists || !info.isDirectory) {
      return { size: 0, files: [] };
    }

    const items = await FileSystem.readDirectoryAsync(dirUri);
    let totalSize = 0;
    const largeFiles: LargeFile[] = [];

    for (const item of items) {
      const itemUri = `${dirUri}/${item}`;
      try {
        const itemInfo = await FileSystem.getInfoAsync(itemUri, { size: true });

        if (itemInfo.exists) {
          if (itemInfo.isDirectory) {
            // Recursively scan subdirectories (with depth limit)
            const subResult = await scanDirectory(itemUri);
            totalSize += subResult.size;
            largeFiles.push(...subResult.files);
          } else if (itemInfo.size) {
            totalSize += itemInfo.size;

            // Consider files over 1MB as "large"
            if (itemInfo.size > 1024 * 1024) {
              const fileType = dirUri.includes('cache')
                ? 'cache'
                : dirUri.includes('Documents')
                  ? 'document'
                  : 'other';

              largeFiles.push({
                uri: itemUri,
                name: item,
                size: itemInfo.size,
                type: fileType,
                modificationTime: itemInfo.modificationTime,
              });
            }
          }
        }
      } catch (error) {
        // Skip files we can't access
        console.warn(`Cannot access file ${itemUri}:`, error);
      }
    }

    return { size: totalSize, files: largeFiles };
  } catch (error) {
    console.error(`Error scanning directory ${dirUri}:`, error);
    return { size: 0, files: [] };
  }
};

export const useStorageAnalyzer = () => {
  const [state, setState] = useState<StorageAnalyzerState>({
    breakdown: null,
    largeFiles: [],
    cleanupSuggestions: [],
    isLoading: true,
    isScanning: false,
    hasMediaPermission: false,
    mediaPermissionRequested: false,
    mediaScansEnabled: false,
    error: null,
  });

  const scanAbortController = useRef<AbortController | null>(null);

  // Local storage key(s)
  const STORAGE_KEYS = {
    MEDIA_SCANS_ENABLED: 'storage_media_scans_enabled',
  } as const;

  // Request media library permission
  const requestMediaPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, mediaPermissionRequested: true }));

      const permission = await MediaLibrary.requestPermissionsAsync();
      const granted = permission.granted === true;

      setState((prev) => ({ ...prev, hasMediaPermission: granted }));
      return granted;
    } catch (error) {
      console.error('Error requesting media permission:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to request media library permission',
      }));
      return false;
    }
  }, []);

  // Scan media library (photos and videos)
  const scanMediaLibrary = useCallback(async (): Promise<{ size: number; files: LargeFile[] }> => {
    try {
      if (!state.mediaScansEnabled || !state.hasMediaPermission) {
        return { size: 0, files: [] };
      }

      let totalSize = 0;
      const largeFiles: LargeFile[] = [];

      // Paginate through assets to avoid memory pressure
      const pageSize = 200; // reasonable page size
      let hasNextPage = true;
      let after: string | undefined = undefined;

      while (hasNextPage) {
        if (scanAbortController.current?.signal.aborted) break;

        const page = await MediaLibrary.getAssetsAsync({
          mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
          first: pageSize,
          after,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });

        for (const asset of page.assets) {
          if (scanAbortController.current?.signal.aborted) break;

          try {
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            // Try multiple fields for compatibility across SDKs/platforms
            const candidateSize: number | undefined =
              // @ts-ignore - size naming can differ by platform/SDK
              (info as any).size ?? (info as any).fileSize ?? (info as any).bytes;

            let fileSize = 0;
            if (typeof candidateSize === 'number' && isFinite(candidateSize)) {
              fileSize = candidateSize;
            } else if ((info as any).localUri) {
              try {
                const fsInfo = await FileSystem.getInfoAsync((info as any).localUri);
                if (fsInfo.exists && typeof fsInfo.size === 'number') {
                  fileSize = fsInfo.size;
                }
              } catch {
                // ignore if cannot resolve size from FS
              }
            }

            totalSize += fileSize;

            if (fileSize > 1024 * 1024) {
              largeFiles.push({
                uri: (info as any).localUri ?? asset.uri,
                name: asset.filename ?? `media-${asset.id}`,
                size: fileSize,
                type: 'media',
                assetId: asset.id,
                modificationTime:
                  // prefer modificationTime if present, else creationTime
                  // @ts-ignore
                  (info as any).modificationTime ??
                  (asset as any).modificationTime ??
                  (asset as any).creationTime,
              });
            }
          } catch (err) {
            // Skip assets we can't access
            console.warn('Failed to read media asset info', err);
          }
        }

        hasNextPage = page.endCursor != null && page.hasNextPage === true;
        after = page.endCursor ?? undefined;

        // Safety: do not process an extremely large library in one go
        if (largeFiles.length > 1500) break;
      }

      // Keep only top 200 largest media files for display purposes
      const topMedia = largeFiles.sort((a, b) => b.size - a.size).slice(0, 200);
      return { size: totalSize, files: topMedia };
    } catch (error) {
      console.error('Error scanning media library:', error);
      return { size: 0, files: [] };
    }
  }, [state.mediaScansEnabled, state.hasMediaPermission]);

  // Scan app storage directories
  const scanAppStorage = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isScanning: true, error: null }));

      // Cancel any ongoing scan
      if (scanAbortController.current) {
        scanAbortController.current.abort();
      }
      scanAbortController.current = new AbortController();

      const [cacheResult, documentsResult, mediaResult] = await Promise.all([
        scanDirectory(FileSystem.cacheDirectory || ''),
        scanDirectory(FileSystem.documentDirectory || ''),
        scanMediaLibrary(),
      ]);

      // Try to get device storage info (may not be available)
      let deviceTotal: number | undefined;
      let deviceFree: number | undefined;

      try {
        const totalDisk = await FileSystem.getTotalDiskCapacityAsync();
        const freeDisk = await FileSystem.getFreeDiskStorageAsync();

        if (totalDisk && freeDisk) {
          deviceTotal = totalDisk;
          deviceFree = freeDisk;
        }
      } catch (error) {
        // Device storage info not available
        console.log('Device storage info not available:', error);
      }

      const cache = cacheResult.size;
      const documents = documentsResult.size;
      const media = mediaResult.size;
      const total = cache + documents + media;

      const breakdown: StorageBreakdown = {
        cache,
        documents,
        media,
        other: 0, // We can't easily determine other app data
        total,
        free: deviceFree,
        deviceTotal,
      };

      const allLargeFiles = [...cacheResult.files, ...documentsResult.files, ...mediaResult.files]
        .sort((a, b) => b.size - a.size)
        .slice(0, 50); // Limit to top 50 large files

      setState((prev) => ({
        ...prev,
        breakdown,
        largeFiles: allLargeFiles,
        isScanning: false,
      }));
    } catch (error) {
      console.error('Error scanning app storage:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to scan storage. Please try again.',
        isScanning: false,
      }));
    }
  }, []);

  // Generate cleanup suggestions based on scan results
  const generateCleanupSuggestions = useCallback(
    (breakdown: StorageBreakdown): CleanupSuggestion[] => {
      const suggestions: CleanupSuggestion[] = [];

      // Cache cleanup suggestion
      if (breakdown.cache > 10 * 1024 * 1024) {
        // > 10MB
        suggestions.push({
          id: 'clear-cache',
          title: 'Clear App Cache',
          description: `Free up ${formatBytes(breakdown.cache)} by clearing temporary files`,
          icon: 'delete-sweep',
          estimatedSize: breakdown.cache,
          type: 'cache',
          action: async () => {
            try {
              if (FileSystem.cacheDirectory) {
                const items = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
                for (const item of items) {
                  try {
                    await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${item}`);
                  } catch (error) {
                    console.warn(`Could not delete cache item ${item}:`, error);
                  }
                }
              }
              return true;
            } catch (error) {
              console.error('Error clearing cache:', error);
              return false;
            }
          },
        });
      }

      // iOS Settings redirect
      suggestions.push({
        id: 'ios-settings',
        title: 'Open iOS Storage Settings',
        description: 'View detailed storage breakdown and manage apps',
        icon: 'cog',
        estimatedSize: 0,
        type: 'settings',
        action: async () => {
          try {
            const supported = await Linking.canOpenURL(
              'App-Prefs:root=General&path=iPhone_STORAGE',
            );
            if (supported) {
              await Linking.openURL('App-Prefs:root=General&path=iPhone_STORAGE');
            } else {
              // Fallback to main settings
              await Linking.openSettings();
            }
            return true;
          } catch (error) {
            console.error('Error opening settings:', error);
            return false;
          }
        },
      });

      return suggestions;
    },
    [],
  );

  // Clear selected files
  const clearSelectedFiles = useCallback(
    async (files: LargeFile[]): Promise<boolean> => {
      try {
        let successCount = 0;

        for (const file of files) {
          try {
            if (file.type === 'media' && file.assetId) {
              // Delete via MediaLibrary when possible
              if (state.hasMediaPermission) {
                const res = await MediaLibrary.deleteAssetsAsync([file.assetId]);
                if (res) successCount++;
              }
            } else {
              await FileSystem.deleteAsync(file.uri);
              successCount++;
            }
          } catch (error) {
            console.warn(`Could not delete file ${file.name}:`, error);
          }
        }

        if (successCount > 0) {
          // Refresh the scan after deletion
          await scanAppStorage();
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error clearing selected files:', error);
        return false;
      }
    },
    [scanAppStorage, state.hasMediaPermission],
  );

  // Perform initial scan
  const refresh = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await scanAppStorage();
    setState((prev) => ({ ...prev, isLoading: false }));
  }, [scanAppStorage]);

  // Update cleanup suggestions when breakdown changes
  useEffect(() => {
    if (state.breakdown) {
      const suggestions = generateCleanupSuggestions(state.breakdown);
      setState((prev) => ({ ...prev, cleanupSuggestions: suggestions }));
    }
  }, [state.breakdown, generateCleanupSuggestions]);

  // Initial scan on mount
  useEffect(() => {
    // Initialize existing media permission state first
    (async () => {
      try {
        const current = await MediaLibrary.getPermissionsAsync();
        const hasPermission = current.granted === true;
        const requested = current.status !== 'undetermined';
        setState((prev) => ({
          ...prev,
          hasMediaPermission: hasPermission,
          mediaPermissionRequested: requested,
        }));

        // Load persisted media scans toggle
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEYS.MEDIA_SCANS_ENABLED);
          if (stored !== null) {
            const enabled = stored === 'true' || stored === '1' || stored === '"true"';
            setState((prev) => ({ ...prev, mediaScansEnabled: enabled }));
          }
        } catch (persistErr) {
          // Non-fatal; leave default
          console.warn('Failed to load media scans enabled state:', persistErr);
        }
      } catch (e) {
        // noop - permission query failed; we'll handle on demand
      }
    })();

    refresh();

    return () => {
      if (scanAbortController.current) {
        scanAbortController.current.abort();
      }
    };
  }, [refresh]);

  // Rescan when media toggle/permission state changes
  useEffect(() => {
    if (state.mediaScansEnabled && state.hasMediaPermission) {
      // Trigger a rescan to include media
      refresh();
    }
  }, [state.mediaScansEnabled, state.hasMediaPermission, refresh]);

  // Persist media scans enabled toggle
  const saveMediaScansEnabled = useCallback(
    async (enabled: boolean): Promise<void> => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.MEDIA_SCANS_ENABLED, String(enabled));
      } catch (error) {
        // Log but do not block UI
        console.warn('Failed to persist media scans enabled:', error);
      } finally {
        setState((prev) => ({ ...prev, mediaScansEnabled: enabled }));
        // Kick off a rescan to reflect new setting
        try {
          await refresh();
        } catch {}
      }
    },
    [refresh],
  );

  return {
    ...state,
    refresh,
    requestMediaPermission,
    clearSelectedFiles,
    formatBytes,
    saveMediaScansEnabled,
  };
};
