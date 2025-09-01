import React from 'react';
import { useRouter } from 'expo-router';
import { TipsScreen } from '../../screens/Tips';

export default function TipsRoute() {
  const router = useRouter();

  const handleNavigateBack = () => {
    router.back();
  };

  return <TipsScreen onNavigateBack={handleNavigateBack} />;
}
