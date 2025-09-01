/**
 * Network Service - Business logic for network operations
 * Separates business logic from UI components for better testability and reusability
 */

import * as Network from 'expo-network';

export interface NetworkStatus {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean | null;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface LatencyTestConfig {
  host?: string;
  timeout?: number;
  samples?: number;
}

export interface LatencyResult {
  latency: number | null;
  error?: string;
  timestamp: number;
  samples?: number[];
}

export class NetworkService {
  private static readonly DEFAULT_TEST_HOST = '8.8.8.8'; // Google DNS
  private static readonly DEFAULT_TIMEOUT = 5000; // 5 seconds
  private static readonly DEFAULT_SAMPLES = 3;

  /**
   * Get current network status
   */
  static async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      
      return {
        isConnected: networkState.isConnected || false,
        type: networkState.type || 'unknown',
        isInternetReachable: networkState.isInternetReachable,
        quality: NetworkService.determineQuality(networkState),
      };
    } catch (error) {
      console.warn('Failed to get network status:', error);
      return {
        isConnected: false,
        type: 'unknown',
        isInternetReachable: false,
        quality: 'poor',
      };
    }
  }

  /**
   * Run network latency test
   */
  static async runLatencyTest(config: LatencyTestConfig = {}): Promise<LatencyResult> {
    const {
      host = NetworkService.DEFAULT_TEST_HOST,
      timeout = NetworkService.DEFAULT_TIMEOUT,
      samples = NetworkService.DEFAULT_SAMPLES,
    } = config;

    const timestamp = Date.now();
    const latencyResults: number[] = [];

    try {
      // Run multiple samples for more accurate results
      for (let i = 0; i < samples; i++) {
        const startTime = Date.now();
        
        try {
          // Simple network request to measure latency
          const response = await fetch(`https://${host}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(timeout),
          });
          
          if (response.ok) {
            const endTime = Date.now();
            const latency = endTime - startTime;
            latencyResults.push(latency);
          }
        } catch (sampleError) {
          console.warn(`Latency sample ${i + 1} failed:`, sampleError);
        }
      }

      if (latencyResults.length === 0) {
        return {
          latency: null,
          error: 'All latency samples failed',
          timestamp,
          samples: [],
        };
      }

      // Calculate average latency
      const averageLatency = Math.round(
        latencyResults.reduce((sum, latency) => sum + latency, 0) / latencyResults.length
      );

      return {
        latency: averageLatency,
        timestamp,
        samples: latencyResults,
      };
    } catch (error) {
      return {
        latency: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
        samples: [],
      };
    }
  }

  /**
   * Determine network quality based on connection type and status
   */
  private static determineQuality(networkState: Network.NetworkState): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!networkState.isConnected) {
      return 'poor';
    }

    if (networkState.isInternetReachable === false) {
      return 'poor';
    }

    switch (networkState.type) {
      case Network.NetworkStateType.WIFI:
        return 'excellent';
      case Network.NetworkStateType.CELLULAR:
        return 'good';
      case Network.NetworkStateType.ETHERNET:
        return 'excellent';
      case Network.NetworkStateType.VPN:
        return 'fair';
      default:
        return 'fair';
    }
  }

  /**
   * Get network quality color based on status
   */
  static getQualityColor(quality: string): string {
    switch (quality) {
      case 'excellent':
        return '#10B981'; // Green
      case 'good':
        return '#3B82F6'; // Blue
      case 'fair':
        return '#F59E0B'; // Yellow
      case 'poor':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  }

  /**
   * Get latency quality based on ping time
   */
  static getLatencyQuality(latency: number | null): 'excellent' | 'good' | 'fair' | 'poor' {
    if (latency === null) return 'poor';
    if (latency < 50) return 'excellent';
    if (latency < 100) return 'good';
    if (latency < 200) return 'fair';
    return 'poor';
  }
}