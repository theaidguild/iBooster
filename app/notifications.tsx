import React from 'react';
import { useRouter } from 'expo-router';
import { NotificationsScreen } from '../screens/Notifications';

export default function NotificationsRoute() {
  const router = useRouter();

  const handleNavigateBack = () => {
    router.back();
  };

  return <NotificationsScreen onNavigateBack={handleNavigateBack} />;
}