# Dashboard Health Score Changes On Pull-to-Refresh

Date: 2025-08-25
Author: Copilot

## Summary

Each pull-to-refresh on the Home/Dashboard screen changes the "Device Health Score" and the values in the status cards. This is expected with the current code because the data is intentionally randomized by a mock data generator inside `useHomeData`. As a result, every refresh produces new random inputs and a new score.

## Where the score comes from

- File: `screens/Home/hooks/useHomeData.ts`
- Function: `generateMockData()`
- Notable lines:
  - Battery level is randomized: `Math.floor(Math.random() * 40) + 60` → 60–100%
  - Storage used is randomized: `Math.floor(Math.random() * 30) + 20` → 20–50 GB
  - Network type/strength randomly chosen
  - Health score uses random components:
    - `const networkScore = Math.random() > 0.5 ? 30 : 20`
    - `const healthScore = Math.min(100, baseScore + Math.floor(Math.random() * 20))`

The hook `useHomeData` calls `generateMockData()` on mount and on every refresh, which explains the changing score and card values observed in the screenshots.

## Impact

- User sees a different score and metrics on each refresh even if the device state hasn’t changed.
- Makes the health score feel unreliable and undermines trust.

## Reproduction

1. Open the app to the Dashboard (Home).
2. Pull to refresh repeatedly.
3. Observe `Device Health Score` and Battery/Storage/Network card values change each time.

## Root Cause

"Mock" data path still active in production build for `Home` dashboard. Randomized inputs and random noise term are used to compute the score.

## Affected Files

- `screens/Home/hooks/useHomeData.ts` (source of randomness)
- `screens/Home/HomeScreen.tsx` consumes `useHomeData()` and displays `score` and derived cards.

## Recommendations (short-term)

- Remove randomness and compute score deterministically from existing hooks that read real device state where available:
  - Battery: `hooks/useBatteryMonitor.ts` → `batteryState.batteryLevelPercent` and `isCharging`.
  - Storage: `hooks/useStorageAnalyzer.ts` → `breakdown.total`, `breakdown.deviceTotal`, `breakdown.free`.
  - Network: `hooks/useNetworkPerformance.ts` → `networkState.type`, and if desired, simple latency/availability.
- While migrating, if you still want mock values for development, gate them behind a dev flag or `__DEV__` check and keep production stable.

### Minimal deterministic patch (keeping mock but stable per session)

If you must keep mock data temporarily, ensure refresh returns the same values within a session by seeding once and caching:

- Generate once on mount and reuse on refresh (remove random noise on refresh), or persist the first generated dataset in state/AsyncStorage and return it until a real measurement updates.

Pseudo-change suggestions in `useHomeData.ts`:

- Remove the extra noise term and network random coin flip.
- Option A: compute from actual hooks (preferred).
- Option B: create a single mock snapshot on first mount and reuse.

```ts
// Remove random components
const networkScore = 25; // fixed mid value if network is present
const healthScore = Math.min(100, baseScore); // no extra random noise
```

## Recommendations (longer-term)

- Create a shared scoring utility, e.g., `utils/healthScore.ts`, with a deterministic formula:
  - Inputs:
    - `batteryPercent` (0–100)
    - `storageUsedPercent` (0–100)
    - `networkQuality` (0–100)
  - Output: `score` (0–100)
  - Deterministic mapping, e.g.: `score = 0.4*battery + 0.35*(100-storageUsedPct) + 0.25*networkQuality` with clamping.
- Source inputs from the three existing hooks and debounce refreshes to avoid transient spikes.
- Persist last-known score to display instantly on open, then update after real measurements.

## Acceptance Criteria for the fix

- Pull-to-refresh should not change the score if the underlying battery/storage/network haven’t materially changed.
- Score formula is deterministic given the same inputs.
- Any mock mode is disabled in release builds or clearly labeled.

## Notes

- The screenshots align with the behavior of the random generator: 74, 76, 81, 97 are plausible outcomes of `baseScore + random(0..19)`.
- No issue found with the pull-to-refresh mechanism itself; the refresh just triggers new randomized data.

---

## Fix: Use real device data (no mocks)

Below is a concrete, deterministic implementation plan that removes all randomness and computes the Dashboard from real hooks already present in the app.

### 1) Create a deterministic scoring utility

Add `utils/healthScore.ts` with a simple, transparent formula. This keeps the scoring logic testable and independent from UI.

```ts
// utils/healthScore.ts
export type ScoreInputs = {
  batteryPercent: number; // 0-100
  storageUsedPercent: number; // 0-100
  networkQuality: number; // 0-100
};

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export function computeHealthScore({
  batteryPercent,
  storageUsedPercent,
  networkQuality,
}: ScoreInputs): number {
  // Tuneable weights; choose something intuitive and stable
  const wBattery = 0.4;
  const wStorage = 0.35; // less used is better → transform to free percent
  const wNetwork = 0.25;

  const battery = clamp(batteryPercent);
  const storageFreePercent = clamp(100 - storageUsedPercent);
  const network = clamp(networkQuality);

  const raw = wBattery * battery + wStorage * storageFreePercent + wNetwork * network;
  return Math.round(clamp(raw));
}
```

### 2) Replace mocked `useHomeData` with real sources

Update `screens/Home/hooks/useHomeData.ts` to read actual device state from the existing hooks and compute the score via `computeHealthScore`. No mocked values, no randomness.

```ts
// screens/Home/hooks/useHomeData.ts
import { useMemo } from 'react';
import { useBatteryMonitor } from '../../../hooks/useBatteryMonitor';
import { useStorageAnalyzer } from '../../../hooks/useStorageAnalyzer';
import { useNetworkPerformance } from '../../../hooks/useNetworkPerformance';
import { computeHealthScore } from '../../../utils/healthScore';
import type { DeviceHealthData } from '../types';

export const useHomeData = () => {
  // Real device data hooks
  const { batteryState, isLoading: isBatteryLoading } = useBatteryMonitor();
  const { breakdown, isLoading: isStorageLoading } = useStorageAnalyzer();
  const { networkState, isLoadingNetwork } = useNetworkPerformance();

  const data: DeviceHealthData | null = useMemo(() => {
    // Battery percent
    const batteryPercent = batteryState?.batteryLevelPercent ?? 0;

    // Storage used percent
    // Prefer device totals when available; otherwise approximate from app totals
    let storageUsedPercent = 0;
    if (breakdown?.deviceTotal && breakdown?.free != null) {
      const used = breakdown.deviceTotal - breakdown.free;
      storageUsedPercent = Math.round((used / breakdown.deviceTotal) * 100);
    } else if (breakdown?.total && breakdown?.deviceTotal) {
      storageUsedPercent = Math.round((breakdown.total / breakdown.deviceTotal) * 100);
    }

    // Network quality (0-100)
    // Start from connectivity; refine by type
    let networkQuality = 0;
    let networkType: 'wifi' | 'cellular' | 'none' = 'none';
    if (networkState?.isConnected) {
      networkQuality = 40; // baseline when connected
      switch (networkState.type) {
        case 1: // WIFI (expo-network)
          networkQuality = 85;
          networkType = 'wifi';
          break;
        case 0: // CELLULAR
          networkQuality = 70;
          networkType = 'cellular';
          break;
        default:
          networkQuality = 40;
          networkType = 'cellular'; // treat unknown-but-connected conservatively
      }
      if (networkState.isInternetReachable === false) {
        networkQuality = 10; // connected locally but no internet
      }
    }

    // Map quality to strength label for the Status Card
    const networkStrength =
      networkQuality >= 85
        ? 'excellent'
        : networkQuality >= 65
          ? 'good'
          : networkQuality >= 45
            ? 'fair'
            : 'poor';

    // Deterministic overall score
    const score = computeHealthScore({
      batteryPercent,
      storageUsedPercent,
      networkQuality,
    });

    // Provide numbers in GB for UI consistency
    const storageTotalGB = breakdown?.deviceTotal
      ? Math.round(breakdown.deviceTotal / 1024 ** 3)
      : 0;
    const storageUsedGB =
      breakdown?.deviceTotal && breakdown?.free != null
        ? Math.round((breakdown.deviceTotal - breakdown.free) / 1024 ** 3)
        : 0;

    return {
      score,
      batteryLevel: Math.round(batteryPercent),
      batteryIsCharging: !!batteryState?.isCharging,
      storageUsed: storageUsedGB,
      storageTotal: storageTotalGB,
      networkType,
      networkStrength,
    } as DeviceHealthData;
  }, [batteryState, breakdown, networkState]);

  const isLoading = isBatteryLoading || isStorageLoading || isLoadingNetwork;

  return {
    data,
    isLoading,
    isRefreshing: false, // refresh state can be wired to re-run underlying hooks if needed
    refresh: () => Promise.resolve(), // or trigger re-fetches from the three hooks
  };
};
```

Notes:

- The code above removes all randomization. Given the same underlying device state, the score will remain stable across refreshes.
- If you need a manual refresh, expose `refresh` methods from the underlying hooks (battery, storage, network) and call them here, then recompute.

### 3) Keep `HomeScreen.tsx` unchanged

`HomeScreen.tsx` already consumes `useHomeData()` and displays `data.score` and the cards. By replacing the hook’s implementation as above, the UI will use real data without additional changes.

### 4) Edge cases and stability

- Missing metrics: if a particular hook can’t produce data (permissions, platform), the code above falls back to `0` or available totals. You can also persist the last-known score (via `AsyncStorage`) and show it until fresh data arrives.
- Debouncing: if network/battery fluctuate rapidly, you can smooth the score by computing a short moving average in the scoring utility or in this hook—still deterministic for a given input stream.
- Testing: add unit tests for `computeHealthScore` to guarantee determinism and guard weights.

### 5) Acceptance criteria validation

- Pull-to-refresh no longer changes the score unless the underlying battery/storage/network changed.
- No mocked values, no `Math.random()` in the path producing Dashboard data.
- The formula is deterministic and centralized in `utils/healthScore.ts`.
