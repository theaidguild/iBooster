import React from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors } from '../colors';

// Initialize i18n
import '../i18n';

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
    outlineVariant: Colors.neutral[200],
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary[400], // Slightly dimmed green for dark mode
    primaryContainer: Colors.primary[900], // Very dark green
    secondary: Colors.accent[400], // Lighter purple for dark mode
    tertiary: Colors.primary[300], // Light cyan
    background: Colors.neutral[900],
    surface: Colors.neutral[800],
    surfaceVariant: Colors.neutral[700],
    onBackground: Colors.neutral[100],
    onSurface: Colors.neutral[100],
    onSurfaceVariant: Colors.neutral[300],
    outline: Colors.neutral[600],
    outlineVariant: Colors.neutral[700],
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}