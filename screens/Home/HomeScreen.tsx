import React, { useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Alert 
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { HealthScoreCard } from './components/HealthScoreCard';
import { StatusCard } from './components/StatusCard';
import { QuickActions } from './components/QuickActions';
import { useHomeData } from './hooks/useHomeData';
import { StatusCardData, QuickActionData } from './types';

interface HomeScreenProps {
  onNavigateToBattery?: () => void;
  onNavigateToStorage?: () => void;
  onNavigateToNetwork?: () => void;
  onNavigateToCleanup?: () => void;
  onNavigateToTips?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToBattery = () => Alert.alert('Navigation', 'Battery Monitor - Coming Soon!'),
  onNavigateToStorage = () => Alert.alert('Navigation', 'Storage Analyzer - Coming Soon!'),
  onNavigateToNetwork = () => Alert.alert('Navigation', 'Network & Performance - Coming Soon!'),
  onNavigateToCleanup = () => Alert.alert('Navigation', 'Cleanup Assistant - Coming Soon!'),
  onNavigateToTips = () => Alert.alert('Navigation', 'Tips & Insights - Coming Soon!'),
}) => {
  const theme = useTheme();
  const { data, isLoading, isRefreshing, refresh } = useHomeData();

  // Generate status cards data
  const statusCards: StatusCardData[] = React.useMemo(() => {
    if (!data) return [];

    return [
      {
        title: 'Battery',
        value: `${data.batteryLevel}%`,
        percentage: data.batteryLevel,
        status: data.batteryLevel > 80 ? 'excellent' : data.batteryLevel > 50 ? 'good' : data.batteryLevel > 20 ? 'warning' : 'critical',
        icon: data.batteryIsCharging ? 'battery-charging' : 'battery',
        onPress: onNavigateToBattery,
      },
      {
        title: 'Storage',
        value: `${data.storageUsed} GB`,
        percentage: Math.round((data.storageUsed / data.storageTotal) * 100),
        status: (data.storageUsed / data.storageTotal) < 0.7 ? 'excellent' : (data.storageUsed / data.storageTotal) < 0.85 ? 'good' : (data.storageUsed / data.storageTotal) < 0.95 ? 'warning' : 'critical',
        icon: 'harddisk',
        onPress: onNavigateToStorage,
      },
      {
        title: 'Network',
        value: data.networkType === 'wifi' ? 'Wi-Fi' : data.networkType === 'cellular' ? 'Cellular' : 'No Connection',
        percentage: data.networkStrength === 'excellent' ? 100 : data.networkStrength === 'good' ? 75 : data.networkStrength === 'fair' ? 50 : 25,
        status: data.networkStrength === 'excellent' ? 'excellent' : data.networkStrength === 'good' ? 'good' : data.networkStrength === 'fair' ? 'warning' : 'critical',
        icon: data.networkType === 'wifi' ? 'wifi' : 'signal',
        onPress: onNavigateToNetwork,
      },
    ];
  }, [data, onNavigateToBattery, onNavigateToStorage, onNavigateToNetwork]);

  // Quick actions data
  const quickActions: QuickActionData[] = [
    {
      title: 'Run Cleanup',
      icon: 'broom',
      onPress: onNavigateToCleanup,
    },
    {
      title: 'View Tips',
      icon: 'lightbulb-outline',
      onPress: onNavigateToTips,
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
            Dashboard
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Monitor your iPhone&apos;s performance
          </Text>
        </View>

        {/* Device Health Score */}
        <HealthScoreCard 
          score={data?.score || 0} 
          isLoading={isLoading} 
        />

        {/* Status Cards */}
        <View style={styles.statusSection}>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Status Overview
          </Text>
          <View style={styles.statusCardsContainer}>
            {statusCards.map((cardData, index) => (
              <StatusCard
                key={index}
                {...cardData}
                isLoading={isLoading}
              />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <QuickActions 
          actions={quickActions} 
          isLoading={isLoading} 
        />
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
  statusSection: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});