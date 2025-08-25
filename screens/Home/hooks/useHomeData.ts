import { useState, useCallback, useMemo } from 'react';
import { useBatteryMonitor } from '../../../hooks/useBatteryMonitor';
import { useStorageAnalyzer } from '../../../hooks/useStorageAnalyzer';
import { useNetworkPerformance } from '../../../hooks/useNetworkPerformance';
import { computeHealthScore, mapNetworkToQuality } from '../../../utils/healthScore';
import { DeviceHealthData } from '../types';

/**
 * Map network quality score to user-friendly strength label
 */
const getNetworkStrength = (quality: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (quality >= 85) return 'excellent';
  if (quality >= 65) return 'good';
  if (quality >= 35) return 'fair';
  return 'poor';
};

/**
 * Map network type from expo-network to our UI types
 */
const mapNetworkType = (
  type: string | null,
  isConnected: boolean
): 'wifi' | 'cellular' | 'none' => {
  if (!isConnected || type === 'none' || type === null) {
    return 'none';
  }
  
  switch (type.toLowerCase()) {
    case 'wifi':
      return 'wifi';
    case 'cellular':
      return 'cellular';
    default:
      return 'wifi'; // Default to wifi for ethernet, vpn, etc.
  }
};

export const useHomeData = () => {
  // Real device data hooks
  const { batteryState, isLoading: isBatteryLoading, refresh: refreshBattery } = useBatteryMonitor();
  const { breakdown, isLoading: isStorageLoading, refresh: refreshStorage } = useStorageAnalyzer();
  const { networkState, isLoadingNetwork, refresh: refreshNetwork } = useNetworkPerformance();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute device health data from real sources
  const data = useMemo((): DeviceHealthData | null => {
    // If any critical data is still loading, return null
    if (isBatteryLoading || isStorageLoading || isLoadingNetwork) {
      return null;
    }

    // Battery data
    const batteryLevel = batteryState?.batteryLevelPercent ?? 0;
    const batteryIsCharging = batteryState?.isCharging ?? false;

    // Storage data
    let storageUsed = 0;
    let storageTotal = 128; // Default fallback (128GB)
    let storageUsedPercent = 0;

    if (breakdown) {
      // Prefer device totals if available
      if (breakdown.deviceTotal && breakdown.free !== undefined) {
        storageTotal = breakdown.deviceTotal / (1024 * 1024 * 1024); // Convert bytes to GB
        const used = breakdown.deviceTotal - breakdown.free;
        storageUsed = used / (1024 * 1024 * 1024); // Convert bytes to GB
        storageUsedPercent = (used / breakdown.deviceTotal) * 100;
      } else {
        // Fallback to app storage totals
        storageUsed = breakdown.total / (1024 * 1024 * 1024); // Convert bytes to GB
        storageTotal = Math.max(storageUsed * 2, 64); // Estimate total as at least 2x used, min 64GB
        storageUsedPercent = (breakdown.total / (storageTotal * 1024 * 1024 * 1024)) * 100;
      }
    }

    // Network data
    const networkQuality = mapNetworkToQuality(
      networkState?.typeName ?? null,
      networkState?.isConnected ?? false,
      networkState?.isInternetReachable ?? null
    );
    const networkType = mapNetworkType(
      networkState?.typeName ?? null,
      networkState?.isConnected ?? false
    );
    const networkStrength = getNetworkStrength(networkQuality);

    // Compute deterministic health score
    const score = computeHealthScore({
      batteryPercent: batteryLevel,
      storageUsedPercent: Math.min(storageUsedPercent, 100), // Clamp to prevent over 100%
      networkQuality,
    });

    return {
      score,
      batteryLevel,
      batteryIsCharging,
      storageUsed: Math.round(storageUsed * 10) / 10, // Round to 1 decimal place
      storageTotal: Math.round(storageTotal),
      networkType,
      networkStrength,
    };
  }, [batteryState, breakdown, networkState, isBatteryLoading, isStorageLoading, isLoadingNetwork]);

  // Refresh function to update all underlying data sources
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Refresh all underlying hooks in parallel
      await Promise.all([
        refreshBattery(),
        refreshStorage(),
        refreshNetwork(),
      ]);
    } catch (error) {
      console.error('Error refreshing home data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshBattery, refreshStorage, refreshNetwork]);

  // Determine loading state
  const isLoading = isBatteryLoading || isStorageLoading || isLoadingNetwork;

  return {
    data,
    isLoading,
    isRefreshing,
    refresh,
  };
};
