import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Card, Text, useTheme, Icon, IconButton } from 'react-native-paper';
import { DidYouKnowInsight } from '../types';
import { useTips } from '../hooks/useTips';
import { useTranslation } from 'react-i18next';

interface DidYouKnowCarouselProps {
  insights: DidYouKnowInsight[];
  autoAdvanceInterval?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32; // Account for margins

export const DidYouKnowCarousel: React.FC<DidYouKnowCarouselProps> = ({
  insights,
  autoAdvanceInterval = 5000, // 5 seconds
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { getCategoryInfo } = useTips();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoAdvance = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % insights.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * cardWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, autoAdvanceInterval);
  };

  const stopAutoAdvance = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    if (insights.length > 1) {
      startAutoAdvance();
    }
    
    return () => stopAutoAdvance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insights.length, autoAdvanceInterval]);

  const handleScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / cardWidth);
    setCurrentIndex(index);
  };

  const goToIndex = (index: number) => {
    stopAutoAdvance();
    setCurrentIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * cardWidth,
      animated: true,
    });
    // Restart auto-advance after manual navigation
    setTimeout(startAutoAdvance, 2000);
  };

  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : insights.length - 1;
    goToIndex(prevIndex);
  };

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % insights.length;
    goToIndex(nextIndex);
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text 
          variant="titleMedium" 
          style={[styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          {t('tips.didYouKnow.title')}
        </Text>
        {insights.length > 1 && (
          <View style={styles.controls}>
            <IconButton
              icon="chevron-left"
              size={20}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={goToPrevious}
              style={styles.controlButton}
            />
            <IconButton
              icon="chevron-right"
              size={20}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={goToNext}
              style={styles.controlButton}
            />
          </View>
        )}
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollBeginDrag={stopAutoAdvance}
        onScrollEndDrag={startAutoAdvance}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {insights.map((insight) => {
          const categoryInfo = getCategoryInfo(insight.category);
          
          return (
            <Card
              key={insight.id}
              style={[
                styles.card,
                { backgroundColor: theme.colors.surfaceVariant }
              ]}
              mode="outlined"
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.insightHeader}>
                  <View 
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${categoryInfo.color}1A` }
                    ]}
                  >
                    <Icon 
                      source={insight.icon} 
                      size={24} 
                      color={categoryInfo.color} 
                    />
                  </View>
                  <View style={styles.categoryIndicator}>
                    <View 
                      style={[
                        styles.categoryDot, 
                        { backgroundColor: categoryInfo.color }
                      ]} 
                    />
                    <Text 
                      variant="labelSmall" 
                      style={[
                        styles.categoryText, 
                        { color: theme.colors.onSurfaceVariant }
                      ]}
                    >
                      {categoryInfo.name}
                    </Text>
                  </View>
                </View>
                
                <Text 
                  variant="titleSmall" 
                  style={[
                    styles.insightTitle, 
                    { color: theme.colors.onSurface }
                  ]}
                >
                  {insight.title}
                </Text>
                
                <Text 
                  variant="bodyMedium" 
                  style={[
                    styles.insightContent, 
                    { color: theme.colors.onSurfaceVariant }
                  ]}
                >
                  {insight.content}
                </Text>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>

      {/* Pagination Dots */}
      {insights.length > 1 && (
        <View style={styles.pagination}>
          {insights.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentIndex 
                    ? theme.colors.primary 
                    : theme.colors.outline
                }
              ]}
              onPress={() => goToIndex(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    margin: 0,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  card: {
    width: cardWidth,
    marginRight: 16,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  insightTitle: {
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  insightContent: {
    lineHeight: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});