import { useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';

export interface OnboardingState {
  currentIndex: number;
  isCompleted: boolean;
}

export interface OnboardingActions {
  nextSlide: () => void;
  previousSlide: () => void;
  goToSlide: (index: number) => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  requestNotificationPermissions: () => Promise<boolean>;
}

export const useOnboarding = (totalSlides: number = 4) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const previousSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)));
    },
    [totalSlides],
  );

  const skipOnboarding = useCallback(() => {
    setIsCompleted(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsCompleted(true);
  }, []);

  const requestNotificationPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, []);

  const state: OnboardingState = {
    currentIndex,
    isCompleted,
  };

  const actions: OnboardingActions = {
    nextSlide,
    previousSlide,
    goToSlide,
    skipOnboarding,
    completeOnboarding,
    requestNotificationPermissions,
  };

  return { state, actions };
};
