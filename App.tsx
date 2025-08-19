import React, { useState } from 'react';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { OnboardingScreen } from './screens/Onboarding';
import { HomeScreen } from './screens/Home';

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
  const [showOnboarding, setShowOnboarding] = useState(true);

  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        {showOnboarding ? (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        ) : (
          <HomeScreen />
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}
