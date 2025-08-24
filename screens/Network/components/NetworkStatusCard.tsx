import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Text,
  useTheme,
  ActivityIndicator,
  Icon,
  Surface,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as Network from 'expo-network';
import { NetworkState } from '../../../hooks/useNetworkPerformance';
import { Colors } from '../../../colors';

interface NetworkStatusCardProps {
  networkState: NetworkState | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export const NetworkStatusCard: React.FC<NetworkStatusCardProps> = ({
  networkState,
  isLoading,
  onRefresh,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Helper function to get status color based on network state using rocket color scheme
  const getStatusColor = (): string => {
    if (!networkState || !networkState.isConnected) {
      return Colors.status.critical; // Red for no connection
    }
    
    if (networkState.isInternetReachable === false) {
      return Colors.status.warning; // Amber for connected but no internet
    }
    
    if (networkState.isInternetReachable === true) {
      return Colors.status.excellent; // Bright green for full connectivity
    }
    
    return Colors.primary[800]; // Blue for unknown internet status
  };

  // Helper function to get status text
  const getStatusText = (): string => {
    if (!networkState) return t('network.status.unknown');
    
    if (!networkState.isConnected) {
      return t('network.status.noConnection');
    }
    
    if (networkState.isInternetReachable === false) {
      return t('network.status.connectedNoInternet');
    }
    
    if (networkState.isInternetReachable === true) {
      return t('network.status.connected');
    }
    
    return t('network.status.connectedUnknownInternet');
  };

  // Helper function to get network icon
  const getNetworkIcon = (): string => {
    if (!networkState || !networkState.isConnected) {
      return 'wifi-off';
    }
    
    switch (networkState.type) {
      case Network.NetworkStateType.WIFI:
        return 'wifi';
      case Network.NetworkStateType.CELLULAR:
        return 'signal';
      case Network.NetworkStateType.ETHERNET:
        return 'ethernet';
      case Network.NetworkStateType.BLUETOOTH:
        return 'bluetooth';
      default:
        return 'network';
    }
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();
  const networkIcon = getNetworkIcon();

  if (isLoading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating size="small" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              {t('network.status.checking')}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon source="network" size={20} color={theme.colors.onSurface} />
            <Text
              variant="titleMedium"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              {t('network.status.title')}
            </Text>
          </View>
          {onRefresh && (
            <Icon
              source="refresh"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          )}
        </View>

        <View style={styles.statusContainer}>
          <Surface
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}1A` },
            ]}
            elevation={0}
          >
            <Icon source={networkIcon} size={24} color={statusColor} />
          </Surface>
          
          <View style={styles.statusInfo}>
            <Text
              variant="headlineSmall"
              style={[styles.connectionType, { color: statusColor }]}
              numberOfLines={1}
            >
              {networkState?.typeName || 'Unknown'}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {statusText}
            </Text>
          </View>
        </View>

        {/* Connection Details */}
        {networkState && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text
                variant="labelMedium"
                style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                {t('network.status.deviceConnected')}
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.detailValue, { color: networkState.isConnected ? Colors.status.excellent : Colors.status.critical }]}
              >
                {networkState.isConnected ? t('network.status.yes') : t('network.status.no')}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text
                variant="labelMedium"
                style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                {t('network.status.internetAccess')}
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.detailValue,
                  {
                    color:
                      networkState.isInternetReachable === true
                        ? Colors.status.excellent
                        : networkState.isInternetReachable === false
                          ? Colors.status.critical
                          : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {networkState.isInternetReachable === null
                  ? t('network.status.unknown')
                  : networkState.isInternetReachable
                    ? t('network.status.available')
                    : t('network.status.notAvailable')}
              </Text>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  connectionType: {
    fontWeight: '600',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});