import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Card,
  Text,
  useTheme,
  List,
  Icon,
  Divider,
} from 'react-native-paper';

// Performance tips data
const PERFORMANCE_TIPS = [
  {
    id: 'wifi-optimization',
    title: 'Use Wi-Fi When Available',
    description:
      'Wi-Fi typically provides faster speeds and uses less battery than cellular data. Enable auto-connect for trusted networks.',
    icon: 'wifi',
    category: 'connectivity',
  },
  {
    id: 'background-app-refresh',
    title: 'Manage Background App Refresh',
    description:
      'Disable background refresh for apps that don\'t need real-time updates. This saves both data and battery.',
    icon: 'refresh',
    category: 'data-usage',
  },
  {
    id: 'streaming-quality',
    title: 'Adjust Streaming Quality',
    description:
      'Lower video streaming quality on mobile data to reduce data usage and improve performance on slower connections.',
    icon: 'play-circle',
    category: 'data-usage',
  },
  {
    id: 'app-updates',
    title: 'Update Apps Over Wi-Fi',
    description:
      'Set app updates to download only over Wi-Fi to preserve cellular data and avoid network congestion.',
    icon: 'download',
    category: 'data-usage',
  },
  {
    id: 'location-services',
    title: 'Optimize Location Services',
    description:
      'Use "While Using App" location setting for most apps instead of "Always" to reduce background data usage.',
    icon: 'map-marker',
    category: 'privacy',
  },
  {
    id: 'cellular-data',
    title: 'Monitor Cellular Data Usage',
    description:
      'Check which apps use the most data in Settings > Cellular, and disable cellular access for data-heavy apps.',
    icon: 'signal',
    category: 'data-usage',
  },
  {
    id: 'airplane-mode',
    title: 'Use Airplane Mode in Poor Signal Areas',
    description:
      'In areas with very weak signal, enable airplane mode to prevent battery drain from constantly searching for signal.',
    icon: 'airplane',
    category: 'battery',
  },
  {
    id: 'network-reset',
    title: 'Reset Network Settings If Issues Persist',
    description:
      'If experiencing persistent connectivity issues, try resetting network settings in Settings > General > Reset.',
    icon: 'cog',
    category: 'troubleshooting',
  },
];

interface PerformanceTipsProps {
  isOffline?: boolean;
}

export const PerformanceTips: React.FC<PerformanceTipsProps> = ({
  isOffline = false,
}) => {
  const theme = useTheme();

  // Filter tips based on connection status
  const relevantTips = isOffline
    ? PERFORMANCE_TIPS.filter(tip => 
        tip.category === 'connectivity' || tip.category === 'troubleshooting'
      )
    : PERFORMANCE_TIPS;

  // Helper function to get category color
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'connectivity':
        return '#34C759'; // Green
      case 'data-usage':
        return '#007AFF'; // Blue
      case 'battery':
        return '#FFCC00'; // Yellow
      case 'privacy':
        return '#5856D6'; // Purple
      case 'troubleshooting':
        return '#FF3B30'; // Red
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon source="lightbulb-outline" size={20} color={theme.colors.onSurface} />
            <Text
              variant="titleMedium"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              Performance Tips
            </Text>
          </View>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text
                variant="labelSmall"
                style={[styles.offlineText, { color: '#FF3B30' }]}
              >
                Offline Mode
              </Text>
            </View>
          )}
        </View>

        {isOffline && (
          <View style={[styles.offlineMessage, { backgroundColor: '#FF3B301A' }]}>
            <Icon source="wifi-off" size={16} color="#FF3B30" />
            <Text
              variant="bodySmall"
              style={[styles.offlineMessageText, { color: '#FF3B30' }]}
            >
              No internet connection. Showing connectivity and troubleshooting tips.
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.tipsContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {relevantTips.map((tip, index) => (
            <View key={tip.id}>
              <List.Item
                title={tip.title}
                description={tip.description}
                left={() => (
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${getCategoryColor(tip.category)}1A` },
                    ]}
                  >
                    <Icon
                      source={tip.icon}
                      size={20}
                      color={getCategoryColor(tip.category)}
                    />
                  </View>
                )}
                titleStyle={[
                  styles.tipTitle,
                  { color: theme.colors.onSurface },
                ]}
                descriptionStyle={[
                  styles.tipDescription,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                style={styles.listItem}
                titleNumberOfLines={2}
                descriptionNumberOfLines={3}
              />
              {index < relevantTips.length - 1 && (
                <Divider style={[styles.divider, { marginLeft: 56 }]} />
              )}
            </View>
          ))}
        </ScrollView>

        {/* Category Legend */}
        <View style={styles.legendContainer}>
          <Text
            variant="labelMedium"
            style={[styles.legendTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Categories:
          </Text>
          <View style={styles.legendItems}>
            {['connectivity', 'data-usage', 'battery', 'privacy', 'troubleshooting'].map((category) => {
              const categoryTips = relevantTips.filter(tip => tip.category === category);
              if (categoryTips.length === 0) return null;
              
              return (
                <View key={category} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: getCategoryColor(category) },
                    ]}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {category.replace('-', ' ')}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontWeight: '600',
  },
  offlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#FF3B301A',
  },
  offlineText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  offlineMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineMessageText: {
    marginLeft: 8,
    fontSize: 12,
    flex: 1,
  },
  tipsContainer: {
    maxHeight: 300, // Limit height to prevent excessive scrolling
  },
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  tipDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  divider: {
    marginVertical: 4,
  },
  legendContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 12,
    marginTop: 8,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
});