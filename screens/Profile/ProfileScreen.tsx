import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Avatar, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../Auth';

interface ProfileScreenProps {
  onNavigateBack?: () => void;
  onNavigateToAuth?: () => void;
  onNavigateToNotifications?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateBack,
  onNavigateToAuth,
  onNavigateToNotifications,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { user, isGuest, signOut } = useAuth();

  const handlePrimaryAction = async () => {
    if (isGuest) {
      // Guest: go to Auth without clearing guest state
      onNavigateToAuth?.();
    } else {
      await signOut();
      onNavigateToAuth?.();
    }
  };

  const toggleLanguage = () => {
    const current = i18n.language;
    const nextLang = current?.startsWith('en') ? 'pt-BR' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const getInitials = () => {
    const name = user?.name?.trim();
    if (!name) return '';
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
    return (first + last).toUpperCase();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Button icon="arrow-left" onPress={onNavigateBack}>
            {t('common.back', 'Back')}
          </Button>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.userInfo}>
          {isGuest ? (
            <Avatar.Icon size={80} icon="account" />
          ) : (
            <Avatar.Text size={80} label={getInitials()} />
          )}
          <View style={styles.userDetails}>
            <Text variant="titleLarge" style={{ color: theme.colors.onBackground }}>
              {isGuest ? t('profile.guest', 'Guest User') : user?.name || t('profile.user', 'User')}
            </Text>
            {!isGuest && !!user?.email && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {user.email}
              </Text>
            )}
            {isGuest && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('profile.guestSubtitle', 'Sign in to access all features')}
              </Text>
            )}
          </View>
        </View>

        <Divider style={styles.divider} />

        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        >
          {t('profile.appSettings', 'App Settings')}
        </Text>
        <Button mode="outlined" icon="theme-light-dark" style={styles.button}>
          {t('profile.appearance', 'Appearance')}
        </Button>
        <Button mode="outlined" icon="translate" style={styles.button} onPress={toggleLanguage}>
          {t('profile.language', 'Language')}
        </Button>
        <Button
          mode="outlined"
          icon="bell"
          style={styles.button}
          onPress={onNavigateToNotifications}
        >
          {t('profile.notifications', 'Notification Settings')}
        </Button>

        <Divider style={styles.divider} />

        <Button
          mode="contained"
          icon={isGuest ? 'login' : 'logout'}
          style={[styles.button, styles.primaryAction]}
          onPress={handlePrimaryAction}
        >
          {isGuest ? t('profile.signIn', 'Sign In') : t('profile.signOut', 'Sign Out')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontWeight: 'bold' },
  userInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 8 },
  userDetails: { marginLeft: 16 },
  divider: { marginVertical: 16, marginHorizontal: 16 },
  sectionTitle: { marginHorizontal: 16, marginBottom: 8 },
  button: { marginHorizontal: 16, marginVertical: 6 },
  primaryAction: { marginTop: 8 },
});
