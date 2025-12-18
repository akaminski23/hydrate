import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect,
  G,
  Circle,
} from 'react-native-svg';
import { useTheme } from '@/providers/ThemeContext';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface CircularGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularGauge({
  percentage,
  size = 260,
  strokeWidth = 22,
}: CircularGaugeProps) {
  const { theme } = useTheme();
  const fillAnim = useRef(new Animated.Value(100)).current;
  const arcAnim = useRef(new Animated.Value(0)).current;
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  const center = size / 2;
  const radius = (size - strokeWidth) / 2 - 15;

  // Coordinate system: 0° = TOP, clockwise
  // 0°=top, 90°=right, 135°=bottom-right, 180°=bottom, 225°=bottom-left, 270°=left
  // Horseshoe open at BOTTOM: from bottom-left to bottom-right, going through TOP
  // Start: 225° (bottom-left) -> End: 135° (bottom-right) = 270° clockwise
  const START_ANGLE = 225;
  const SWEEP_ANGLE = 270; // Positive = clockwise (through top)

  useEffect(() => {
    // Animate water drop fill
    Animated.timing(fillAnim, {
      toValue: 100 - Math.min(percentage, 100),
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Animate arc progress
    Animated.timing(arcAnim, {
      toValue: Math.min(percentage, 100),
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  // Listen to arc animation value
  useEffect(() => {
    const listenerId = arcAnim.addListener(({ value }) => {
      setAnimatedPercentage(value);
    });
    return () => {
      arcAnim.removeListener(listenerId);
    };
  }, []);

  // Convert angle to point on circle
  // 0° = top, clockwise positive
  const getPoint = (angleDeg: number, r: number) => {
    const rad = (angleDeg - 90) * (Math.PI / 180); // -90 to make 0° = top
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  // Create arc using SVG path
  const createArc = (startAngle: number, sweepAngle: number, r: number) => {
    const endAngle = startAngle + sweepAngle;
    const start = getPoint(startAngle, r);
    const end = getPoint(endAngle, r);

    // large-arc-flag: 1 if |sweep| > 180°
    const largeArc = Math.abs(sweepAngle) > 180 ? 1 : 0;
    // sweep-flag: 1 for clockwise direction
    const sweepFlag = 1;

    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${end.x} ${end.y}`;
  };

  // Background arc (full 270° horseshoe)
  const bgArcPath = createArc(START_ANGLE, SWEEP_ANGLE, radius);

  // Progress arc (partial, based on animated percentage)
  const progressSweep = (SWEEP_ANGLE * animatedPercentage) / 100;
  const progressArcPath = animatedPercentage > 0 ? createArc(START_ANGLE, progressSweep, radius) : '';

  // Generate tick marks around the horseshoe
  const generateTicks = () => {
    const ticks = [];
    const tickCount = 54;
    const outerR = radius + strokeWidth / 2 + 10;

    for (let i = 0; i <= tickCount; i++) {
      // Go clockwise from 225° through top to 135°
      const angle = START_ANGLE + (i / tickCount) * SWEEP_ANGLE;
      const isMajor = i % 9 === 0;
      const tickLength = isMajor ? 8 : 4;
      const innerR = outerR - tickLength;

      const outer = getPoint(angle, outerR);
      const inner = getPoint(angle, innerR);

      ticks.push(
        <Path
          key={i}
          d={`M ${outer.x} ${outer.y} L ${inner.x} ${inner.y}`}
          stroke={theme.gaugeTicks}
          strokeWidth={isMajor ? 2 : 1.5}
          strokeLinecap="round"
        />
      );
    }
    return ticks;
  };

  // Water drop - real droplet shape (wide at bottom, pointed at top)
  const dropWidth = 90;
  const dropHeight = 110;
  const dropCenterX = center;
  const dropCenterY = center - 10;

  // Droplet: pointed tip at top, round bulb at bottom
  const tipY = dropCenterY - dropHeight / 2; // Top point
  const bulbCenterY = dropCenterY + dropHeight * 0.15; // Center of round bottom
  const bulbRadius = dropWidth / 2;
  const bottomY = dropCenterY + dropHeight / 2; // Bottom of bulb

  const dropPath = `
    M ${dropCenterX} ${tipY}
    C ${dropCenterX + dropWidth * 0.15} ${tipY + dropHeight * 0.2}
      ${dropCenterX + bulbRadius} ${bulbCenterY - bulbRadius * 0.5}
      ${dropCenterX + bulbRadius} ${bulbCenterY}
    C ${dropCenterX + bulbRadius} ${bulbCenterY + bulbRadius * 0.8}
      ${dropCenterX + bulbRadius * 0.55} ${bottomY}
      ${dropCenterX} ${bottomY}
    C ${dropCenterX - bulbRadius * 0.55} ${bottomY}
      ${dropCenterX - bulbRadius} ${bulbCenterY + bulbRadius * 0.8}
      ${dropCenterX - bulbRadius} ${bulbCenterY}
    C ${dropCenterX - bulbRadius} ${bulbCenterY - bulbRadius * 0.5}
      ${dropCenterX - dropWidth * 0.15} ${tipY + dropHeight * 0.2}
      ${dropCenterX} ${tipY}
    Z
  `;

  const dropTop = dropCenterY - dropHeight / 2;
  const dropBottom = dropCenterY + dropHeight / 2;

  const waterY = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [dropTop - 5, dropBottom + 5],
  });

  const isEmpty = percentage === 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={theme.accentLight} />
            <Stop offset="100%" stopColor={theme.gaugeProgress} />
          </LinearGradient>

          <LinearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={theme.accentLight} />
            <Stop offset="100%" stopColor={theme.gaugeProgress} />
          </LinearGradient>

          <LinearGradient id="dropStrokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.accentLight} />
            <Stop offset="100%" stopColor={theme.gaugeProgress} />
          </LinearGradient>

          <ClipPath id="dropClip">
            <Path d={dropPath} />
          </ClipPath>
        </Defs>

        {/* Tick marks */}
        {generateTicks()}

        {/* Background arc (gray horseshoe) */}
        <Path
          d={bgArcPath}
          stroke={theme.gaugeTrack}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />

        {/* Progress arc (blue) - only if animatedPercentage > 0 */}
        {animatedPercentage > 0 && (
          <Path
            d={progressArcPath}
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Water drop */}
        {isEmpty ? (
          <Path
            d={dropPath}
            fill={theme.gaugeTrack}
            stroke={theme.gaugeTicks}
            strokeWidth={2}
          />
        ) : (
          <>
            <Path
              d={dropPath}
              fill="none"
              stroke="url(#dropStrokeGradient)"
              strokeWidth={2.5}
            />
            <G clipPath="url(#dropClip)">
              <AnimatedRect
                x={dropCenterX - dropWidth}
                y={waterY}
                width={dropWidth * 2}
                height={dropHeight + 20}
                fill="url(#waterGradient)"
              />
            </G>
          </>
        )}

        {/* Drop highlights - positioned on the round bulb part */}
        <Circle
          cx={dropCenterX - bulbRadius * 0.4}
          cy={bulbCenterY - bulbRadius * 0.2}
          r={6}
          fill="rgba(255, 255, 255, 0.5)"
        />
        <Circle
          cx={dropCenterX - bulbRadius * 0.5}
          cy={bulbCenterY + bulbRadius * 0.2}
          r={4}
          fill="rgba(255, 255, 255, 0.3)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
