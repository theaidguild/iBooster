import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme, Icon } from 'react-native-paper';
import { Tip } from '../types';
import { BookmarkButton } from './BookmarkButton';
import { ShareButton } from './ShareButton';
import { useTips } from '../hooks/useTips';
import * as Linking from 'expo-linking';

interface TipCardProps {
  tip: Tip;
  isBookmarked: boolean;
  onToggleBookmark: (tipId: string) => void;
  onPress?: (tip: Tip) => void;
}

export const TipCard: React.FC<TipCardProps> = ({
  tip,
  isBookmarked,
  onToggleBookmark,
  onPress,
}) => {
  const theme = useTheme();
  const { getCategoryInfo } = useTips();
  const categoryInfo = getCategoryInfo(tip.category);

  const handleCardPress = () => {
    if (onPress) {
      onPress(tip);
    } else if (tip.externalUrl) {
      Linking.openURL(tip.externalUrl);
    }
  };

  const handleBookmarkToggle = () => {
    onToggleBookmark(tip.id);
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <TouchableOpacity onPress={handleCardPress} disabled={!tip.externalUrl && !onPress}>
        <Card.Content style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View 
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${categoryInfo.color}1A` }
                ]}
              >
                <Icon 
                  source={tip.icon} 
                  size={20} 
                  color={categoryInfo.color} 
                />
              </View>
              <View style={styles.titleContainer}>
                <Text 
                  variant="titleMedium" 
                  style={[styles.title, { color: theme.colors.onSurface }]}
                  numberOfLines={2}
                >
                  {tip.title}
                </Text>
                <View style={styles.categoryBadge}>
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
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actions}>
              <ShareButton
                title={tip.title}
                content={tip.description}
                url={tip.externalUrl}
                size={20}
              />
              <BookmarkButton
                isBookmarked={isBookmarked}
                onToggle={handleBookmarkToggle}
                size={20}
              />
            </View>
          </View>

          {/* Description */}
          <Text 
            variant="bodyMedium" 
            style={[
              styles.description, 
              { color: theme.colors.onSurfaceVariant }
            ]}
          >
            {tip.description}
          </Text>

          {/* External Link Indicator */}
          {tip.externalUrl && (
            <View style={styles.linkIndicator}>
              <Icon 
                source="open-in-new" 
                size={12} 
                color={theme.colors.primary} 
              />
              <Text 
                variant="labelSmall" 
                style={[
                  styles.linkText, 
                  { color: theme.colors.primary }
                ]}
              >
                Learn more
              </Text>
            </View>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    lineHeight: 20,
    marginBottom: 12,
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    marginLeft: 4,
    fontWeight: '500',
  },
});