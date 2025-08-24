import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tip, DidYouKnowInsight, CategoryInfo, TipCategory } from '../types';

export const useTips = () => {
  const { t } = useTranslation();

  const categories: CategoryInfo[] = useMemo(() => [
    {
      key: 'battery',
      name: t('tips.categories.battery'),
      color: '#34C759', // Green
      icon: 'battery',
    },
    {
      key: 'storage',
      name: t('tips.categories.storage'),
      color: '#FF9500', // Orange
      icon: 'harddisk',
    },
    {
      key: 'network',
      name: t('tips.categories.network'),
      color: '#007AFF', // Blue
      icon: 'wifi',
    },
    {
      key: 'performance',
      name: t('tips.categories.performance'),
      color: '#5856D6', // Purple
      icon: 'speedometer',
    },
    {
      key: 'privacy',
      name: t('tips.categories.privacy'),
      color: '#FF3B30', // Red
      icon: 'shield-check',
    },
    {
      key: 'general',
      name: t('tips.categories.general'),
      color: '#8E8E93', // Gray
      icon: 'cog',
    },
  ], [t]);

  const tips: Tip[] = useMemo(() => [
    // Battery Tips
    {
      id: 'battery-brightness',
      title: t('tips.content.batteryBrightness.title'),
      description: t('tips.content.batteryBrightness.description'),
      icon: 'brightness-6',
      category: 'battery',
      externalUrl: 'https://support.apple.com/en-us/HT208387',
    },
    {
      id: 'battery-low-power-mode',
      title: t('tips.content.batteryLowPowerMode.title'),
      description: t('tips.content.batteryLowPowerMode.description'),
      icon: 'battery',
      category: 'battery',
      externalUrl: 'https://support.apple.com/en-us/HT205234',
    },
    {
      id: 'battery-background-refresh',
      title: t('tips.content.batteryBackgroundRefresh.title'),
      description: t('tips.content.batteryBackgroundRefresh.description'),
      icon: 'refresh',
      category: 'battery',
      externalUrl: 'https://support.apple.com/en-us/HT207056',
    },
    // Storage Tips
    {
      id: 'storage-photos-cleanup',
      title: t('tips.content.storagePhotosCleanup.title'),
      description: t('tips.content.storagePhotosCleanup.description'),
      icon: 'image-multiple',
      category: 'storage',
      externalUrl: 'https://support.apple.com/en-us/HT204264',
    },
    {
      id: 'storage-app-offload',
      title: t('tips.content.storageAppOffload.title'),
      description: t('tips.content.storageAppOffload.description'),
      icon: 'download-off',
      category: 'storage',
      externalUrl: 'https://support.apple.com/en-us/HT201656',
    },
    // Network Tips
    {
      id: 'network-wifi-optimization',
      title: t('tips.content.networkWifiOptimization.title'),
      description: t('tips.content.networkWifiOptimization.description'),
      icon: 'wifi',
      category: 'network',
      externalUrl: 'https://support.apple.com/en-us/HT202628',
    },
    {
      id: 'network-cellular-data',
      title: t('tips.content.networkCellularData.title'),
      description: t('tips.content.networkCellularData.description'),
      icon: 'signal',
      category: 'network',
      externalUrl: 'https://support.apple.com/en-us/HT201299',
    },
    // Performance Tips
    {
      id: 'performance-restart',
      title: t('tips.content.performanceRestart.title'),
      description: t('tips.content.performanceRestart.description'),
      icon: 'restart',
      category: 'performance',
      externalUrl: 'https://support.apple.com/en-us/HT201559',
    },
    {
      id: 'performance-updates',
      title: t('tips.content.performanceUpdates.title'),
      description: t('tips.content.performanceUpdates.description'),
      icon: 'update',
      category: 'performance',
      externalUrl: 'https://support.apple.com/en-us/HT204204',
    },
    // Privacy Tips
    {
      id: 'privacy-location-services',
      title: t('tips.content.privacyLocationServices.title'),
      description: t('tips.content.privacyLocationServices.description'),
      icon: 'map-marker',
      category: 'privacy',
      externalUrl: 'https://support.apple.com/en-us/HT207056',
    },
    {
      id: 'privacy-app-permissions',
      title: t('tips.content.privacyAppPermissions.title'),
      description: t('tips.content.privacyAppPermissions.description'),
      icon: 'shield-check',
      category: 'privacy',
      externalUrl: 'https://support.apple.com/en-us/HT203033',
    },
    // General Tips
    {
      id: 'general-accessibility',
      title: t('tips.content.generalAccessibility.title'),
      description: t('tips.content.generalAccessibility.description'),
      icon: 'human-handsup',
      category: 'general',
      externalUrl: 'https://support.apple.com/accessibility/iphone/',
    },
  ], [t]);

  const insights: DidYouKnowInsight[] = useMemo(() => [
    {
      id: 'insight-battery-cycles',
      title: t('tips.insights.batteryCycles.title'),
      content: t('tips.insights.batteryCycles.content'),
      icon: 'battery-heart',
      category: 'battery',
    },
    {
      id: 'insight-storage-optimization',
      title: t('tips.insights.storageOptimization.title'),
      content: t('tips.insights.storageOptimization.content'),
      icon: 'harddisk',
      category: 'storage',
    },
    {
      id: 'insight-network-efficiency',
      title: t('tips.insights.networkEfficiency.title'),
      content: t('tips.insights.networkEfficiency.content'),
      icon: 'network',
      category: 'network',
    },
    {
      id: 'insight-performance-boost',
      title: t('tips.insights.performanceBoost.title'),
      content: t('tips.insights.performanceBoost.content'),
      icon: 'rocket',
      category: 'performance',
    },
  ], [t]);

  const getCategoryInfo = (category: TipCategory): CategoryInfo => {
    return categories.find(cat => cat.key === category) || categories[categories.length - 1];
  };

  const getTipsByCategory = (category: TipCategory): Tip[] => {
    return tips.filter(tip => tip.category === category);
  };

  return {
    tips,
    insights,
    categories,
    getCategoryInfo,
    getTipsByCategory,
  };
};