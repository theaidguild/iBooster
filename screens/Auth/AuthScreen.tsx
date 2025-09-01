import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedButtons, Surface, useTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { AuthHeader } from './components/AuthHeader';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';
import { SocialAuthButtons } from './components/SocialAuthButtons';
import { useAuth } from './hooks/useAuth';
import { AuthMode } from './types';

interface AuthScreenProps {
  onComplete: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');

  const { signIn, signUp, signInWithApple, signInAsGuest, isLoading, error, clearError } =
    useAuth();

  const handleModeChange = (value: string) => {
    clearError();
    setMode(value as AuthMode);
  };

  const handleAuthSuccess = () => {
    // Small delay to show success state before navigation
    setTimeout(() => {
      onComplete();
    }, 100);
  };

  const handleSignIn = async (credentials: { email: string; password: string }) => {
    await signIn(credentials);
    handleAuthSuccess();
  };

  const handleSignUp = async (data: {
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
  }) => {
    await signUp(data);
    handleAuthSuccess();
  };

  const handleAppleSignIn = async () => {
    await signInWithApple();
    handleAuthSuccess();
  };

  const handleGuestAccess = async () => {
    await signInAsGuest();
    handleAuthSuccess();
  };

  const segmentedButtonOptions = [
    {
      value: 'login',
      label: t('auth.mode.login'),
      icon: 'login' as const,
    },
    {
      value: 'signup',
      label: t('auth.mode.signup'),
      icon: 'account-plus' as const,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <AuthHeader mode={mode} />

          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <SegmentedButtons
              value={mode}
              onValueChange={handleModeChange}
              buttons={segmentedButtonOptions}
              style={styles.segmentedButtons}
              density="medium"
            />
          </View>

          {/* Form Content */}
          <Surface style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
            {mode === 'login' ? (
              <LoginForm
                onSubmit={handleSignIn}
                isLoading={isLoading}
                error={error}
                onClearError={clearError}
              />
            ) : (
              <SignUpForm
                onSubmit={handleSignUp}
                isLoading={isLoading}
                error={error}
                onClearError={clearError}
              />
            )}

            {/* Social Auth Buttons */}
            <SocialAuthButtons
              onAppleSignIn={handleAppleSignIn}
              onGuestAccess={handleGuestAccess}
              isLoading={isLoading}
            />
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  modeSelector: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  formContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
