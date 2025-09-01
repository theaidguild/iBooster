import React from 'react';
import { useRouter } from 'expo-router';
import { StorageScreen } from '../../screens/Storage';

export default function StorageRoute() {
  const router = useRouter();

  const handleNavigateBack = () => {
    router.back();
  };

  return <StorageScreen onNavigateBack={handleNavigateBack} />;
}
