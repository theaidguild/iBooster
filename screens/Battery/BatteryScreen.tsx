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
import { useBatteryMonitor } from '../../hooks/useBatteryMonitor';
import { BatteryHistoryChart } from './components/BatteryHistoryChart';

// Battery tips data
const BATTERY_TIPS = [
  {
    id: 'brightness',
    title: 'Adjust Screen Brightness',
    description:
      'Lower screen brightness or enable auto-brightness to save battery life. The display is typically the biggest battery consumer.',
    icon: 'brightness-6',
  },
  {
    id: 'background-app-refresh',
    title: 'Manage Background App Refresh',
    description:
      "Turn off background app refresh for apps you don't need to update constantly. This prevents apps from using battery when not in use.",
    icon: 'refresh',
  },
  {
    id: 'location-services',
    title: 'Review Location Services',
    description:
      'Limit location access to apps that actually need it. GPS usage can significantly impact battery life.',
    icon: 'map-marker',
  },
  {
    id: 'push-notifications',
    title: 'Optimize Push Notifications',
    description:
      'Disable unnecessary push notifications. Each notification wakes your device and uses battery.',
    icon: 'bell',
  },
  {
    id: 'low-power-mode',
    title: 'Use Low Power Mode',
    description:
      'Enable low power mode when your battery is running low. It reduces performance but extends battery life.',
    icon: 'battery',
  },
  {
    id: 'wifi-bluetooth',
    title: 'Manage Connectivity',
    description:
      'Turn off Wi-Fi, Bluetooth, and cellular data when not needed. Use airplane mode in low signal areas.',
    icon: 'wifi',
  },
  {
    id: 'app-usage',
    title: 'Monitor App Usage',
    description:
      'Check which apps use the most battery in your device settings and consider alternatives or reduced usage.',
    icon: 'cellphone',
  },
  {
    id: 'charging-habits',
    title: 'Optimize Charging Habits',
    description:
      'Avoid letting your battery drain completely. Charge between 20-80% for optimal battery health.',
    icon: 'battery-charging',
  },
];

interface BatteryScreenProps {
  onNavigateBack?: () => void;
}

export const BatteryScreen: React.FC<BatteryScreenProps> = ({ onNavigateBack }) => {
  const theme = useTheme();
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());

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
        label: 'Charging',
        color: '#34C759',
        icon: 'battery-charging',
      };
    }

    switch (state) {
      case Battery.BatteryState.FULL:
        return { label: 'Full', color: '#34C759', icon: 'battery' };
      case Battery.BatteryState.UNPLUGGED:
        if (batteryLevelPercent <= 20) {
          return { label: 'Low Battery', color: '#FF3B30', icon: 'battery-low' };
        } else if (batteryLevelPercent <= 50) {
          return { label: 'On Battery', color: '#FFCC00', icon: 'battery-medium' };
        } else {
          return { label: 'On Battery', color: '#34C759', icon: 'battery-high' };
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
        <Appbar.Content title="Battery Monitor" />
        <Appbar.Action icon="refresh" onPress={refresh} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
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
              Battery Health Summary
            </Text>

            <View style={styles.healthRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Current Level:
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {batteryState?.batteryLevelPercent ?? 0}%
              </Text>
            </View>

            <View style={styles.healthRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Charging Status:
              </Text>
              <Text variant="bodyMedium" style={{ color: batteryStateInfo.color }}>
                {batteryStateInfo.label}
              </Text>
            </View>

            {batteryState?.lowPowerMode !== null && (
              <View style={styles.healthRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Low Power Mode:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {batteryState?.lowPowerMode ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Notification Settings */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Notification Settings
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  Low Battery Notifications
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Get notified when battery drops to {notificationThreshold}%
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
              Battery Tips
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}
            >
              Tap any tip to learn more about improving your battery life.
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
