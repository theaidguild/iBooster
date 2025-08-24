import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed_v1';

export interface OnboardingPersistenceState {
  hasCompletedOnboarding: boolean | null; // null while loading
  isLoading: boolean;
}

export interface OnboardingPersistenceActions {
  markOnboardingCompleted: () => Promise<void>;
  resetOnboardingStatus: () => Promise<void>;
}

export const useOnboardingPersistence = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        setHasCompletedOnboarding(value === 'true');
      } catch (e) {
        console.warn('Failed to load onboarding status', e);
        setHasCompletedOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const markOnboardingCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (e) {
      console.warn('Failed to persist onboarding completion', e);
      setHasCompletedOnboarding(true);
    }
  }, []);

  const resetOnboardingStatus = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      setHasCompletedOnboarding(false);
    } catch (e) {
      console.warn('Failed to reset onboarding status', e);
      setHasCompletedOnboarding(false);
    }
  }, []);

  const actions: OnboardingPersistenceActions = {
    markOnboardingCompleted,
    resetOnboardingStatus,
  };

  const state: OnboardingPersistenceState = {
    hasCompletedOnboarding,
    isLoading,
  };

  return { ...state, ...actions };
};
