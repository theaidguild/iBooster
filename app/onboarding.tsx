import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../screens/Onboarding';
import { useOnboardingPersistence } from '../hooks/useOnboardingPersistence';

export default function OnboardingRoute() {
  const router = useRouter();
  const { markOnboardingCompleted } = useOnboardingPersistence();

  const handleComplete = async () => {
    await markOnboardingCompleted();
    router.replace('/(auth)/login');
  };

  return <OnboardingScreen onComplete={handleComplete} />;
}