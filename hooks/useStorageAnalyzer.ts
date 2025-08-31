import { useState, useEffect, useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for storage analysis
export interface UseStorageAnalyzerOptions {
  mediaPageSize?: number; // Assets per page during media scan
  mediaLargeFilesCap?: number; // Safety cap on collected media large files
  mediaTopN?: number; // How many top largest media files to keep pre-merge
  cacheStaleAgeMs?: number; // Cached results stale age
  combinedTopN?: number; // How many top largest files to expose overall
}
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
  isPaused: boolean;
  hasMediaPermission: boolean;
  mediaPermissionRequested: boolean;
  mediaScansEnabled: boolean;
  // Foreground progress tracking
  scanProgress: {
    phase:
      | 'idle'
      | 'preparing'
      | 'scanning-app'
      | 'scanning-media'
      | 'processing'
      | 'complete'
      | 'paused';
    media: { current: number; total: number | null; cursor?: string | null };
    directories: { current: number; total: number | null };
  };
  // Cache/Resume metadata
  lastScanTime?: number | null;
  needsRefresh?: boolean;
  hasCheckpoint?: boolean;
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

export const useStorageAnalyzer = (options?: UseStorageAnalyzerOptions) => {
  // Config with sensible defaults
  const cfg = {
    mediaPageSize: options?.mediaPageSize ?? 200,
    mediaLargeFilesCap: options?.mediaLargeFilesCap ?? 1500,
    mediaTopN: options?.mediaTopN ?? 200,
    cacheStaleAgeMs: options?.cacheStaleAgeMs ?? 60 * 60 * 1000, // 1 hour
    combinedTopN: options?.combinedTopN ?? 50,
  } as const;
  const [state, setState] = useState<StorageAnalyzerState>({
    breakdown: null,
    largeFiles: [],
    cleanupSuggestions: [],
    isLoading: true,
    isScanning: false,
    isPaused: false,
    hasMediaPermission: false,
    mediaPermissionRequested: false,
    mediaScansEnabled: false,
    scanProgress: {
      phase: 'idle',
      media: { current: 0, total: null, cursor: null },
      directories: { current: 0, total: null },
    },
    lastScanTime: null,
    needsRefresh: false,
    hasCheckpoint: false,
    error: null,
  });

  const scanAbortController = useRef<AbortController | null>(null);

  // Local storage key(s)
  const STORAGE_KEYS = {
    MEDIA_SCANS_ENABLED: 'storage_media_scans_enabled',
    SCAN_CHECKPOINT: 'storage_scan_checkpoint',
    SCAN_RESULTS: 'storage_scan_results',
  } as const;

  // Persisted results helpers
  const saveResultsToCache = useCallback(
    async (breakdown: StorageBreakdown, largeFiles: LargeFile[]) => {
      try {
        const payload = JSON.stringify({ breakdown, largeFiles, timestamp: Date.now() });
        await AsyncStorage.setItem(STORAGE_KEYS.SCAN_RESULTS, payload);
        setState((p) => ({ ...p, lastScanTime: Date.now(), needsRefresh: false }));
      } catch (e) {
        console.warn('Failed to persist scan results cache:', e);
      }
    },
    [],
  );

  const loadCachedResults = useCallback(async (): Promise<boolean> => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_RESULTS);
      if (!cached) return false;
      const { breakdown, largeFiles, timestamp } = JSON.parse(cached);
      setState((p) => ({
        ...p,
        breakdown: breakdown ?? p.breakdown,
        largeFiles: Array.isArray(largeFiles) ? largeFiles : p.largeFiles,
        lastScanTime: timestamp ?? null,
        needsRefresh: timestamp ? Date.now() - timestamp > cfg.cacheStaleAgeMs : true,
      }));
      return true;
    } catch (e) {
      return false;
    }
  }, [STORAGE_KEYS.SCAN_RESULTS]);

  // Checkpoint helpers (media scanning only)
  const saveCheckpoint = useCallback(async (mediaScanned: number, mediaCursor?: string | null) => {
    try {
      const payload = JSON.stringify({
        mediaScanned,
        mediaCursor: mediaCursor ?? null,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem(STORAGE_KEYS.SCAN_CHECKPOINT, payload);
      setState((p) => ({ ...p, hasCheckpoint: true }));
    } catch (e) {
      console.warn('Failed to save scan checkpoint:', e);
    }
  }, []);

  const loadCheckpoint = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_CHECKPOINT);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed as { mediaScanned: number; mediaCursor: string | null; timestamp: number };
    } catch {
      return null;
    }
  }, [STORAGE_KEYS.SCAN_CHECKPOINT]);

  const clearCheckpoint = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SCAN_CHECKPOINT);
    } catch {}
    setState((p) => ({
      ...p,
      hasCheckpoint: false,
      scanProgress: {
        ...p.scanProgress,
        media: { current: 0, total: p.scanProgress.media.total, cursor: null },
      },
    }));
  }, [STORAGE_KEYS.SCAN_CHECKPOINT]);

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
  const scanMediaLibrary = useCallback(
    async (
      resumeFromCursor?: string | null,
      initialCount: number = 0,
    ): Promise<{
      size: number;
      files: LargeFile[];
      endCursor?: string | null;
      scannedCount: number;
    }> => {
      try {
        if (!state.mediaScansEnabled || !state.hasMediaPermission) {
          return { size: 0, files: [], endCursor: null, scannedCount: 0 };
        }

        let totalSize = 0;
        const largeFiles: LargeFile[] = [];

        // Paginate through assets to avoid memory pressure
        const pageSize = cfg.mediaPageSize; // configurable page size
        let hasNextPage = true;
        let after: string | undefined = resumeFromCursor ?? undefined;

        setState((p) => ({
          ...p,
          scanProgress: {
            ...p.scanProgress,
            phase: 'scanning-media',
            media: {
              current: initialCount,
              total: p.scanProgress.media.total ?? null,
              cursor: after ?? null,
            },
          },
        }));

        while (hasNextPage) {
          if (scanAbortController.current?.signal.aborted) break;

          const page = await MediaLibrary.getAssetsAsync({
            mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
            first: pageSize,
            after,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          });

          // Update total if provided by platform
          if (typeof (page as any).totalCount === 'number') {
            const totalCount = (page as any).totalCount as number;
            setState((p) => ({
              ...p,
              scanProgress: {
                ...p.scanProgress,
                media: { ...p.scanProgress.media, total: totalCount },
              },
            }));
          }

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

            // Increment progress after processing each asset
            setState((p) => ({
              ...p,
              scanProgress: {
                ...p.scanProgress,
                media: {
                  ...p.scanProgress.media,
                  current: (p.scanProgress.media.current ?? 0) + 1,
                },
              },
            }));
          }

          hasNextPage = page.endCursor != null && page.hasNextPage === true;
          after = page.endCursor ?? undefined;

          // Save checkpoint after each page boundary
          await saveCheckpoint(
            // approximate from progress state (already incremented by number of assets)
            state.scanProgress.media.current + page.assets.length,
            after ?? null,
          );
          setState((p) => ({
            ...p,
            hasCheckpoint: true,
            scanProgress: {
              ...p.scanProgress,
              media: { ...p.scanProgress.media, cursor: after ?? null },
            },
          }));

          // Safety: do not process an extremely large library in one go
          if (largeFiles.length > cfg.mediaLargeFilesCap) break;
        }

        // Keep only top 200 largest media files for display purposes
        const topMedia = largeFiles.sort((a, b) => b.size - a.size).slice(0, cfg.mediaTopN);
        const scannedCount = state.scanProgress.media.current ?? 0;
        return { size: totalSize, files: topMedia, endCursor: after ?? null, scannedCount };
      } catch (error) {
        console.error('Error scanning media library:', error);
        return { size: 0, files: [], endCursor: null, scannedCount: 0 };
      }
    },
    [state.mediaScansEnabled, state.hasMediaPermission, saveCheckpoint],
  );

  // Scan app storage directories
  const scanAppStorage = useCallback(
    async (options?: {
      resumeMediaCursor?: string | null;
      mediaInitialCount?: number;
    }): Promise<void> => {
      try {
        setState((prev) => ({
          ...prev,
          isScanning: true,
          isPaused: false,
          error: null,
          scanProgress: {
            ...prev.scanProgress,
            phase: 'preparing',
            directories: { current: 0, total: 2 },
          },
        }));

        // Cancel any ongoing scan
        if (scanAbortController.current) {
          scanAbortController.current.abort();
        }
        scanAbortController.current = new AbortController();

        // Scan directories sequentially to update progress
        setState((p) => ({ ...p, scanProgress: { ...p.scanProgress, phase: 'scanning-app' } }));
        const cacheResult = await scanDirectory(FileSystem.cacheDirectory || '');
        setState((p) => ({
          ...p,
          scanProgress: { ...p.scanProgress, directories: { current: 1, total: 2 } },
        }));
        const documentsResult = await scanDirectory(FileSystem.documentDirectory || '');
        setState((p) => ({
          ...p,
          scanProgress: { ...p.scanProgress, directories: { current: 2, total: 2 } },
        }));

        // Media scan (respect resume cursor/count)
        const mediaResult = await scanMediaLibrary(
          options?.resumeMediaCursor ?? null,
          options?.mediaInitialCount ?? 0,
        );

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
          .slice(0, cfg.combinedTopN); // Limit to top N large files

        setState((prev) => ({
          ...prev,
          breakdown,
          largeFiles: allLargeFiles,
          isScanning: false,
          scanProgress: { ...prev.scanProgress, phase: 'complete' },
        }));

        // Clear checkpoint and cache latest results
        try {
          await AsyncStorage.removeItem(STORAGE_KEYS.SCAN_CHECKPOINT);
        } catch {}
        setState((p) => ({ ...p, hasCheckpoint: false }));
        await saveResultsToCache(breakdown, allLargeFiles);
      } catch (error) {
        console.error('Error scanning app storage:', error);
        setState((prev) => ({
          ...prev,
          error: 'Failed to scan storage. Please try again.',
          isScanning: false,
        }));
      }
    },
    [scanMediaLibrary, saveResultsToCache],
  );

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

        // Load cached results for instant UI
        await loadCachedResults();

        // Determine if there's a resume checkpoint
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_CHECKPOINT);
          setState((p) => ({ ...p, hasCheckpoint: !!raw }));
        } catch {}
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

  // Pause, Resume, Cancel controls
  const pauseScan = useCallback(async () => {
    try {
      if (scanAbortController.current) {
        scanAbortController.current.abort();
      }
    } finally {
      setState((p) => ({
        ...p,
        isScanning: false,
        isPaused: true,
        scanProgress: { ...p.scanProgress, phase: 'paused' },
      }));
    }
  }, []);

  const resumeScan = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_CHECKPOINT);
      if (!raw) return false;
      const { mediaCursor, mediaScanned } = JSON.parse(raw);
      setState((p) => ({ ...p, isPaused: false }));
      await scanAppStorage({ resumeMediaCursor: mediaCursor, mediaInitialCount: mediaScanned });
      return true;
    } catch {
      return false;
    }
  }, [scanAppStorage]);

  const cancelScan = useCallback(async () => {
    try {
      if (scanAbortController.current) {
        scanAbortController.current.abort();
      }
      await AsyncStorage.removeItem(STORAGE_KEYS.SCAN_CHECKPOINT);
      setState((p) => ({
        ...p,
        isScanning: false,
        isPaused: false,
        hasCheckpoint: false,
        scanProgress: {
          phase: 'idle',
          media: { current: 0, total: null, cursor: null },
          directories: { current: 0, total: null },
        },
      }));
    } catch {}
  }, []);

  return {
    ...state,
    refresh,
    requestMediaPermission,
    clearSelectedFiles,
    formatBytes,
    saveMediaScansEnabled,
    pauseScan,
    resumeScan,
    cancelScan,
  };
};
