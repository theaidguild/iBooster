import { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceHealthData } from '../types';

// Mock data generator - in a real app this would come from device APIs
const generateMockData = (): DeviceHealthData => {
  const batteryLevel = Math.floor(Math.random() * 40) + 60; // 60-100%
  const storageUsed = Math.floor(Math.random() * 30) + 20; // 20-50 GB
  const storageTotal = 128; // 128 GB typical iPhone storage
  const networkTypes: Array<'wifi' | 'cellular' | 'none'> = ['wifi', 'cellular'];
  const networkStrengths: Array<'excellent' | 'good' | 'fair' | 'poor'> = ['excellent', 'good', 'fair', 'poor'];
  
  // Calculate health score based on battery, storage, and network
  const batteryScore = batteryLevel > 80 ? 30 : batteryLevel > 50 ? 20 : 10;
  const storageScore = (storageUsed / storageTotal) < 0.8 ? 30 : (storageUsed / storageTotal) < 0.9 ? 20 : 10;
  const networkScore = Math.random() > 0.5 ? 30 : 20;
  const baseScore = batteryScore + storageScore + networkScore;
  const healthScore = Math.min(100, baseScore + Math.floor(Math.random() * 20)); // Add some randomness
  
  return {
    score: healthScore,
    batteryLevel,
    batteryIsCharging: Math.random() > 0.7,
    storageUsed,
    storageTotal,
    networkType: networkTypes[Math.floor(Math.random() * networkTypes.length)],
    networkStrength: networkStrengths[Math.floor(Math.random() * networkStrengths.length)],
  };
};

export const useHomeData = () => {
  const [data, setData] = useState<DeviceHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async (isRefresh: boolean = false) => {
    // Guard against overlapping fetches
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const newData = generateMockData();
      setData(newData);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Initial fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up periodic refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    data,
    isLoading,
    isRefreshing,
    refresh,
  };
};