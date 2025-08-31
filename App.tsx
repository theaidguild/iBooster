import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { OnboardingScreen } from './screens/Onboarding';
import { AuthScreen } from './screens/Auth';
import { HomeScreen } from './screens/Home';
import { BatteryScreen } from './screens/Battery';
import { StorageScreen } from './screens/Storage';
import { NetworkScreen } from './screens/Network';
import { TipsScreen } from './screens/Tips';
import { useOnboardingPersistence } from './hooks/useOnboardingPersistence';
import { useAuth } from './screens/Auth';
import { Colors } from './colors';

// Initialize i18n
import './i18n';

// Screen enum for simple navigation
type Screen = 'onboarding' | 'auth' | 'home' | 'battery' | 'storage' | 'network' | 'tips';

// Custom theme using rocket icon color scheme
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary[500], // Bright green
    primaryContainer: Colors.primary[50], // Very light green
    secondary: Colors.accent[600], // Medium purple
    tertiary: Colors.primary[700], // Cyan
    background: '#FFFFFF',
    surface: Colors.neutral[50],
    surfaceVariant: Colors.neutral[100],
    onBackground: Colors.neutral[800],
    onSurface: Colors.neutral[800],
    onSurfaceVariant: Colors.neutral[600],
    outline: Colors.neutral[300],
    // Custom colors for the app
    error: Colors.status.critical,
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary[500], // Bright green
    primaryContainer: Colors.background.primary, // Deep navy
    secondary: Colors.accent[500], // Purple accent
    tertiary: Colors.primary[700], // Cyan
    background: Colors.background.primary, // Deep navy
    surface: Colors.background.secondary, // Medium purple
    surfaceVariant: Colors.background.surface, // Purple surface
    onBackground: Colors.neutral[100],
    onSurface: Colors.neutral[100],
    onSurfaceVariant: Colors.neutral[300],
    outline: Colors.neutral[600],
    // Custom colors for the app
    error: Colors.status.critical,
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

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

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
    if (isAppReady && !isOnboardingLoading && !isAuthLoading && hasCompletedOnboarding !== null) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setIsAppReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [isAppReady, isOnboardingLoading, isAuthLoading, hasCompletedOnboarding]);

  // Set initial screen based on onboarding and auth status once loaded
  useEffect(() => {
    if (hasCompletedOnboarding !== null && !isAuthLoading) {
      if (!hasCompletedOnboarding) {
        setCurrentScreen('onboarding');
      } else if (!isAuthenticated) {
        setCurrentScreen('auth');
      } else {
        setCurrentScreen('home');
      }
    }
  }, [hasCompletedOnboarding, isAuthenticated, isAuthLoading]);

  // Don't render anything until app, onboarding, and auth status are ready
  if (!isAppReady || isOnboardingLoading || isAuthLoading || hasCompletedOnboarding === null) {
    return null;
  }

  const handleOnboardingComplete = async () => {
    await markOnboardingCompleted();
    setCurrentScreen('auth');
  };

  const handleAuthComplete = () => {
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

  const navigateToAuth = () => {
    setCurrentScreen('auth');
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

        {/* Auth Screen */}
        {currentScreen === 'auth' && <AuthScreen onComplete={handleAuthComplete} />}

        {/* Home Screen - Always render to preserve state */}
        {currentScreen !== 'onboarding' && currentScreen !== 'auth' && (
          <View style={{ flex: 1, display: currentScreen === 'home' ? 'flex' : 'none' }}>
            <HomeScreen
              onNavigateToBattery={navigateToBattery}
              onNavigateToStorage={navigateToStorage}
              onNavigateToNetwork={navigateToNetwork}
              onNavigateToTips={navigateToTips}
              onNavigateToAuth={navigateToAuth}
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
