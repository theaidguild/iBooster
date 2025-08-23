import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import * as Network from 'expo-network';

// Constants
const LATENCY_TEST_URL = 'https://www.google.com/generate_204'; // Fast, lightweight endpoint
const LATENCY_TEST_TIMEOUT = 5000; // 5 seconds timeout
const LATENCY_CACHE_DURATION = 30000; // 30 seconds cache

// Types
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: Network.NetworkStateType;
  typeName: string;
}

export interface LatencyTestResult {
  latency: number | null; // in milliseconds
  timestamp: number;
  error?: string;
}

export interface NetworkPerformanceState {
  networkState: NetworkState | null;
  latencyResult: LatencyTestResult | null;
  isLoadingNetwork: boolean;
  isLoadingLatency: boolean;
  lastRefresh: number;
}

// Helper function to get user-friendly network type name
const getNetworkTypeName = (type: Network.NetworkStateType, t: TFunction): string => {
  switch (type) {
    case Network.NetworkStateType.WIFI:
      return t('network.networkTypes.wifi');
    case Network.NetworkStateType.CELLULAR:
      return t('network.networkTypes.cellular');
    case Network.NetworkStateType.ETHERNET:
      return t('network.networkTypes.ethernet');
    case Network.NetworkStateType.BLUETOOTH:
      return t('network.networkTypes.bluetooth');
    case Network.NetworkStateType.VPN:
      return t('network.networkTypes.vpn');
    case Network.NetworkStateType.NONE:
      return t('network.networkTypes.none');
    case Network.NetworkStateType.UNKNOWN:
    default:
      return t('network.networkTypes.unknown');
  }
};

// Helper function to perform latency test
const performLatencyTest = async (t: TFunction): Promise<LatencyTestResult> => {
  const startTime = Date.now();
  const timestamp = startTime;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LATENCY_TEST_TIMEOUT);

    const response = await fetch(LATENCY_TEST_URL, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const latency = Date.now() - startTime;
      return { latency, timestamp };
    } else {
      return {
        latency: null,
        timestamp,
        error: t('network.errors.httpError', { status: response.status }),
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          latency: null,
          timestamp,
          error: t('network.errors.requestTimeout'),
        };
      }
      return {
        latency: null,
        timestamp,
        error: error.message,
      };
    }
    return {
      latency: null,
      timestamp,
      error: t('network.errors.unknownError'),
    };
  }
};

export const useNetworkPerformance = () => {
  const { t } = useTranslation();
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [latencyResult, setLatencyResult] = useState<LatencyTestResult | null>(null);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(true);
  const [isLoadingLatency, setIsLoadingLatency] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);
  const latencyTestRef = useRef<Promise<LatencyTestResult> | null>(null);

  // Fetch network state
  const fetchNetworkState = useCallback(async () => {
    try {
      setIsLoadingNetwork(true);
      const networkState = await Network.getNetworkStateAsync();
      
      const newNetworkState: NetworkState = {
        isConnected: networkState.isConnected ?? false,
        isInternetReachable: networkState.isInternetReachable ?? null,
        type: networkState.type ?? Network.NetworkStateType.UNKNOWN,
        typeName: getNetworkTypeName(networkState.type ?? Network.NetworkStateType.UNKNOWN, t),
      };

      setNetworkState(newNetworkState);
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Error fetching network state:', error);
      // Set a fallback state
      setNetworkState({
        isConnected: false,
        isInternetReachable: null,
        type: Network.NetworkStateType.UNKNOWN,
        typeName: t('network.networkTypes.unknown'),
      });
    } finally {
      setIsLoadingNetwork(false);
    }
  }, [t]);

  // Run latency test
  const runLatencyTest = useCallback(async () => {
    // Prevent concurrent latency tests
    if (latencyTestRef.current) {
      return await latencyTestRef.current;
    }

    // Check if we have a recent result (within cache duration)
    if (
      latencyResult &&
      Date.now() - latencyResult.timestamp < LATENCY_CACHE_DURATION
    ) {
      return latencyResult;
    }

    setIsLoadingLatency(true);
    
    try {
      const testPromise = performLatencyTest(t);
      latencyTestRef.current = testPromise;
      
      const result = await testPromise;
      setLatencyResult(result);
      
      return result;
    } finally {
      setIsLoadingLatency(false);
      latencyTestRef.current = null;
    }
  }, [latencyResult, t]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchNetworkState(),
      runLatencyTest(),
    ]);
  }, [fetchNetworkState, runLatencyTest]);

  // Initial fetch on mount
  useEffect(() => {
    fetchNetworkState();
  }, [fetchNetworkState]);

  return {
    networkState,
    latencyResult,
    isLoadingNetwork,
    isLoadingLatency,
    lastRefresh,
    refresh,
    runLatencyTest,
    fetchNetworkState,
  };
};