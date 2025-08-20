import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme, Card } from 'react-native-paper';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { BatterySample } from '../../../hooks/useBatteryMonitor';

const { width } = Dimensions.get('window');

interface BatteryHistoryChartProps {
  history: BatterySample[];
  isLoading?: boolean;
}

export const BatteryHistoryChart: React.FC<BatteryHistoryChartProps> = ({
  history,
  isLoading = false,
}) => {
  const theme = useTheme();

  const chartWidth = width - 64; // Account for padding
  const chartHeight = 200;
  const padding = 40;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  // If no data, show empty state
  if (isLoading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            Battery History (24h)
          </Text>
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Loading battery history...
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (!history.length) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            Battery History (24h)
          </Text>
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No battery data yet. Check back in a few minutes.
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  // Process data for chart
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  // Sort by timestamp and ensure we have data points
  const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);

  // Create time scale (last 24h)
  const timeScale = (timestamp: number) => {
    const relativeTime = timestamp - dayAgo;
    return (relativeTime / (24 * 60 * 60 * 1000)) * innerWidth;
  };

  // Create level scale (0-100%)
  const levelScale = (level: number) => {
    return innerHeight - (level / 100) * innerHeight;
  };

  // Generate path data
  const pathData = sortedHistory
    .map((sample, index) => {
      const x = timeScale(sample.timestamp);
      const y = levelScale(sample.level);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Generate grid lines
  const horizontalGridLines = [0, 25, 50, 75, 100].map((level) => (
    <React.Fragment key={level}>
      <Line
        x1={0}
        y1={levelScale(level)}
        x2={innerWidth}
        y2={levelScale(level)}
        stroke={theme.colors.outline}
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />
      <SvgText
        x={-5}
        y={levelScale(level)}
        textAnchor="end"
        fontSize="10"
        fill={theme.colors.onSurfaceVariant}
        dy="3"
      >
        {level}%
      </SvgText>
    </React.Fragment>
  ));

  // Generate time labels (every 6 hours)
  const timeLabels = [0, 6, 12, 18, 24].map((hours) => {
    const timestamp = dayAgo + hours * 60 * 60 * 1000;
    const x = timeScale(timestamp);
    const label = hours === 24 ? 'Now' : `${24 - hours}h ago`;

    return (
      <React.Fragment key={hours}>
        <Line
          x1={x}
          y1={0}
          x2={x}
          y2={innerHeight}
          stroke={theme.colors.outline}
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
        <SvgText
          x={x}
          y={innerHeight + 15}
          textAnchor="middle"
          fontSize="10"
          fill={theme.colors.onSurfaceVariant}
        >
          {label}
        </SvgText>
      </React.Fragment>
    );
  });

  // Latest sample for highlighting
  const latestSample = sortedHistory[sortedHistory.length - 1];
  const latestX = timeScale(latestSample.timestamp);
  const latestY = levelScale(latestSample.level);

  // Color based on battery level
  const getLineColor = () => {
    if (!latestSample) return theme.colors.primary;
    if (latestSample.level <= 20) return '#FF3B30'; // Red
    if (latestSample.level <= 50) return '#FFCC00'; // Yellow
    return '#34C759'; // Green
  };

  const lineColor = getLineColor();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          Battery History (24h)
        </Text>

        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={chartHeight} style={styles.svg}>
            <G transform={`translate(${padding}, ${padding})`}>
              {/* Grid lines */}
              {horizontalGridLines}
              {timeLabels}

              {/* Main line */}
              {pathData && (
                <Path
                  d={pathData}
                  stroke={lineColor}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {sortedHistory.map((sample, index) => (
                <Circle
                  key={index}
                  cx={timeScale(sample.timestamp)}
                  cy={levelScale(sample.level)}
                  r="2"
                  fill={sample.isCharging ? '#34C759' : lineColor}
                  stroke={theme.colors.surface}
                  strokeWidth="1"
                />
              ))}

              {/* Highlight latest point */}
              {latestSample && (
                <Circle
                  cx={latestX}
                  cy={latestY}
                  r="4"
                  fill={latestSample.isCharging ? '#34C759' : lineColor}
                  stroke={theme.colors.surface}
                  strokeWidth="2"
                />
              )}
            </G>
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Charging
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: lineColor }]} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              On Battery
            </Text>
          </View>
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
  chartContainer: {
    alignItems: 'center',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  emptyState: {
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
