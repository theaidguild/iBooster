import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, ProgressBar } from 'react-native-paper';

interface HealthScoreCardProps {
  score: number; // 0-100
  isLoading?: boolean;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ score, isLoading = false }) => {
  const theme = useTheme();

  // Determine color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#34C759'; // Green
    if (score >= 50) return '#FFCC00'; // Yellow
    return '#FF3B30'; // Red
  };

  const getScoreStatus = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Needs Attention';
  };

  const scoreColor = getScoreColor(score);
  const normalizedScore = Math.max(0, Math.min(100, score)) / 100;

  if (isLoading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          <View style={styles.loadingContainer}>
            <ProgressBar indeterminate style={styles.loadingBar} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              Analyzing device health...
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
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
            Device Health Score
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          {/* Circular Progress Indicator */}
          <View style={styles.circularProgress}>
            <View style={[styles.progressRing, { borderColor: theme.colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressRingFill,
                  {
                    borderColor: scoreColor,
                    transform: [{ rotate: `${normalizedScore * 360}deg` }],
                  },
                ]}
              />
            </View>
            <View style={styles.scoreDisplay}>
              <Text variant="displayMedium" style={[styles.scoreText, { color: scoreColor }]}>
                {score}
              </Text>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                / 100
              </Text>
            </View>
          </View>

          <Text variant="titleMedium" style={[styles.statusText, { color: scoreColor }]}>
            {getScoreStatus(score)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  content: {
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  circularProgress: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingFill: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  scoreDisplay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
    lineHeight: 48,
  },
  statusText: {
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingBar: {
    width: 200,
    marginBottom: 16,
  },
});
