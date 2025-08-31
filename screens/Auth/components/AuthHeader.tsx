import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface AuthHeaderProps {
  mode: 'login' | 'signup';
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ mode }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text
        variant="headlineLarge"
        style={[styles.appTitle, { color: theme.colors.primary }]}
        accessible={true}
        accessibilityRole="header"
      >
        {t('onboarding.appTitle')}
      </Text>
      
      <Text
        variant="titleLarge"
        style={[styles.authTitle, { color: theme.colors.onSurface }]}
      >
        {mode === 'login' ? t('auth.login.title') : t('auth.signup.title')}
      </Text>
      
      <Text
        variant="bodyMedium"
        style={[styles.authSubtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        {mode === 'login' ? t('auth.login.subtitle') : t('auth.signup.subtitle')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  authTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  authSubtitle: {
    textAlign: 'center',
  },
});