import React from 'react';
import { useRouter } from 'expo-router';
import { NetworkScreen } from '../../screens/Network';

export default function NetworkRoute() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return <NetworkScreen onGoBack={handleGoBack} />;
}
