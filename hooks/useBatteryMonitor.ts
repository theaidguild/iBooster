import { useState, useEffect, useCallback, useRef } from 'react';
import * as Battery from 'expo-battery';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface BatteryState {
  batteryLevel: number; // 0-1 range
  batteryLevelPercent: number; // 0-100 range  
  batteryState: Battery.BatteryState;
  isCharging: boolean;
  lowPowerMode: boolean | null;
}

export interface BatterySample {
  timestamp: number;
  level: number; // 0-100
  isCharging: boolean;
}

export interface BatteryMonitorState {
  batteryState: BatteryState | null;
  batteryHistory: BatterySample[];
  isLoading: boolean;
  lowBatteryNotificationsEnabled: boolean;
  notificationThreshold: number;
}

export interface BatteryMonitorActions {
  refresh: () => Promise<void>;
  setLowBatteryNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setNotificationThreshold: (threshold: number) => Promise<void>;
}

// Constants
const STORAGE_KEYS = {
  BATTERY_HISTORY: 'battery_history',
  LOW_BATTERY_NOTIFICATIONS: 'low_battery_notifications',
  NOTIFICATION_THRESHOLD: 'notification_threshold',
  LAST_NOTIFICATION_TIMESTAMP: 'last_notification_timestamp',
};

const DEFAULT_NOTIFICATION_THRESHOLD = 20;
const MAX_HISTORY_SAMPLES = 288; // 24h at 5-minute intervals
const SAMPLE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes to prevent spam

export const useBatteryMonitor = (): BatteryMonitorState & BatteryMonitorActions => {
  const [batteryState, setBatteryState] = useState<BatteryState | null>(null);
  const [batteryHistory, setBatteryHistory] = useState<BatterySample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lowBatteryNotificationsEnabled, setLowBatteryNotificationsEnabledState] = useState(false);
  const [notificationThreshold, setNotificationThresholdState] = useState(DEFAULT_NOTIFICATION_THRESHOLD);
  
  const batteryLevelListenerRef = useRef<Battery.Subscription | null>(null);
  const batteryStateListenerRef = useRef<Battery.Subscription | null>(null);
  const sampleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationRef = useRef<number>(0);

  // Load persisted data
  const loadPersistedData = useCallback(async () => {
    try {
      const [historyData, notificationsEnabled, threshold] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BATTERY_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.LOW_BATTERY_NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_THRESHOLD),
      ]);

      if (historyData) {
        const history: BatterySample[] = JSON.parse(historyData);
        // Filter out samples older than 24h
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const filteredHistory = history.filter(sample => sample.timestamp > dayAgo);
        setBatteryHistory(filteredHistory);
      }

      if (notificationsEnabled) {
        setLowBatteryNotificationsEnabledState(JSON.parse(notificationsEnabled));
      }

      if (threshold) {
        setNotificationThresholdState(parseInt(threshold, 10));
      }
    } catch (error) {
      console.error('Error loading persisted battery data:', error);
    }
  }, []);

  // Save battery history to storage
  const saveBatteryHistory = useCallback(async (history: BatterySample[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BATTERY_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving battery history:', error);
    }
  }, []);

  // Add sample to history
  const addBatterySample = useCallback(async (level: number, isCharging: boolean) => {
    const sample: BatterySample = {
      timestamp: Date.now(),
      level: Math.round(level * 100), // Convert from 0-1 to 0-100
      isCharging,
    };

    setBatteryHistory(prevHistory => {
      const newHistory = [...prevHistory, sample];
      // Keep only recent samples and limit total count
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const filteredHistory = newHistory
        .filter(s => s.timestamp > dayAgo)
        .slice(-MAX_HISTORY_SAMPLES);
      
      // Save to storage
      saveBatteryHistory(filteredHistory);
      return filteredHistory;
    });
  }, [saveBatteryHistory]);

  // Check and send low battery notification
  const checkLowBatteryNotification = useCallback(async (level: number) => {
    if (!lowBatteryNotificationsEnabled) return;

    const levelPercent = Math.round(level * 100);
    const now = Date.now();

    // Check if we should send notification
    if (levelPercent <= notificationThreshold && (now - lastNotificationRef.current) > NOTIFICATION_COOLDOWN) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Low Battery',
            body: `Battery level is ${levelPercent}%. Consider charging your device.`,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // Send immediately
        });
        
        lastNotificationRef.current = now;
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_NOTIFICATION_TIMESTAMP, now.toString());
      } catch (error) {
        console.error('Error sending low battery notification:', error);
      }
    }
  }, [lowBatteryNotificationsEnabled, notificationThreshold]);

  // Get current battery state
  const getCurrentBatteryState = useCallback(async (): Promise<BatteryState> => {
    try {
      const powerState = await Battery.getPowerStateAsync();
      const batteryLevel = powerState.batteryLevel ?? 0;
      
      return {
        batteryLevel,
        batteryLevelPercent: Math.round(batteryLevel * 100),
        batteryState: powerState.batteryState,
        isCharging: powerState.batteryState === Battery.BatteryState.CHARGING,
        lowPowerMode: powerState.lowPowerMode,
      };
    } catch (error) {
      console.error('Error getting battery state:', error);
      // Return fallback state
      return {
        batteryLevel: 0,
        batteryLevelPercent: 0,
        batteryState: Battery.BatteryState.UNKNOWN,
        isCharging: false,
        lowPowerMode: null,
      };
    }
  }, []);

  // Refresh battery data
  const refresh = useCallback(async () => {
    try {
      const newBatteryState = await getCurrentBatteryState();
      setBatteryState(newBatteryState);
      
      // Add sample to history
      await addBatterySample(newBatteryState.batteryLevel, newBatteryState.isCharging);
      
      // Check for low battery notification
      await checkLowBatteryNotification(newBatteryState.batteryLevel);
    } catch (error) {
      console.error('Error refreshing battery data:', error);
    }
  }, [getCurrentBatteryState, addBatterySample, checkLowBatteryNotification]);

  // Toggle low battery notifications
  const setLowBatteryNotificationsEnabled = useCallback(async (enabled: boolean) => {
    try {
      if (enabled) {
        // Request notification permissions
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            throw new Error('Notification permissions not granted');
          }
        }
      }

      setLowBatteryNotificationsEnabledState(enabled);
      await AsyncStorage.setItem(STORAGE_KEYS.LOW_BATTERY_NOTIFICATIONS, JSON.stringify(enabled));
    } catch (error) {
      console.error('Error setting low battery notifications:', error);
      throw error;
    }
  }, []);

  // Set notification threshold
  const setNotificationThreshold = useCallback(async (threshold: number) => {
    try {
      const clampedThreshold = Math.max(1, Math.min(50, threshold)); // Clamp between 1-50%
      setNotificationThresholdState(clampedThreshold);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_THRESHOLD, clampedThreshold.toString());
    } catch (error) {
      console.error('Error setting notification threshold:', error);
      throw error;
    }
  }, []);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Load persisted data
        await loadPersistedData();
        
        // Get initial battery state
        const initialState = await getCurrentBatteryState();
        setBatteryState(initialState);
        
        // Add initial sample
        await addBatterySample(initialState.batteryLevel, initialState.isCharging);
        
        // Load last notification timestamp
        const lastNotificationTimestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_NOTIFICATION_TIMESTAMP);
        if (lastNotificationTimestamp) {
          lastNotificationRef.current = parseInt(lastNotificationTimestamp, 10);
        }
        
      } catch (error) {
        console.error('Error initializing battery monitor:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [loadPersistedData, getCurrentBatteryState, addBatterySample]);

  // Set up listeners
  useEffect(() => {
    const setupListeners = async () => {
      try {
        // Battery level listener
        batteryLevelListenerRef.current = await Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setBatteryState(prev => prev ? { ...prev, batteryLevel, batteryLevelPercent: Math.round(batteryLevel * 100) } : null);
          addBatterySample(batteryLevel, batteryState?.isCharging ?? false);
          checkLowBatteryNotification(batteryLevel);
        });

        // Battery state listener  
        batteryStateListenerRef.current = await Battery.addBatteryStateListener(({ batteryState: newBatteryState }) => {
          const isCharging = newBatteryState === Battery.BatteryState.CHARGING;
          setBatteryState(prev => prev ? { ...prev, batteryState: newBatteryState, isCharging } : null);
        });

        // Periodic sampling
        sampleIntervalRef.current = setInterval(() => {
          if (batteryState) {
            addBatterySample(batteryState.batteryLevel, batteryState.isCharging);
          }
        }, SAMPLE_INTERVAL);

      } catch (error) {
        console.error('Error setting up battery listeners:', error);
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      if (batteryLevelListenerRef.current) {
        batteryLevelListenerRef.current.remove();
      }
      if (batteryStateListenerRef.current) {
        batteryStateListenerRef.current.remove();
      }
      if (sampleIntervalRef.current) {
        clearInterval(sampleIntervalRef.current);
      }
    };
  }, [batteryState, addBatterySample, checkLowBatteryNotification]);

  return {
    batteryState,
    batteryHistory,
    isLoading,
    lowBatteryNotificationsEnabled,
    notificationThreshold,
    refresh,
    setLowBatteryNotificationsEnabled,
    setNotificationThreshold,
  };
};