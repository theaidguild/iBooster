import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { OnboardingScreen } from './screens/Onboarding';
import { HomeScreen } from './screens/Home';
import { BatteryScreen } from './screens/Battery';
import { StorageScreen } from './screens/Storage';
import { NetworkScreen } from './screens/Network';
import { TipsScreen } from './screens/Tips';
import { useOnboardingPersistence } from './hooks/useOnboardingPersistence';

// Initialize i18n
import './i18n';

// Screen enum for simple navigation
type Screen = 'onboarding' | 'home' | 'battery' | 'storage' | 'network' | 'tips';

// Custom theme based on the style guide in docs/overview.md
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007AFF',
    primaryContainer: '#E3F2FF',
    secondary: '#1E2A38',
    background: '#FFFFFF',
    surface: '#F8F8F8',
    surfaceVariant: '#F2F4F7',
    onBackground: '#333333',
    onSurface: '#333333',
    onSurfaceVariant: '#666666',
    outline: '#999999',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#007AFF',
    primaryContainer: '#1E2A38',
    secondary: '#007AFF',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    onBackground: '#E0E0E0',
    onSurface: '#E0E0E0',
    onSurfaceVariant: '#B0B0B0',
    outline: '#666666',
  },
};

export default function App() {
  const colorScheme = useColorScheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [isAppReady, setIsAppReady] = useState(false);
  const {
    hasCompletedOnboarding,
    isLoading: isOnboardingLoading,
    markOnboardingCompleted,
  } = useOnboardingPersistence();

  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();

        // Add 2-second delay to showcase splash screen
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // App initialization would go here if needed
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setIsAppReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isAppReady && !isOnboardingLoading && hasCompletedOnboarding !== null) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setIsAppReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [isAppReady, isOnboardingLoading, hasCompletedOnboarding]);

  // Set initial screen based on onboarding status once loaded
  useEffect(() => {
    if (hasCompletedOnboarding !== null) {
      setCurrentScreen(hasCompletedOnboarding ? 'home' : 'onboarding');
    }
  }, [hasCompletedOnboarding]);

  // Don't render anything until app and onboarding status are ready
  if (!isAppReady || isOnboardingLoading || hasCompletedOnboarding === null) {
    return null;
  }

  const handleOnboardingComplete = async () => {
    await markOnboardingCompleted();
    setCurrentScreen('home');
  };

  const navigateToBattery = () => {
    setCurrentScreen('battery');
  };

  const navigateToStorage = () => {
    setCurrentScreen('storage');
  };

  const navigateToNetwork = () => {
    setCurrentScreen('network');
  };

  const navigateToTips = () => {
    setCurrentScreen('tips');
  };

  const navigateToHome = () => {
    setCurrentScreen('home');
  };

  const navigateToOnboarding = () => {
    setCurrentScreen('onboarding');
  };

  const renderScreen = () => {
    return (
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        {/* Onboarding Screen */}
        {currentScreen === 'onboarding' && (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        )}

        {/* Home Screen - Always render to preserve state */}
        {currentScreen !== 'onboarding' && (
          <View style={{ flex: 1, display: currentScreen === 'home' ? 'flex' : 'none' }}>
            <HomeScreen
              onNavigateToBattery={navigateToBattery}
              onNavigateToStorage={navigateToStorage}
              onNavigateToNetwork={navigateToNetwork}
              onNavigateToTips={navigateToTips}
              onNavigateToOnboarding={navigateToOnboarding}
            />
          </View>
        )}

        {/* Other Screens */}
        {currentScreen === 'battery' && <BatteryScreen onNavigateBack={navigateToHome} />}
        {currentScreen === 'storage' && <StorageScreen onNavigateBack={navigateToHome} />}
        {currentScreen === 'network' && <NetworkScreen onGoBack={navigateToHome} />}
        {currentScreen === 'tips' && <TipsScreen onNavigateBack={navigateToHome} />}
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>{renderScreen()}</PaperProvider>
    </SafeAreaProvider>
  );
}
