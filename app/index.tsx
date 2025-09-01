import React from 'react';
import { Redirect } from 'expo-router';
import { useOnboardingPersistence } from '../hooks/useOnboardingPersistence';
import { useAuth } from '../screens/Auth';

export default function Index() {
  const { hasCompletedOnboarding, isLoading: isOnboardingLoading } = useOnboardingPersistence();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Don't render anything until we have the status
  if (isOnboardingLoading || isAuthLoading || hasCompletedOnboarding === null) {
    return null;
  }

  // Redirect based on current state
  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)" />;
}
