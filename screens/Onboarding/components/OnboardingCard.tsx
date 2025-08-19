import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';

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

  return (
    <View style={[styles.container, { width }]} testID={testID}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          {/* Placeholder illustration area */}
          <View
            style={[
              styles.illustrationContainer,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
            accessible={true}
            accessibilityLabel={
              illustration ? `Illustration: ${illustration}` : 'Placeholder illustration'
            }
          >
            <Text
              variant="bodyMedium"
              style={[styles.illustrationPlaceholder, { color: theme.colors.onPrimaryContainer }]}
            >
              📱
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
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    elevation: 2,
    borderRadius: 16,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  illustrationPlaceholder: {
    fontSize: 48,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
});
