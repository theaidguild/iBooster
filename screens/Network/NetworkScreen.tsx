import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  useTheme,
  Appbar,
  Banner,
  Icon,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useNetworkPerformance } from '../../hooks/useNetworkPerformance';
import { NetworkStatusCard } from './components/NetworkStatusCard';
import { LatencyTestCard } from './components/LatencyTestCard';
import { PerformanceTips } from './components/PerformanceTips';

interface NetworkScreenProps {
  onGoBack?: () => void;
}

export const NetworkScreen: React.FC<NetworkScreenProps> = ({
  onGoBack,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    networkState,
    latencyResult,
    isLoadingNetwork,
    isLoadingLatency,
    refresh,
    runLatencyTest,
  } = useNetworkPerformance();

  // Check if device is offline
  const isOffline = !networkState?.isConnected || networkState?.isInternetReachable === false;

  // Handle refresh
  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Check if we're currently refreshing
  const isRefreshing = isLoadingNetwork;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      {/* App Bar */}
      <Appbar.Header
        style={[styles.appBar, { backgroundColor: theme.colors.surface }]}
        elevated={true}
      >
        {onGoBack && (
          <Appbar.BackAction
            onPress={onGoBack}
            iconColor={theme.colors.onSurface}
          />
        )}
        <Appbar.Content
          title={t('network.title')}
          titleStyle={[styles.appBarTitle, { color: theme.colors.onSurface }]}
        />
        <Appbar.Action
          icon="refresh"
          onPress={onRefresh}
          iconColor={theme.colors.onSurface}
          disabled={isRefreshing}
        />
      </Appbar.Header>

      {/* Offline Banner */}
      {isOffline && networkState && (
        <Banner
          visible={true}
          icon={({ size }) => (
            <Icon source="wifi-off" size={size} color="#FF3B30" />
          )}
          style={[styles.offlineBanner, { backgroundColor: '#FF3B301A' }]}
        >
          <Text style={[styles.bannerText, { color: '#FF3B30' }]}>
            {!networkState.isConnected
              ? t('network.offline.noConnection')
              : t('network.offline.noInternet')}
          </Text>
        </Banner>
      )}

      {/* Main Content */}
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
        {/* Screen Header */}
        <View style={styles.header}>
          <Text
            variant="headlineSmall"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            {t('network.status.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('network.subtitle')}
          </Text>
        </View>

        {/* Network Status Card */}
        <NetworkStatusCard
          networkState={networkState}
          isLoading={isLoadingNetwork}
          onRefresh={onRefresh}
        />

        {/* Latency Test Card */}
        <LatencyTestCard
          latencyResult={latencyResult}
          isLoading={isLoadingLatency}
          onRunTest={runLatencyTest}
          isNetworkConnected={!!(networkState?.isConnected && networkState?.isInternetReachable === true)}
        />

        {/* Performance Tips */}
        <PerformanceTips isOffline={isOffline} />

        {/* Additional spacing at bottom */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    elevation: 4,
  },
  appBarTitle: {
    fontWeight: '600',
  },
  offlineBanner: {
    margin: 0,
    elevation: 2,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 8,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 16,
  },
});