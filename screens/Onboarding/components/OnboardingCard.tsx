import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { Colors } from '../../../colors';

const { width } = Dimensions.get('window');

export interface OnboardingCardProps {
  title: string;
  subtitle: string;
  illustration?: string; // Placeholder for future image support
  testID?: string;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  title,
  subtitle,
  illustration,
  testID,
}) => {
  const theme = useTheme();

  // Feature-specific icons mapping
  const getIllustrationIcon = (illustrationType?: string) => {
    switch (illustrationType) {
      case 'welcome':
        return '⚡';
      case 'battery':
        return '🔋';
      case 'storage':
        return '💾';
      case 'notifications':
        return '🔔';
      default:
        return '⚡';
    }
  };

  // Feature-specific gradient colors using rocket color scheme
  const getGradientColors = (illustrationType?: string) => {
    switch (illustrationType) {
      case 'welcome':
        return [Colors.primary[500] + '20', Colors.primary[500] + '40']; // Bright green gradient
      case 'battery':
        return [Colors.status.excellent + '20', Colors.status.excellent + '40']; // Excellent green
      case 'storage':
        return [Colors.primary[800] + '20', Colors.primary[800] + '40']; // Blue from gradient
      case 'notifications':
        return [Colors.accent[500] + '20', Colors.accent[500] + '40']; // Purple accent
      default:
        return [theme.colors.primaryContainer, theme.colors.primaryContainer];
    }
  };

  return (
    <View style={[styles.container, { width }]} testID={testID}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          {/* Enhanced illustration area with gradient */}
          <View
            style={[
              styles.illustrationContainer,
              {
                backgroundColor: getGradientColors(illustration)[0],
                borderColor: getGradientColors(illustration)[1],
                borderWidth: 2,
              },
            ]}
            accessible={true}
            accessibilityLabel={
              illustration ? `Illustration: ${illustration}` : 'Placeholder illustration'
            }
          >
            <Text
              variant="bodyMedium"
              style={[styles.illustrationPlaceholder, { color: theme.colors.primary }]}
            >
              {getIllustrationIcon(illustration)}
            </Text>
          </View>

          {/* Title */}
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.onSurface }]}
            accessible={true}
            accessibilityRole="header"
          >
            {title}
          </Text>

          {/* Subtitle */}
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            accessible={true}
          >
            {subtitle}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    elevation: 4,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 28,
  },
  illustrationContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  illustrationPlaceholder: {
    fontSize: 56,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
});
