import React from 'react';
import { useRouter } from 'expo-router';
import { ProfileScreen } from '../screens/Profile';

export default function ProfileRoute() {
  const router = useRouter();

  const handleNavigateBack = () => {
    router.back();
  };

  const handleNavigateToAuth = () => {
    router.replace('/(auth)/login');
  };

  const handleNavigateToNotifications = () => {
    router.push('/notifications');
  };

  return (
    <ProfileScreen
      onNavigateBack={handleNavigateBack}
      onNavigateToAuth={handleNavigateToAuth}
      onNavigateToNotifications={handleNavigateToNotifications}
    />
  );
}