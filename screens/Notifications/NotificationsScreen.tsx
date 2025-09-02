import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, Text, useTheme, Switch, List, Divider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';

interface NotificationsScreenProps {
  onNavigateBack?: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigateBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(
    null,
  );
  const [enabled, setEnabled] = useState(false);

  const loadPermissions = useCallback(async () => {
    try {
      const settings = await Notifications.getPermissionsAsync();
      setPermissionStatus(settings.status);
      setEnabled(settings.granted === true || settings.status === 'granted');
    } catch (e) {
      console.warn('Failed to get notification permissions', e);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const requestPermission = useCallback(async () => {
    try {
      const settings = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      setPermissionStatus(settings.status);
      setEnabled(settings.granted === true || settings.status === 'granted');
    } catch (e) {
      console.warn('Failed to request notification permissions', e);
    }
  }, []);

  const toggleEnabled = useCallback(async () => {
    // On iOS, enabling/disabling is via system settings; we can only request or guide user.
    if (!enabled) {
      await requestPermission();
    } else {
      // We cannot revoke programmatically; show guidance
      // In a real app, link to Settings. For now, just reflect current state.
    }
    await loadPermissions();
  }, [enabled, loadPermissions, requestPermission]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      <View style={styles.headerRow}>
        <Button icon="arrow-left" onPress={onNavigateBack}>
          {t('common.back', 'Back')}
        </Button>
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.onBackground, fontWeight: 'bold' }}
        >
          {t('profile.notifications', 'Notification Settings')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <Divider style={{ marginVertical: 8 }} />

      <View style={styles.content}>
        <List.Section>
          <List.Item
            title={t('profile.notifications', 'Notification Settings')}
            description={
              permissionStatus === 'granted'
                ? t('notifications.enabled', 'Notifications are enabled')
                : permissionStatus === 'denied'
                  ? t('notifications.denied', 'Notifications are denied in system settings')
                  : t(
                      'notifications.prompt',
                      'Allow notifications to receive timely tips and alerts',
                    )
            }
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => <Switch value={enabled} onValueChange={toggleEnabled} />}
          />

          {Platform.OS === 'android' && (
            <Text style={{ marginHorizontal: 16, color: theme.colors.onSurfaceVariant }}>
              {t(
                'notifications.androidInfo',
                'Android channels can be configured later for granular control.',
              )}
            </Text>
          )}
        </List.Section>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  content: {
    flex: 1,
  },
});
