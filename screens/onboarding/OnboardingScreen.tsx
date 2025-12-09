import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Switch,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useHydrateStore } from '@/store/useHydrateStore';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ACCENT_COLOR = '#2196F3';
const ACCENT_LIGHT = '#E3F2FD';

interface OnboardingScreenProps {
  onComplete: () => void;
}

// Goal presets in mL
const GOAL_PRESETS = [2000, 2500, 3000, 3500];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const router = useRouter();
  const { setDailyGoal, setRemindersEnabled } = useHydrateStore();

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
            currentIndex === index && styles.dotActive,
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
                <WaterDropIcon size={120} />
              </View>

              <Text style={styles.title}>Welcome to Hydrate</Text>
              <Text style={styles.subtitle}>
                Track your daily water intake and stay healthy
              </Text>
            </View>

            <View style={styles.footer}>
              {renderDots()}
              <TouchableOpacity style={styles.button} onPress={goToNext}>
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.slide}>
            <View style={styles.content}>
              <Text style={styles.title}>Set Your Daily Goal</Text>
              <Text style={styles.subtitle}>
                How much water do you want to drink each day?
              </Text>

              <View style={styles.goalGrid}>
                {GOAL_PRESETS.map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.goalButton,
                      selectedGoal === goal && styles.goalButtonSelected,
                    ]}
                    onPress={() => setSelectedGoal(goal)}
                  >
                    <Text
                      style={[
                        styles.goalButtonText,
                        selectedGoal === goal && styles.goalButtonTextSelected,
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
              <TouchableOpacity style={styles.button} onPress={goToNext}>
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

              <Text style={styles.title}>Stay Hydrated</Text>
              <Text style={styles.subtitle}>
                Get gentle reminders throughout the day
              </Text>

              <View style={styles.reminderToggle}>
                <Text style={styles.reminderText}>Enable Reminders</Text>
                <Switch
                  value={remindersOn}
                  onValueChange={setRemindersOn}
                  trackColor={{ false: '#E0E0E0', true: ACCENT_COLOR }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.footer}>
              {renderDots()}
              <TouchableOpacity style={styles.button} onPress={handleComplete}>
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
    <SafeAreaView style={styles.container}>
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
function WaterDropIcon({ size = 120 }: { size?: number }) {
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
          <Stop offset="0%" stopColor="#56CCF2" />
          <Stop offset="100%" stopColor="#2D9CDB" />
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
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
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
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: ACCENT_COLOR,
  },

  // Button
  button: {
    backgroundColor: ACCENT_COLOR,
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
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  goalButtonSelected: {
    borderColor: ACCENT_COLOR,
    backgroundColor: ACCENT_LIGHT,
  },
  goalButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
  },
  goalButtonTextSelected: {
    color: ACCENT_COLOR,
  },

  // Reminder Toggle
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 40,
    width: '100%',
  },
  reminderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A2E',
  },
});
