export interface DeviceHealthData {
  score: number; // 0-100
  batteryLevel: number; // 0-100
  batteryIsCharging: boolean;
  storageUsed: number; // in GB
  storageTotal: number; // in GB
  networkType: 'wifi' | 'cellular' | 'none';
  networkStrength: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface StatusCardData {
  title: string;
  value: string;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: string;
  onPress: () => void;
}

export interface QuickActionData {
  title: string;
  icon: string;
  onPress: () => void;
}
