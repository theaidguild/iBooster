import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { HealthScoreOrb, QuickActions, StatusCard } from './components';
import { useHomeData } from './hooks/useHomeData';
import { QuickActionData, StatusCardData } from './types';

interface HomeScreenProps {
  onNavigateToBattery?: () => void;
  onNavigateToStorage?: () => void;
  onNavigateToNetwork?: () => void;
  onNavigateToCleanup?: () => void;
  onNavigateToTips?: () => void;
  onNavigateToOnboarding?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToBattery,
  onNavigateToStorage,
  onNavigateToNetwork,
  onNavigateToCleanup,
  onNavigateToTips,
  onNavigateToOnboarding,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data, isLoading, isRefreshing, refresh } = useHomeData();

  // Default navigation handlers with translated messages
  const defaultNavigateToBattery = useCallback(
    () => Alert.alert('Navigation', t('navigation.battery')),
    [t],
  );
  const defaultNavigateToStorage = useCallback(
    () => Alert.alert('Navigation', t('navigation.storage')),
    [t],
  );
  const defaultNavigateToNetwork = useCallback(
    () => Alert.alert('Navigation', t('navigation.network')),
    [t],
  );
  const defaultNavigateToCleanup = useCallback(
    () => Alert.alert('Navigation', t('navigation.cleanup')),
    [t],
  );
  const defaultNavigateToTips = useCallback(
    () => Alert.alert('Navigation', t('navigation.tips')),
    [t],
  );
  const defaultNavigateToOnboarding = useCallback(
    () => Alert.alert('Navigation', t('navigation.onboarding')),
    [t],
  );

  // Generate status cards data
  const statusCards: StatusCardData[] = React.useMemo(() => {
    if (!data) return [];

    return [
      {
        title: t('home.battery.title'),
        value: `${data.batteryLevel}%`,
        percentage: data.batteryLevel,
        status:
          data.batteryLevel > 80
            ? 'excellent'
            : data.batteryLevel > 50
              ? 'good'
              : data.batteryLevel > 20
                ? 'warning'
                : 'critical',
        icon: data.batteryIsCharging ? 'battery-charging' : 'battery',
        onPress: onNavigateToBattery || defaultNavigateToBattery,
      },
      {
        title: t('home.storage.title'),
        value: `${data.storageUsed} GB`,
        percentage: Math.round((data.storageUsed / data.storageTotal) * 100),
        status:
          data.storageUsed / data.storageTotal < 0.7
            ? 'excellent'
            : data.storageUsed / data.storageTotal < 0.85
              ? 'good'
              : data.storageUsed / data.storageTotal < 0.95
                ? 'warning'
                : 'critical',
        icon: 'harddisk',
        onPress: onNavigateToStorage || defaultNavigateToStorage,
      },
      {
        title: t('home.network.title'),
        value:
          data.networkType === 'wifi'
            ? 'Wi-Fi'
            : data.networkType === 'cellular'
              ? 'Cellular'
              : 'No Connection',
        percentage:
          data.networkStrength === 'excellent'
            ? 100
            : data.networkStrength === 'good'
              ? 75
              : data.networkStrength === 'fair'
                ? 50
                : 25,
        status:
          data.networkStrength === 'excellent'
            ? 'excellent'
            : data.networkStrength === 'good'
              ? 'good'
              : data.networkStrength === 'fair'
                ? 'warning'
                : 'critical',
        icon: data.networkType === 'wifi' ? 'wifi' : 'signal',
        onPress: onNavigateToNetwork || defaultNavigateToNetwork,
      },
    ];
  }, [
    data,
    onNavigateToBattery,
    onNavigateToStorage,
    onNavigateToNetwork,
    defaultNavigateToBattery,
    defaultNavigateToStorage,
    defaultNavigateToNetwork,
    t,
  ]);

  // Quick actions data
  const quickActions: QuickActionData[] = [
    {
      title: t('home.quickActions.cleanup.title'),
      icon: 'broom',
      onPress: onNavigateToCleanup || defaultNavigateToCleanup,
    },
    {
      title: t('home.quickActions.tips.title'),
      icon: 'lightbulb-outline',
      onPress: onNavigateToTips || defaultNavigateToTips,
    },
    {
      title: t('home.quickActions.tutorial.title'),
      icon: 'school-outline',
      onPress: onNavigateToOnboarding || defaultNavigateToOnboarding,
    },
  ];

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* App Title */}
        <View style={styles.header}>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            {t('home.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('home.subtitle')}
          </Text>
        </View>

        {/* Device Health Score */}
        <View style={styles.orbContainer}>
          <HealthScoreOrb healthScore={data?.score || 0} />
        </View>

        {/* Status Cards */}
        <View style={styles.statusSection}>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            {t('home.statusOverview')}
          </Text>
          <View style={styles.statusCardsContainer}>
            {statusCards.map((cardData, index) => (
              <StatusCard key={index} {...cardData} isLoading={isLoading} />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <QuickActions actions={quickActions} isLoading={isLoading} />
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
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  statusSection: {
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 8,
  },
});
