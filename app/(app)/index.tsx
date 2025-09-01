import React from 'react';
import { useRouter } from 'expo-router';
import { HomeScreen } from '../../screens/Home';

export default function HomeRoute() {
  const router = useRouter();

  // Navigation handlers using the router
  const handleNavigateToBattery = () => {
    router.push('/(app)/battery');
  };

  const handleNavigateToStorage = () => {
    router.push('/(app)/storage');
  };

  const handleNavigateToNetwork = () => {
    router.push('/(app)/network');
  };

  const handleNavigateToTips = () => {
    router.push('/(app)/tips');
  };

  const handleNavigateToAuth = () => {
    router.replace('/(auth)/login');
  };

  const handleNavigateToProfile = () => {
    router.push('/profile');
  };

  const handleNavigateToOnboarding = () => {
    router.push('/onboarding');
  };

  return (
    <HomeScreen
      onNavigateToBattery={handleNavigateToBattery}
      onNavigateToStorage={handleNavigateToStorage}
      onNavigateToNetwork={handleNavigateToNetwork}
      onNavigateToTips={handleNavigateToTips}
      onNavigateToAuth={handleNavigateToAuth}
      onNavigateToProfile={handleNavigateToProfile}
      onNavigateToOnboarding={handleNavigateToOnboarding}
    />
  );
}
