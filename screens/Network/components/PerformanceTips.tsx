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
import { useTranslation } from 'react-i18next';
import { Colors } from '../../../colors';

interface PerformanceTipsProps {
  isOffline?: boolean;
}

export const PerformanceTips: React.FC<PerformanceTipsProps> = ({
  isOffline = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Performance tips data using translations
  const PERFORMANCE_TIPS = [
    {
      id: 'wifi-optimization',
      title: t('network.tips.wifiOptimization.title'),
      description: t('network.tips.wifiOptimization.description'),
      icon: 'wifi',
      category: 'connectivity',
    },
    {
      id: 'background-app-refresh',
      title: t('network.tips.backgroundAppRefresh.title'),
      description: t('network.tips.backgroundAppRefresh.description'),
      icon: 'refresh',
      category: 'data-usage',
    },
    {
      id: 'streaming-quality',
      title: t('network.tips.streamingQuality.title'),
      description: t('network.tips.streamingQuality.description'),
      icon: 'play-circle',
      category: 'data-usage',
    },
    {
      id: 'app-updates',
      title: t('network.tips.appUpdates.title'),
      description: t('network.tips.appUpdates.description'),
      icon: 'download',
      category: 'data-usage',
    },
    {
      id: 'location-services',
      title: t('network.tips.locationServices.title'),
      description: t('network.tips.locationServices.description'),
      icon: 'map-marker',
      category: 'privacy',
    },
    {
      id: 'cellular-data',
      title: t('network.tips.cellularData.title'),
      description: t('network.tips.cellularData.description'),
      icon: 'signal',
      category: 'data-usage',
    },
    {
      id: 'airplane-mode',
      title: t('network.tips.airplaneMode.title'),
      description: t('network.tips.airplaneMode.description'),
      icon: 'airplane',
      category: 'battery',
    },
    {
      id: 'network-reset',
      title: t('network.tips.networkReset.title'),
      description: t('network.tips.networkReset.description'),
      icon: 'cog',
      category: 'troubleshooting',
    },
  ];

  // Filter tips based on connection status
  const relevantTips = isOffline
    ? PERFORMANCE_TIPS.filter(tip => 
        tip.category === 'connectivity' || tip.category === 'troubleshooting'
      )
    : PERFORMANCE_TIPS;

  // Helper function to get category color using rocket color scheme
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'connectivity':
        return Colors.status.excellent; // Bright green
      case 'data-usage':
        return Colors.primary[800]; // Blue from gradient
      case 'battery':
        return Colors.status.warning; // Amber
      case 'privacy':
        return Colors.accent[600]; // Purple accent
      case 'troubleshooting':
        return Colors.status.critical; // Red
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
              {t('network.tips.title')}
            </Text>
          </View>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text
                variant="labelSmall"
                style={[styles.offlineText, { color: '#FF3B30' }]}
              >
                {t('network.offline.mode')}
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
              {t('network.offline.message')}
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
            {t('network.tips.categories')}
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