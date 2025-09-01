import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // You may need to install this package
import { Ionicons } from '@expo/vector-icons';
import { useBatteryMonitor } from '../../../hooks/useBatteryMonitor';

export function HealthScoreOrb({
  healthScore = 75,
  onPress,
}: {
  healthScore?: number;
  onPress?: () => void;
}) {
  // Determine color based on score
  const getColors = (baseColor: string) => {
    // Create lighter and darker variants for gradient
    const lighterColor =
      baseColor === '#22c55e' ? '#4ade80' : baseColor === '#f59e0b' ? '#fbbf24' : '#f87171';
    const darkerColor =
      baseColor === '#22c55e' ? '#16a34a' : baseColor === '#f59e0b' ? '#d97706' : '#dc2626';

    return { baseColor, lighterColor, darkerColor };
  };

  const color = healthScore >= 80 ? '#22c55e' : healthScore >= 50 ? '#f59e0b' : '#ef4444';
  const colors = getColors(color);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  // Tap bounce animation
  const tapAnim = useRef(new Animated.Value(1)).current;

  // Battery state (0-100 percent available at batteryState.batteryLevelPercent)
  const { batteryState } = useBatteryMonitor();

  // Set up animations
  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Shine effect
    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    // No specific cleanup API for Animated.loop; animations will be garbage collected on unmount.
    // If needed, could stop by keeping refs to animations and calling stop().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation interpolations
  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shinePosition = shineAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-70%', '170%', '-70%'],
  });

  // Combine pulse scale with tap scale
  const combinedScale = Animated.multiply(scale, tapAnim);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(tapAnim, {
        toValue: 0.92,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(tapAnim, {
        toValue: 1,
        duration: 170,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onPress?.();
    });
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        {/* Animated glow effect */}
        <Animated.View
          style={[
            styles.glow,
            { backgroundColor: colors.baseColor, transform: [{ scale: combinedScale }] },
          ]}
        />

        {/* Main orb */}
        <Animated.View style={[styles.orbContainer, { transform: [{ scale: combinedScale }] }]}>
          <LinearGradient
            colors={[colors.lighterColor, colors.darkerColor]}
            style={styles.orb}
            start={{ x: 0.3, y: 0.1 }}
            end={{ x: 0.7, y: 0.9 }}
          >
            {/* Shine effect */}
            <Animated.View style={[styles.shine, { transform: [{ translateX: shinePosition }] }]} />
            <Text style={styles.scoreText}>{healthScore}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Animated ring */}
        <Animated.View
          style={[
            styles.ring,
            { borderColor: colors.baseColor, transform: [{ rotate: rotation }] },
          ]}
        />

        {/* Optional: Small decorative dots */}
        <View
          style={[styles.dot, { top: '10%', left: '30%', backgroundColor: colors.lighterColor }]}
        />
        <View
          style={[styles.dot, { top: '70%', right: '20%', backgroundColor: colors.lighterColor }]}
        />

        {/* Battery low indicator */}
        {batteryState && batteryState.batteryLevelPercent <= 20 ? (
          <View style={styles.indicatorContainer}>
            <Ionicons name="battery-dead" size={14} color="#fff" />
            <Text style={styles.indicatorText}>{batteryState.batteryLevelPercent}%</Text>
          </View>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.4,
  },
  orbContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  orb: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    width: '40%',
    height: '200%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '45deg' }],
  },
  scoreText: {
    color: 'white',
    fontSize: 44,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ring: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  indicatorContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
