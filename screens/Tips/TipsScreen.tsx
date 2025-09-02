import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, Appbar, Searchbar, Chip, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';

import { TipCard } from './components/TipCard';
import { DidYouKnowCarousel } from './components/DidYouKnowCarousel';
import { useTips } from './hooks/useTips';
import { useBookmarks } from './hooks/useBookmarks';
import { Tip, TipCategory } from './types';

interface TipsScreenProps {
  onNavigateBack?: () => void;
}

export const TipsScreen: React.FC<TipsScreenProps> = ({ onNavigateBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { tips, insights, categories, getCategoryInfo } = useTips();
  const { bookmarkedTipIds, loadBookmarks, toggleBookmark, isBookmarked } = useBookmarks();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | 'all' | 'bookmarked'>(
    'all',
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  // Load bookmarks on component mount
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Filter tips based on search, category, and bookmarks
  const filteredTips = useMemo(() => {
    let filtered = tips;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tip) =>
          tip.title.toLowerCase().includes(query) || tip.description.toLowerCase().includes(query),
      );
    }

    // Filter by category
    if (selectedCategory !== 'all' && selectedCategory !== 'bookmarked') {
      filtered = filtered.filter((tip) => tip.category === selectedCategory);
    }

    // Filter by bookmarks
    if (selectedCategory === 'bookmarked' || showBookmarkedOnly) {
      filtered = filtered.filter((tip) => isBookmarked(tip.id));
    }

    return filtered;
  }, [tips, searchQuery, selectedCategory, showBookmarkedOnly, isBookmarked]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBookmarks();
    setIsRefreshing(false);
  };

  const handleCategorySelect = (category: TipCategory | 'all' | 'bookmarked') => {
    setSelectedCategory(category);
    setShowBookmarkedOnly(category === 'bookmarked');
  };

  const handleTipPress = (tip: Tip) => {
    // Handle tip press - could navigate to detail view or external link
    console.log('Tip pressed:', tip.title);
  };

  const bookmarkedTipsCount = bookmarkedTipIds.size;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      {/* Header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        {onNavigateBack && <Appbar.BackAction onPress={onNavigateBack} />}
        <Appbar.Content
          title={t('tips.screen.title')}
          titleStyle={{ color: theme.colors.onSurface }}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('tips.search.placeholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
            iconColor={theme.colors.onSurfaceVariant}
            inputStyle={{ color: theme.colors.onSurface }}
          />
        </View>

        {/* Category Filter Chips */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <Chip
              selected={selectedCategory === 'all'}
              onPress={() => handleCategorySelect('all')}
              style={[
                styles.filterChip,
                selectedCategory === 'all' && { backgroundColor: theme.colors.primaryContainer },
              ]}
              textStyle={{
                color:
                  selectedCategory === 'all' ? theme.colors.primary : theme.colors.onSurfaceVariant,
              }}
            >
              {t('tips.categories.all')} ({tips.length})
            </Chip>

            <Chip
              selected={selectedCategory === 'bookmarked'}
              onPress={() => handleCategorySelect('bookmarked')}
              style={[
                styles.filterChip,
                selectedCategory === 'bookmarked' && {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
              textStyle={{
                color:
                  selectedCategory === 'bookmarked'
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant,
              }}
              icon="bookmark"
            >
              {t('tips.categories.bookmarked')} ({bookmarkedTipsCount})
            </Chip>

            {categories.map((category) => {
              const categoryTipsCount = tips.filter((tip) => tip.category === category.key).length;
              return (
                <Chip
                  key={category.key}
                  selected={selectedCategory === category.key}
                  onPress={() => handleCategorySelect(category.key)}
                  style={[
                    styles.filterChip,
                    selectedCategory === category.key && {
                      backgroundColor: theme.colors.primaryContainer,
                    },
                  ]}
                  textStyle={{
                    color:
                      selectedCategory === category.key
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant,
                  }}
                >
                  {category.name} ({categoryTipsCount})
                </Chip>
              );
            })}
          </ScrollView>
        </View>

        {/* Did You Know Carousel */}
        {selectedCategory === 'all' && !searchQuery.trim() && (
          <DidYouKnowCarousel insights={insights} />
        )}

        {/* Tips Section Header */}
        <View style={styles.sectionHeader}>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            {selectedCategory === 'all'
              ? t('tips.allTips.title')
              : selectedCategory === 'bookmarked'
                ? t('tips.bookmarked.title')
                : `${getCategoryInfo(selectedCategory as TipCategory).name} ${t('tips.tips')}`}
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {filteredTips.length === 1
              ? t('tips.count.singular', { count: filteredTips.length })
              : t('tips.count.plural', { count: filteredTips.length })}
          </Text>
        </View>

        {/* Tips List */}
        <View style={styles.tipsContainer}>
          {filteredTips.length > 0 ? (
            filteredTips.map((tip) => (
              <TipCard
                key={tip.id}
                tip={tip}
                isBookmarked={isBookmarked(tip.id)}
                onToggleBookmark={toggleBookmark}
                onPress={handleTipPress}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text
                variant="bodyLarge"
                style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}
              >
                {searchQuery.trim()
                  ? t('tips.empty.search', { query: searchQuery })
                  : selectedCategory === 'bookmarked'
                    ? t('tips.empty.bookmarks')
                    : t('tips.empty.category')}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button for Bookmarked Tips */}
      {bookmarkedTipsCount > 0 && selectedCategory !== 'bookmarked' && (
        <FAB
          icon="bookmark"
          label={bookmarkedTipsCount.toString()}
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleCategorySelect('bookmarked')}
          color={theme.colors.onPrimary}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  searchBar: {
    borderRadius: 12,
    elevation: 2,
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 0,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  tipsContainer: {
    paddingBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 80, // Space for FAB
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});
