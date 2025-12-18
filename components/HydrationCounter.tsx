import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/providers/ThemeContext';
import { fontSize, spacing } from '@/constants/spacing';
import { CircularGauge } from './CircularGauge';
import { useHydrateStore, ML_TO_OZ } from '@/store/useHydrateStore';

interface HydrationCounterProps {
  totalMl: number;
  percentage: number;
  goal: number;
}

export function HydrationCounter({
  totalMl,
  percentage,
  goal,
}: HydrationCounterProps) {
  const { theme } = useTheme();
  const { unit } = useHydrateStore();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: totalMl,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [totalMl]);

  // For animated number display
  const [displayMl, setDisplayMl] = React.useState(totalMl);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayMl(Math.round(value));
    });
    return () => animatedValue.removeListener(listener);
  }, []);

  const isGoalReached = percentage >= 100;

  // Format display based on unit
  const displayAmount = unit === 'oz'
    ? Math.round(displayMl * ML_TO_OZ * 10) / 10
    : displayMl;

  const goalDisplay = unit === 'oz'
    ? `/${Math.round(goal * ML_TO_OZ)} oz`
    : `/${goal} ml`;

  return (
    <View style={styles.container}>
      {/* Circular Gauge with Water Drop */}
      <View style={styles.gaugeContainer}>
        <CircularGauge percentage={percentage} size={260} strokeWidth={22} />

        {/* Counter overlay on gauge */}
        <View style={styles.counterOverlay}>
          <Text
            style={[
              styles.amount,
              { color: isGoalReached ? theme.success : theme.text },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayAmount}
          </Text>
          <Text style={[styles.goalText, { color: theme.textSecondary }]}>
            {goalDisplay}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterOverlay: {
    position: 'absolute',
    bottom: -15,
    alignItems: 'center',
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  goalText: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
