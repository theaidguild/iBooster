// Deterministic health score computation utility
// Replaces randomized mock data with transparent, consistent scoring

export interface ScoreInputs {
  batteryPercent: number; // 0-100
  storageUsedPercent: number; // 0-100
  networkQuality: number; // 0-100
}

/**
 * Clamp a value to a given range
 */
const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

/**
 * Compute deterministic health score from device metrics
 *
 * @param inputs - Device metrics (battery, storage, network)
 * @returns Health score (0-100, rounded to nearest integer)
 */
export function computeHealthScore({
  batteryPercent,
  storageUsedPercent,
  networkQuality,
}: ScoreInputs): number {
  // Tunable weights for different components
  const wBattery = 0.4; // Battery is most important for mobile devices
  const wStorage = 0.35; // Storage pressure affects performance
  const wNetwork = 0.25; // Network quality affects user experience

  // Normalize and clamp all inputs
  const battery = clamp(batteryPercent);
  const storageFreePercent = clamp(100 - storageUsedPercent); // Convert to "free" percent (higher is better)
  const network = clamp(networkQuality);

  // Compute weighted score
  const rawScore = wBattery * battery + wStorage * storageFreePercent + wNetwork * network;

  // Round and clamp final result
  return Math.round(clamp(rawScore));
}

/**
 * Map network type and connectivity to quality score (0-100)
 */
export function mapNetworkToQuality(
  type: string | null,
  isConnected: boolean,
  isInternetReachable: boolean | null,
): number {
  if (!isConnected || type === 'none' || type === null) {
    return 0; // No connection
  }

  if (isInternetReachable === false) {
    return 20; // Connected but no internet
  }

  // Map network types to quality scores
  switch (type.toLowerCase()) {
    case 'wifi':
      return 90; // WiFi is typically fastest and most reliable
    case 'cellular':
      return 70; // Cellular is good but may have data limits
    case 'ethernet':
      return 95; // Wired connection is excellent
    case 'bluetooth':
      return 50; // Bluetooth is slower
    case 'vpn':
      return 75; // VPN adds some overhead
    default:
      return 60; // Unknown type, assume moderate quality
  }
}
