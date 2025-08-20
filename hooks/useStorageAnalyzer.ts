import { useState, useEffect, useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Linking } from 'react-native';

// Types for storage analysis
export interface StorageBreakdown {
  cache: number;
  documents: number;
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
              const fileType = dirUri.includes('cache') ? 'cache' : 
                             dirUri.includes('Documents') ? 'document' : 'other';
              
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
    error: null,
  });

  const scanAbortController = useRef<AbortController | null>(null);

  // Request media library permission
  const requestMediaPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, mediaPermissionRequested: true }));
      
      const permission = await MediaLibrary.requestPermissionsAsync();
      const granted = permission.status === 'granted';
      
      setState(prev => ({ ...prev, hasMediaPermission: granted }));
      return granted;
    } catch (error) {
      console.error('Error requesting media permission:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to request media library permission' 
      }));
      return false;
    }
  }, []);

  // Scan app storage directories
  const scanAppStorage = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isScanning: true, error: null }));
      
      // Cancel any ongoing scan
      if (scanAbortController.current) {
        scanAbortController.current.abort();
      }
      scanAbortController.current = new AbortController();

      const [cacheResult, documentsResult] = await Promise.all([
        scanDirectory(FileSystem.cacheDirectory || ''),
        scanDirectory(FileSystem.documentDirectory || ''),
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
      const total = cache + documents;

      const breakdown: StorageBreakdown = {
        cache,
        documents,
        other: 0, // We can't easily determine other app data
        total,
        free: deviceFree,
        deviceTotal,
      };

      const allLargeFiles = [...cacheResult.files, ...documentsResult.files]
        .sort((a, b) => b.size - a.size)
        .slice(0, 50); // Limit to top 50 large files

      setState(prev => ({
        ...prev,
        breakdown,
        largeFiles: allLargeFiles,
        isScanning: false,
      }));

    } catch (error) {
      console.error('Error scanning app storage:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to scan storage. Please try again.',
        isScanning: false,
      }));
    }
  }, []);

  // Generate cleanup suggestions based on scan results
  const generateCleanupSuggestions = useCallback((breakdown: StorageBreakdown): CleanupSuggestion[] => {
    const suggestions: CleanupSuggestion[] = [];

    // Cache cleanup suggestion
    if (breakdown.cache > 10 * 1024 * 1024) { // > 10MB
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
          const supported = await Linking.canOpenURL('App-Prefs:root=General&path=iPhone_STORAGE');
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
  }, []);

  // Clear selected files
  const clearSelectedFiles = useCallback(async (files: LargeFile[]): Promise<boolean> => {
    try {
      let successCount = 0;
      
      for (const file of files) {
        try {
          await FileSystem.deleteAsync(file.uri);
          successCount++;
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
  }, [scanAppStorage]);

  // Perform initial scan
  const refresh = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    await scanAppStorage();
    setState(prev => ({ ...prev, isLoading: false }));
  }, [scanAppStorage]);

  // Update cleanup suggestions when breakdown changes
  useEffect(() => {
    if (state.breakdown) {
      const suggestions = generateCleanupSuggestions(state.breakdown);
      setState(prev => ({ ...prev, cleanupSuggestions: suggestions }));
    }
  }, [state.breakdown, generateCleanupSuggestions]);

  // Initial scan on mount
  useEffect(() => {
    refresh();
    
    return () => {
      if (scanAbortController.current) {
        scanAbortController.current.abort();
      }
    };
  }, [refresh]);

  return {
    ...state,
    refresh,
    requestMediaPermission,
    clearSelectedFiles,
    formatBytes,
  };
};