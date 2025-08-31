import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import * as Network from 'expo-network';

// Constants
const LATENCY_TEST_ENDPOINTS = [
  'https://www.google.com/generate_204', // 204 no content (very small)
  'https://www.cloudflare.com/cdn-cgi/trace', // tiny text
  'https://www.apple.com/library/test/success.html', // small HTML
];
const SAMPLES_PER_ENDPOINT = 2; // total samples = endpoints * SAMPLES_PER_ENDPOINT
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
  // Optional metadata to help the UI explain results
  samples?: number[]; // successful latency samples collected
  sampleCount?: number; // total attempted samples
  endpoints?: string[]; // endpoints used for the test
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

// Measure latency for a single request
const measureLatency = async (url: string, t: TFunction): Promise<number | null> => {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LATENCY_TEST_TIMEOUT);
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    return Date.now() - start;
  } catch (err) {
    // Swallow per-sample errors; overall aggregation will handle it
    return null;
  }
};

// Helper function to perform latency test: multiple samples across multiple endpoints
const performLatencyTest = async (t: TFunction): Promise<LatencyTestResult> => {
  const timestamp = Date.now();
  const samples: number[] = [];
  let attempted = 0;

  for (const endpoint of LATENCY_TEST_ENDPOINTS) {
    for (let i = 0; i < SAMPLES_PER_ENDPOINT; i++) {
      attempted += 1;
      const sample = await measureLatency(endpoint, t);
      if (typeof sample === 'number') samples.push(sample);
    }
  }

  if (samples.length === 0) {
    return {
      latency: null,
      timestamp,
      error: t('network.errors.noSamples'),
      samples,
      sampleCount: attempted,
      endpoints: LATENCY_TEST_ENDPOINTS,
    };
  }

  // Use median to reduce impact of spikes
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];

  return {
    latency: median,
    timestamp,
    samples,
    sampleCount: attempted,
    endpoints: LATENCY_TEST_ENDPOINTS,
  };
};

export const useNetworkPerformance = () => {
  const { t } = useTranslation();
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [latencyResult, setLatencyResult] = useState<LatencyTestResult | null>(null);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(true);
  const [isLoadingLatency, setIsLoadingLatency] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);
  const latencyTestRef = useRef<Promise<LatencyTestResult> | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<LatencyTestResult[]>([]);

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
    if (latencyResult && Date.now() - latencyResult.timestamp < LATENCY_CACHE_DURATION) {
      return latencyResult;
    }

    setIsLoadingLatency(true);

    try {
      const testPromise = performLatencyTest(t);
      latencyTestRef.current = testPromise;

      const result = await testPromise;
      setLatencyResult(result);
      // Maintain a short in-memory history (last 5 successful/attempted results)
      setLatencyHistory((prev) => {
        const next = [result, ...prev];
        return next.slice(0, 5);
      });

      return result;
    } finally {
      setIsLoadingLatency(false);
      latencyTestRef.current = null;
    }
  }, [latencyResult, t]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchNetworkState(), runLatencyTest()]);
  }, [fetchNetworkState, runLatencyTest]);

  // Initial fetch on mount
  useEffect(() => {
    fetchNetworkState();
  }, [fetchNetworkState]);

  return {
    networkState,
    latencyResult,
    latencyHistory,
    isLoadingNetwork,
    isLoadingLatency,
    lastRefresh,
    refresh,
    runLatencyTest,
    fetchNetworkState,
  };
};
