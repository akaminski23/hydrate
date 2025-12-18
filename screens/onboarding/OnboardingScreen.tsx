import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useHydrateStore } from '@/store/useHydrateStore';
import { useTheme } from '@/providers/ThemeContext';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

// Goal presets in mL
const GOAL_PRESETS = [2000, 2500, 3000, 3500];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const router = useRouter();
  const { setDailyGoal, setRemindersEnabled } = useHydrateStore();
  const { theme, isDark } = useTheme();

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(2500);
  const [remindersOn, setRemindersOn] = useState(false);

  const goToNext = () => {
    if (currentIndex < 2) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleComplete = async () => {
    // Save settings
    setDailyGoal(selectedGoal);
    setRemindersEnabled(remindersOn);

    // Mark onboarding as complete
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');

    // Notify parent
    onComplete();
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: theme.border },
            currentIndex === index && { backgroundColor: theme.accent },
          ]}
        />
      ))}
    </View>
  );

  const renderItem = ({ item, index }: { item: number; index: number }) => {
    switch (index) {
      case 0:
        return (
          <View style={styles.slide}>
            <View style={styles.content}>
              {/* Water Drop Icon */}
              <View style={styles.iconContainer}>
                <WaterDropIcon size={120} theme={theme} />
              </View>

              <Text style={[styles.title, { color: theme.text }]}>Welcome to Hydrate</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Track your daily water intake and stay healthy
              </Text>
            </View>

            <View style={styles.footer}>
              {renderDots()}
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={goToNext}>
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.slide}>
            <View style={styles.content}>
              <Text style={[styles.title, { color: theme.text }]}>Set Your Daily Goal</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                How much water do you want to drink each day?
              </Text>

              <View style={styles.goalGrid}>
                {GOAL_PRESETS.map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.goalButton,
                      { backgroundColor: theme.card, borderColor: 'transparent' },
                      selectedGoal === goal && { borderColor: theme.accent, backgroundColor: theme.accent + '20' },
                    ]}
                    onPress={() => setSelectedGoal(goal)}
                  >
                    <Text
                      style={[
                        styles.goalButtonText,
                        { color: theme.textSecondary },
                        selectedGoal === goal && { color: theme.accent },
                      ]}
                    >
                      {goal} ml
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.footer}>
              {renderDots()}
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={goToNext}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.slide}>
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Text style={styles.bellIcon}>🔔</Text>
              </View>

              <Text style={[styles.title, { color: theme.text }]}>Stay Hydrated</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Get gentle reminders throughout the day
              </Text>

              <View style={[styles.reminderToggle, { backgroundColor: theme.card }]}>
                <Text style={[styles.reminderText, { color: theme.text }]}>Enable Reminders</Text>
                <Switch
                  value={remindersOn}
                  onValueChange={setRemindersOn}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.footer}>
              {renderDots()}
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={handleComplete}>
                <Text style={styles.buttonText}>Start Tracking</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={flatListRef}
        data={[0, 1, 2]}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.toString()}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      />
    </SafeAreaView>
  );
}

// Water Drop Icon Component (matching the gauge)
function WaterDropIcon({ size = 120, theme }: { size?: number; theme: any }) {
  const center = size / 2;
  const dropWidth = size * 0.7;
  const dropHeight = size * 0.85;
  const dropCenterX = center;
  const dropCenterY = center;

  const tipY = dropCenterY - dropHeight / 2;
  const bulbCenterY = dropCenterY + dropHeight * 0.15;
  const bulbRadius = dropWidth / 2;
  const bottomY = dropCenterY + dropHeight / 2;

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

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="dropGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={theme.accentLight} />
          <Stop offset="100%" stopColor={theme.gaugeProgress} />
        </LinearGradient>
      </Defs>
      <Path d={dropPath} fill="url(#dropGradient)" />
      {/* Highlights */}
      <Circle
        cx={dropCenterX - bulbRadius * 0.35}
        cy={bulbCenterY - bulbRadius * 0.15}
        r={8}
        fill="rgba(255, 255, 255, 0.5)"
      />
      <Circle
        cx={dropCenterX - bulbRadius * 0.45}
        cy={bulbCenterY + bulbRadius * 0.25}
        r={5}
        fill="rgba(255, 255, 255, 0.3)"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingBottom: 40,
  },

  // Icon
  iconContainer: {
    marginBottom: 40,
  },
  bellIcon: {
    fontSize: 80,
  },

  // Text
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },

  // Button
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Goal Grid
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 40,
    width: '100%',
  },
  goalButton: {
    width: (SCREEN_WIDTH - 48 - 16) / 2,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  goalButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },

  // Reminder Toggle
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 40,
    width: '100%',
  },
  reminderText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
