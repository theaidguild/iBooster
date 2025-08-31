import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { StorageBreakdown } from '../../../hooks/useStorageAnalyzer';
import { Colors } from '../../../colors';

const { width } = Dimensions.get('window');

interface StorageBreakdownChartProps {
  breakdown: StorageBreakdown | null;
  isLoading?: boolean;
  formatBytes: (bytes: number) => string;
}

interface ChartSegment {
  value: number;
  color: string;
  label: string;
  percentage: number;
}

export const StorageBreakdownChart: React.FC<StorageBreakdownChartProps> = ({
  breakdown,
  isLoading = false,
  formatBytes,
}) => {
  const theme = useTheme();

  const chartSize = Math.min(width - 64, 280);
  const radius = chartSize / 2 - 40;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;
  const strokeWidth = 40;

  // Calculate segments based on breakdown data
  const getSegments = (): ChartSegment[] => {
    if (!breakdown || breakdown.total === 0) {
      return [
        {
          value: 100,
          color: theme.colors.outline,
          label: 'No Data',
          percentage: 100,
        },
      ];
    }

    const segments: ChartSegment[] = [];
    const total = breakdown.total;

    if (breakdown.cache > 0) {
      segments.push({
        value: breakdown.cache,
        color: Colors.status.critical, // Red for cache
        label: 'Cache',
        percentage: (breakdown.cache / total) * 100,
      });
    }

    if (breakdown.documents > 0) {
      segments.push({
        value: breakdown.documents,
        color: Colors.primary[700], // Cyan for documents
        label: 'Documents',
        percentage: (breakdown.documents / total) * 100,
      });
    }

    if (breakdown.media && breakdown.media > 0) {
      segments.push({
        value: breakdown.media,
        color: Colors.primary[800], // Blue for media
        label: 'Media',
        percentage: (breakdown.media / total) * 100,
      });
    }

    if (breakdown.other > 0) {
      segments.push({
        value: breakdown.other,
        color: Colors.primary[800], // Blue for other
        label: 'Other',
        percentage: (breakdown.other / total) * 100,
      });
    }

    // If we have device storage info, show free space
    if (breakdown.deviceTotal && breakdown.free) {
      const usedSpace = breakdown.deviceTotal - breakdown.free;
      const appSpaceRatio = breakdown.total / usedSpace;

      // Adjust to show device-level view
      if (appSpaceRatio < 1) {
        segments.push({
          value: usedSpace - breakdown.total,
          color: Colors.neutral[400], // Gray for other apps
          label: 'Other Apps',
          percentage: ((usedSpace - breakdown.total) / breakdown.deviceTotal) * 100,
        });

        segments.push({
          value: breakdown.free,
          color: Colors.status.excellent, // Bright green for free space
          label: 'Free Space',
          percentage: (breakdown.free / breakdown.deviceTotal) * 100,
        });

        // Recalculate percentages based on device total
        segments.forEach((segment) => {
          if (segment.label !== 'Free Space' && segment.label !== 'Other Apps') {
            segment.percentage = (segment.value / breakdown.deviceTotal!) * 100;
          }
        });
      }
    }

    return segments.filter((segment) => segment.value > 0);
  };

  // Create SVG path for pie slice
  const createArcPath = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ): string => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const segments = getSegments();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (isLoading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            Storage Breakdown
          </Text>
          <View style={[styles.loadingContainer, { height: chartSize }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Analyzing storage...
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          Storage Breakdown
        </Text>

        <View style={styles.chartContainer}>
          <Svg width={chartSize} height={chartSize}>
            <G>
              {segments.map((segment, index) => {
                const percentage = (segment.value / total) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle = segments
                  .slice(0, index)
                  .reduce((acc, seg) => acc + (seg.value / total) * 360, 0);
                const endAngle = startAngle + angle;

                if (percentage < 1) return null; // Skip very small segments

                return (
                  <Path
                    key={segment.label}
                    d={createArcPath(centerX, centerY, radius, startAngle, endAngle)}
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Center circle for inner content */}
              <Circle
                cx={centerX}
                cy={centerY}
                r={radius - strokeWidth / 2}
                fill={theme.colors.surface}
                stroke={theme.colors.outline}
                strokeWidth={1}
              />

              {/* Total storage text in center */}
              <SvgText
                x={centerX}
                y={centerY - 10}
                textAnchor="middle"
                fontSize="18"
                fontWeight="bold"
                fill={theme.colors.onSurface}
              >
                {breakdown ? formatBytes(breakdown.total) : 'N/A'}
              </SvgText>
              <SvgText
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                fontSize="12"
                fill={theme.colors.onSurfaceVariant}
              >
                Used
              </SvgText>
            </G>
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {segments.map((segment) => {
            if (segment.percentage < 1) return null;

            return (
              <View key={segment.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
                <View style={styles.legendText}>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
                    {segment.label}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatBytes(segment.value)} ({segment.percentage.toFixed(1)}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Device storage info if available */}
        {breakdown?.deviceTotal && breakdown.free && (
          <View style={styles.deviceInfo}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
            >
              Device Total: {formatBytes(breakdown.deviceTotal)} • Free:{' '}
              {formatBytes(breakdown.free)}
            </Text>
          </View>
        )}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  legend: {
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
  },
  deviceInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[200],
  },
});
