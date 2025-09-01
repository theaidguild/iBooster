import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text, Divider, useTheme } from 'react-native-paper';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from 'react-i18next';

interface SocialAuthButtonsProps {
  onAppleSignIn: () => Promise<void>;
  onGuestAccess: () => Promise<void>;
  isLoading: boolean;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onAppleSignIn,
  onGuestAccess,
  isLoading,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  useEffect(() => {
    checkAppleSignInAvailability();
  }, []);

  const checkAppleSignInAvailability = async () => {
    if (Platform.OS === 'ios') {
      try {
        const available = await AppleAuthentication.isAvailableAsync();
        setIsAppleSignInAvailable(available);
      } catch (error) {
        console.error('Failed to check Apple Sign In availability:', error);
        setIsAppleSignInAvailable(false);
      }
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await onAppleSignIn();
    } catch {
      // Error is handled by the parent component
    }
  };

  const handleGuestAccess = async () => {
    try {
      await onGuestAccess();
    } catch {
      // Error is handled by the parent component
    }
  };

  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerContainer}>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
        <Text
          variant="bodySmall"
          style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('auth.divider.or')}
        </Text>
        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
      </View>

      {/* Apple Sign In Button - iOS only */}
      {isAppleSignInAvailable && Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            theme.dark
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={12}
          style={styles.appleButton}
          onPress={handleAppleSignIn}
          accessible={true}
          accessibilityLabel={t('auth.social.apple')}
        />
      )}

      {/* Guest Access Button */}
      <Button
        mode="outlined"
        onPress={handleGuestAccess}
        disabled={isLoading}
        style={styles.guestButton}
        contentStyle={styles.guestButtonContent}
        labelStyle={[styles.guestButtonLabel, { color: theme.colors.onSurfaceVariant }]}
        accessible={true}
        accessibilityLabel={t('auth.guest.button')}
        accessibilityHint={t('auth.guest.hint')}
      >
        {t('auth.guest.button')}
      </Button>

      {/* Guest Access Description */}
      <Text
        variant="bodySmall"
        style={[styles.guestDescription, { color: theme.colors.onSurfaceVariant }]}
      >
        {t('auth.guest.description')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  appleButton: {
    height: 48,
    borderRadius: 12,
  },
  guestButton: {
    borderRadius: 12,
    borderWidth: 1,
  },
  guestButtonContent: {
    paddingVertical: 8,
  },
  guestButtonLabel: {
    fontWeight: '500',
  },
  guestDescription: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: -8,
  },
});
