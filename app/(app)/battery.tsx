import React from 'react';
import { useRouter } from 'expo-router';
import { BatteryScreen } from '../../screens/Battery';

export default function BatteryRoute() {
  const router = useRouter();

  const handleNavigateBack = () => {
    router.back();
  };

  return <BatteryScreen onNavigateBack={handleNavigateBack} />;
}