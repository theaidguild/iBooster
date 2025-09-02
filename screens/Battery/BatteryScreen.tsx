import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  ProgressBar,
  Switch,
  List,
  Divider,
  Appbar,
  Surface,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Battery from 'expo-battery';
import { useTranslation } from 'react-i18next';
import { useBatteryMonitor } from '../../hooks/useBatteryMonitor';
import { BatteryHistoryChart } from './components/BatteryHistoryChart';
import { Colors } from '../../colors';

interface BatteryScreenProps {
  onNavigateBack?: () => void;
}

export const BatteryScreen: React.FC<BatteryScreenProps> = ({ onNavigateBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());

  // Battery tips data with translations
  const BATTERY_TIPS = [
    {
      id: 'brightness',
      title: t('battery.tips.brightness.title'),
      description: t('battery.tips.brightness.description'),
      icon: 'brightness-6',
    },
    {
      id: 'background-app-refresh',
      title: t('battery.tips.backgroundRefresh.title'),
      description: t('battery.tips.backgroundRefresh.description'),
      icon: 'refresh',
    },
    {
      id: 'location-services',
      title: t('battery.tips.location.title'),
      description: t('battery.tips.location.description'),
      icon: 'map-marker',
    },
    {
      id: 'push-notifications',
      title: t('battery.tips.notifications.title'),
      description: t('battery.tips.notifications.description'),
      icon: 'bell',
    },
    {
      id: 'low-power-mode',
      title: t('battery.tips.lowPowerMode.title'),
      description: t('battery.tips.lowPowerMode.description'),
      icon: 'battery',
    },
  ];

  const {
    batteryState,
    batteryHistory,
    isLoading,
    lowBatteryNotificationsEnabled,
    notificationThreshold,
    refresh,
    setLowBatteryNotificationsEnabled,
  } = useBatteryMonitor();

  // Handle tip expansion
  const toggleTipExpansion = (tipId: string) => {
    const newExpanded = new Set(expandedTips);
    if (newExpanded.has(tipId)) {
      newExpanded.delete(tipId);
    } else {
      newExpanded.add(tipId);
    }
    setExpandedTips(newExpanded);
  };

  // Handle notification toggle
  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      await setLowBatteryNotificationsEnabled(enabled);
    } catch {
      Alert.alert(
        'Permission Required',
        'To receive low battery notifications, please allow notifications in your device settings.',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'OK' }],
      );
    }
  };

  // Get battery state display info
  const getBatteryStateInfo = () => {
    if (!batteryState)
      return { label: 'Unknown', color: theme.colors.onSurfaceVariant, icon: 'help-circle' };

    const { batteryState: state, isCharging, batteryLevelPercent } = batteryState;

    if (isCharging) {
      return {
        label: t('battery.status.charging'),
        color: Colors.status.excellent,
        icon: 'battery-charging',
      };
    }

    switch (state) {
      case Battery.BatteryState.FULL:
        return { label: t('battery.status.full'), color: Colors.status.excellent, icon: 'battery' };
      case Battery.BatteryState.UNPLUGGED:
        if (batteryLevelPercent <= 20) {
          return {
            label: t('battery.status.lowBattery'),
            color: Colors.status.critical,
            icon: 'battery-low',
          };
        } else if (batteryLevelPercent <= 50) {
          return {
            label: t('battery.status.onBattery'),
            color: Colors.status.warning,
            icon: 'battery-medium',
          };
        } else {
          return {
            label: t('battery.status.onBattery'),
            color: Colors.status.excellent,
            icon: 'battery-high',
          };
        }
      default:
        return { label: 'Unknown', color: theme.colors.onSurfaceVariant, icon: 'battery-unknown' };
    }
  };

  const batteryStateInfo = getBatteryStateInfo();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        {onNavigateBack && <Appbar.BackAction onPress={onNavigateBack} />}
        <Appbar.Content title={t('battery.title')} />
        <Appbar.Action icon="refresh" onPress={refresh} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
      >
        {/* Battery Status Card */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.statusContent}>
            <View style={styles.batteryLevelContainer}>
              <Text variant="displayLarge" style={styles.batteryLevel}>
                {batteryState?.batteryLevelPercent ?? 0}%
              </Text>
              <View style={styles.batteryStatus}>
                <Text
                  variant="titleMedium"
                  style={[styles.batteryStatusText, { color: batteryStateInfo.color }]}
                >
                  {batteryStateInfo.label}
                </Text>
                <IconButton
                  icon={batteryStateInfo.icon}
                  iconColor={batteryStateInfo.color}
                  size={24}
                />
              </View>
            </View>

            {/* Battery Level Progress Bar */}
            <ProgressBar
              progress={batteryState?.batteryLevel ?? 0}
              style={styles.progressBar}
              color={batteryStateInfo.color}
            />
          </Card.Content>
        </Card>

        {/* Battery History Chart */}
        <BatteryHistoryChart history={batteryHistory} isLoading={isLoading} />

        {/* Battery Health Summary */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              {t('battery.healthSummary')}
            </Text>

            <View style={styles.healthRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('battery.currentLevel')}:
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {batteryState?.batteryLevelPercent ?? 0}%
              </Text>
            </View>

            <View style={styles.healthRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('battery.chargingStatus')}:
              </Text>
              <Text variant="bodyMedium" style={{ color: batteryStateInfo.color }}>
                {batteryStateInfo.label}
              </Text>
            </View>

            {batteryState?.lowPowerMode !== null && (
              <View style={styles.healthRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('battery.lowPowerMode')}:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {batteryState?.lowPowerMode ? t('battery.enabled') : t('battery.disabled')}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Notification Settings */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              {t('battery.notificationSettings')}
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {t('battery.lowBatteryNotifications')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('battery.notificationThreshold', { threshold: notificationThreshold })}
                </Text>
              </View>
              <Switch
                value={lowBatteryNotificationsEnabled}
                onValueChange={handleNotificationToggle}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Battery Tips */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
              {t('battery.tips.title')}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}
            >
              {t('battery.tips.description')}
            </Text>
          </Card.Content>

          {BATTERY_TIPS.map((tip, index) => {
            const items: React.ReactNode[] = [];

            items.push(
              <List.Item
                key={`${tip.id}-item`}
                title={tip.title}
                left={(props) => <List.Icon {...props} icon={tip.icon} />}
                right={(props) => (
                  <List.Icon
                    {...props}
                    icon={expandedTips.has(tip.id) ? 'chevron-up' : 'chevron-down'}
                  />
                )}
                onPress={() => toggleTipExpansion(tip.id)}
              />,
            );

            if (expandedTips.has(tip.id)) {
              items.push(
                <Surface
                  key={`${tip.id}-desc`}
                  style={[styles.tipDescription, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {tip.description}
                  </Text>
                </Surface>,
              );
            }

            if (index < BATTERY_TIPS.length - 1) {
              items.push(<Divider key={`${tip.id}-divider`} />);
            }

            return items;
          })}
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  card: {
    margin: 16,
    marginBottom: 0,
    elevation: 2,
    borderRadius: 12,
  },
  statusContent: {
    paddingVertical: 24,
  },
  batteryLevelContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  batteryLevel: {
    fontWeight: 'bold',
    fontSize: 64,
    lineHeight: 72,
  },
  batteryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  batteryStatusText: {
    fontWeight: '600',
    marginRight: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  tipDescription: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  bottomSpacing: {
    height: 32,
  },
});
