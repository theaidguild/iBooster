import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, ActivityIndicator, Icon, Button, Surface } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LatencyTestResult } from '../../../hooks/useNetworkPerformance';
import { Colors } from '../../../colors';

interface LatencyTestCardProps {
  latencyResult: LatencyTestResult | null;
  isLoading: boolean;
  onRunTest: () => void;
  isNetworkConnected: boolean;
  connectionType?: string; // e.g., Wi-Fi, Cellular, etc. (for contextual tips)
  history?: LatencyTestResult[]; // small list of previous runs (latest first)
}

export const LatencyTestCard: React.FC<LatencyTestCardProps> = ({
  latencyResult,
  isLoading,
  onRunTest,
  isNetworkConnected,
  connectionType,
  history = [],
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Helper function to get latency status color using rocket color scheme
  const getLatencyStatusColor = (latency: number | null): string => {
    if (latency === null) return Colors.status.critical; // Red for error/no result

    if (latency < 50) return Colors.status.excellent; // Bright green for excellent (<50ms)
    if (latency < 100) return Colors.status.good; // Blue for good (50-100ms)
    if (latency < 200) return Colors.status.warning; // Amber for fair (100-200ms)
    return Colors.status.critical; // Red for poor (>200ms)
  };

  // Helper function to get latency status text
  const getLatencyStatusText = (latency: number | null): string => {
    if (latency === null) return t('network.latencyTest.status.failed');

    if (latency < 50) return t('network.latencyTest.status.excellent');
    if (latency < 100) return t('network.latencyTest.status.good');
    if (latency < 200) return t('network.latencyTest.status.fair');
    return t('network.latencyTest.status.poor');
  };

  // Helper function to format latency display
  const formatLatency = (latency: number | null): string => {
    if (latency === null) return '--';
    return `${latency}ms`;
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return t('network.latencyTest.justNow');
    if (diffMinutes < 60) return t('network.latencyTest.minutesAgo', { minutes: diffMinutes });

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return t('network.latencyTest.hoursAgo', { hours: diffHours });

    return date.toLocaleDateString();
  };

  const latency = latencyResult?.latency ?? null;
  const statusColor = getLatencyStatusColor(latency);
  const statusText = getLatencyStatusText(latency);
  const formattedLatency = formatLatency(latency);
  const totalSamples = latencyResult?.samples?.length ?? 0;
  const historyValues = history
    .map((h) => (typeof h.latency === 'number' ? h.latency : null))
    .filter((v): v is number => v !== null)
    .slice(0, 8) // limit to last 8 for a compact sparkline
    .reverse(); // oldest to newest for left-to-right progression
  const maxInHistory = historyValues.length ? Math.max(...historyValues) : 0;
  // Keep paired timestamps for labels
  const displayHistory = history
    .filter((h) => typeof h.latency === 'number')
    .slice(0, 8)
    .reverse();
  const firstTs = displayHistory[0]?.timestamp;
  const lastTs = displayHistory[displayHistory.length - 1]?.timestamp;

  // Determine a simple trend based on the latest two results (newest first)
  const latestTwo = history
    .filter((h) => typeof h.latency === 'number')
    .map((h) => h.latency as number)
    .slice(0, 2);
  let trend: 'improving' | 'worsening' | 'stable' | null = null;
  if (latestTwo.length === 2) {
    const [latest, previous] = latestTwo; // newest first from hook history
    const diff = latest - previous; // positive = slower (worse)
    const rel = previous > 0 ? Math.abs(diff) / previous : 0;
    const thresholdMs = 10; // minimal absolute change to consider
    const thresholdRel = 0.1; // and 10% relative change
    if (diff < -thresholdMs && rel > thresholdRel) trend = 'improving';
    else if (diff > thresholdMs && rel > thresholdRel) trend = 'worsening';
    else trend = 'stable';
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon source="speedometer" size={20} color={theme.colors.onSurface} />
            <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('network.latencyTest.title')}
            </Text>
          </View>
        </View>

        {/* Test Results Display */}
        <View style={styles.resultsContainer}>
          <Surface
            style={[styles.latencyDisplay, { backgroundColor: `${statusColor}1A` }]}
            elevation={0}
          >
            {isLoading ? (
              <ActivityIndicator animating size={32} color={statusColor} />
            ) : (
              <>
                <Text variant="headlineLarge" style={[styles.latencyValue, { color: statusColor }]}>
                  {formattedLatency}
                </Text>
                <Text variant="labelMedium" style={[styles.latencyUnit, { color: statusColor }]}>
                  ping
                </Text>
              </>
            )}
          </Surface>

          <View style={styles.statusInfo}>
            <Text variant="titleMedium" style={[styles.statusText, { color: statusColor }]}>
              {isLoading ? t('network.latencyTest.testing') : statusText}
            </Text>

            {latencyResult && !isLoading && (
              <Text
                variant="bodySmall"
                style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}
              >
                {t('network.latencyTest.lastTested')} {formatTimestamp(latencyResult.timestamp)}
              </Text>
            )}

            {latencyResult?.error && !isLoading && (
              <Text
                variant="bodySmall"
                style={[styles.errorText, { color: Colors.status.critical }]}
              >
                {t('network.latencyTest.error')} {latencyResult.error}
              </Text>
            )}
          </View>
        </View>

        {/* Test Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={onRunTest}
            disabled={isLoading || !isNetworkConnected}
            loading={isLoading}
            icon={isLoading ? undefined : 'play-circle-outline'}
            style={[
              styles.testButton,
              {
                backgroundColor: isNetworkConnected
                  ? theme.colors.primary
                  : theme.colors.surfaceDisabled,
              },
            ]}
            labelStyle={[
              styles.testButtonLabel,
              {
                color: isNetworkConnected ? theme.colors.onPrimary : theme.colors.onSurfaceDisabled,
              },
            ]}
          >
            {isLoading ? t('network.latencyTest.testing') : t('network.latencyTest.runTest')}
          </Button>

          {!isNetworkConnected && (
            <Text
              variant="bodySmall"
              style={[styles.disabledHint, { color: theme.colors.onSurfaceVariant }]}
            >
              {t('network.latencyTest.networkRequired')}
            </Text>
          )}
        </View>

        {/* Meta info and recommendations */}
        {latencyResult && !isLoading && (
          <View style={styles.metaContainer}>
            {/* Sparkline */}
            {historyValues.length > 1 && (
              <View style={styles.sparklineRow}>
                {historyValues.map((val, idx) => {
                  const hPct = maxInHistory
                    ? Math.max(6, Math.round((val / maxInHistory) * 24))
                    : 6; // min 6, max 24
                  const barColor = getLatencyStatusColor(val);
                  return (
                    <View
                      key={`spark-${idx}`}
                      style={[styles.sparkBar, { height: hPct, backgroundColor: barColor + 'CC' }]}
                    />
                  );
                })}
              </View>
            )}
            {displayHistory.length > 1 && (
              <View style={styles.sparklineLabelsRow}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {firstTs ? formatTimestamp(firstTs) : ''}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {lastTs ? formatTimestamp(lastTs) : ''}
                </Text>
              </View>
            )}
            {trend && (
              <Text
                variant="bodySmall"
                style={{
                  color:
                    trend === 'improving'
                      ? Colors.status.excellent
                      : trend === 'worsening'
                        ? Colors.status.critical
                        : theme.colors.onSurfaceVariant,
                  marginBottom: 2,
                }}
              >
                {t('network.latencyTest.trend.title')}{' '}
                {t(
                  trend === 'improving'
                    ? 'network.latencyTest.trend.improving'
                    : trend === 'worsening'
                      ? 'network.latencyTest.trend.worsening'
                      : 'network.latencyTest.trend.stable',
                )}
              </Text>
            )}
            {totalSamples > 0 && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('network.latencyTest.sampleSummary', {
                  count: totalSamples,
                })}
              </Text>
            )}

            {/* Contextual recommendation based on connection type and latency */}
            {latency !== null && (
              <Text
                variant="bodySmall"
                style={[styles.recommendation, { color: theme.colors.onSurfaceVariant }]}
              >
                {latency >= 200
                  ? connectionType === t('network.networkTypes.wifi')
                    ? t('network.latencyTest.recommendations.poorWifi')
                    : t('network.latencyTest.recommendations.poorCellular')
                  : latency >= 100
                    ? t('network.latencyTest.recommendations.fair')
                    : t('network.latencyTest.recommendations.good')}
              </Text>
            )}
          </View>
        )}

        {/* Performance Guide */}
        {latency !== null && !isLoading && (
          <View style={styles.guideContainer}>
            <Text
              variant="labelMedium"
              style={[styles.guideTitle, { color: theme.colors.onSurfaceVariant }]}
            >
              {t('network.latencyTest.guide.title')}
            </Text>
            <View style={styles.guideItems}>
              <View style={styles.guideItem}>
                <View style={[styles.guideDot, { backgroundColor: Colors.status.excellent }]} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('network.latencyTest.guide.excellent')}
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View style={[styles.guideDot, { backgroundColor: Colors.status.good }]} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('network.latencyTest.guide.good')}
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View style={[styles.guideDot, { backgroundColor: Colors.status.warning }]} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('network.latencyTest.guide.fair')}
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View style={[styles.guideDot, { backgroundColor: Colors.status.critical }]} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('network.latencyTest.guide.poor')}
                </Text>
              </View>
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
  resultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  latencyDisplay: {
    width: 120,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  latencyValue: {
    fontWeight: 'bold',
    lineHeight: 32,
  },
  latencyUnit: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: -4,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontWeight: '600',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    marginBottom: 2,
  },
  errorText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  testButton: {
    paddingHorizontal: 24,
    paddingVertical: 2,
  },
  testButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  guideContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 12,
  },
  metaContainer: {
    marginHorizontal: 4,
    marginBottom: 8,
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 28,
    marginBottom: 6,
  },
  sparkBar: {
    width: 8,
    borderRadius: 2,
    backgroundColor: '#999',
  },
  sparklineLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 4,
  },
  recommendation: {
    marginTop: 4,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  guideItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
  },
  guideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
});
