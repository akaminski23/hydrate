import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Keyboard,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeContext';
import { spacing, fontSize } from '@/constants/spacing';
import { useHydrateStore, Unit, ML_TO_OZ, ReminderInterval } from '@/store/useHydrateStore';
import { TimePicker } from '@/components/TimePicker';
import { scheduleHydrationReminders, cancelAllNotifications } from '@/utils/notifications';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INTERVAL_OPTIONS: ReminderInterval[] = [1, 2, 3, 4];
const INTERVAL_LABELS: Record<ReminderInterval, string> = {
  1: '1h',
  2: '2h',
  3: '3h',
  4: '4h',
};

// Helper: Format time for display (24h to 12h AM/PM)
const formatTimeDisplay = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const {
    dailyGoal,
    unit,
    remindersEnabled,
    reminderStartTime,
    reminderEndTime,
    reminderInterval,
    setDailyGoal,
    setUnit,
    setRemindersEnabled,
    setReminderStartTime,
    setReminderEndTime,
    setReminderInterval,
    reset,
  } = useHydrateStore();

  const [goalInput, setGoalInput] = useState(dailyGoal.toString());

  // Time picker state
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Easter egg: tap counter for version
  const [tapCount, setTapCount] = useState(0);
  const lastTapTime = useRef(0);

  // Format goal display based on unit
  const formatGoalDisplay = (ml: number): string => {
    if (unit === 'oz') {
      return `${Math.round(ml * ML_TO_OZ)} oz`;
    }
    return `${ml} ml`;
  };

  const handleGoalChange = (text: string) => {
    const filtered = text.replace(/[^0-9]/g, '');
    setGoalInput(filtered);
  };

  const handleGoalSubmit = () => {
    Keyboard.dismiss();
    const newGoal = parseInt(goalInput, 10);
    if (!isNaN(newGoal)) {
      if (newGoal < 2000) {
        setGoalInput('2000');
        setDailyGoal(2000);
      } else if (newGoal > 4000) {
        setGoalInput('4000');
        setDailyGoal(4000);
      } else {
        setDailyGoal(newGoal);
      }
    } else {
      setGoalInput(dailyGoal.toString());
    }
  };

  const handleUnitToggle = (newUnit: Unit) => {
    setUnit(newUnit);
  };

  // Schedule or cancel notifications
  const updateNotifications = useCallback(async () => {
    if (remindersEnabled) {
      await scheduleHydrationReminders(reminderStartTime, reminderEndTime, reminderInterval);
    } else {
      await cancelAllNotifications();
    }
  }, [remindersEnabled, reminderStartTime, reminderEndTime, reminderInterval]);

  // Update notifications when settings change
  useEffect(() => {
    updateNotifications();
  }, [updateNotifications]);

  const handleRemindersToggle = (enabled: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRemindersEnabled(enabled);
  };

  const handleResetToday = () => {
    Alert.alert(
      'Reset Today',
      'Are you sure you want to reset today\'s progress?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => reset(),
        },
      ]
    );
  };

  // Easter egg: 5x quick tap on version to reset onboarding
  const handleVersionTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;

    // Reset counter if more than 500ms between taps
    if (timeSinceLastTap > 500) {
      setTapCount(1);
    } else {
      setTapCount((prev) => prev + 1);
    }

    lastTapTime.current = now;

    // Show alert after 5 quick taps
    if (tapCount >= 4) {
      setTapCount(0);
      Alert.alert(
        'Reset Onboarding',
        'This will show the onboarding screens again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: async () => {
              await AsyncStorage.removeItem('hasCompletedOnboarding');
              Alert.alert(
                'Onboarding Reset',
                'Please restart the app to see onboarding.',
                [{ text: 'OK' }]
              );
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Settings Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Theme Toggle */}
        <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Appearance</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                {isDark ? 'Dark mode' : 'Light mode'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.themeToggle, { backgroundColor: theme.background }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={24}
                color={theme.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Goal */}
        <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Daily Goal</Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Set your daily hydration target (2000-4000 ml)
          </Text>
          <View style={styles.goalInputRow}>
            <TextInput
              style={[
                styles.goalInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={goalInput}
              onChangeText={handleGoalChange}
              onBlur={handleGoalSubmit}
              onSubmitEditing={handleGoalSubmit}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={4}
              placeholderTextColor={theme.textSecondary}
            />
            <Text style={[styles.goalUnit, { color: theme.textSecondary }]}>ml</Text>
          </View>
          <Text style={[styles.goalConverted, { color: theme.accent }]}>
            = {formatGoalDisplay(parseInt(goalInput, 10) || dailyGoal)}
          </Text>
        </View>

        {/* Units */}
        <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Units</Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Choose your preferred measurement unit
          </Text>
          <View style={styles.unitToggleContainer}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                { backgroundColor: theme.background, borderColor: theme.border },
                unit === 'ml' && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
              onPress={() => handleUnitToggle('ml')}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  { color: theme.textSecondary },
                  unit === 'ml' && styles.unitButtonTextActive,
                ]}
              >
                ml
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                { backgroundColor: theme.background, borderColor: theme.border },
                unit === 'oz' && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
              onPress={() => handleUnitToggle('oz')}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  { color: theme.textSecondary },
                  unit === 'oz' && styles.unitButtonTextActive,
                ]}
              >
                oz
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reminders */}
        <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Reminders</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Get notified to drink water
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={handleRemindersToggle}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Reminder Options (shown when enabled) */}
          {remindersEnabled && (
            <View style={[styles.reminderOptions, { backgroundColor: theme.background }]}>
              {/* Start Time */}
              <View style={styles.timeRow}>
                <Text style={[styles.timeLabel, { color: theme.text }]}>Start Time</Text>
                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={[styles.timeButtonText, { color: theme.accent }]}>
                    {formatTimeDisplay(reminderStartTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* End Time */}
              <View style={styles.timeRow}>
                <Text style={[styles.timeLabel, { color: theme.text }]}>End Time</Text>
                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={[styles.timeButtonText, { color: theme.accent }]}>
                    {formatTimeDisplay(reminderEndTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Interval */}
              <View style={styles.intervalSection}>
                <Text style={[styles.timeLabel, { color: theme.text }]}>Remind every</Text>
                <View style={styles.intervalButtons}>
                  {INTERVAL_OPTIONS.map((interval) => (
                    <TouchableOpacity
                      key={interval}
                      style={[
                        styles.intervalButton,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        reminderInterval === interval && {
                          backgroundColor: theme.accent,
                          borderColor: theme.accent,
                        },
                      ]}
                      onPress={() => setReminderInterval(interval)}
                    >
                      <Text
                        style={[
                          styles.intervalButtonText,
                          { color: theme.textSecondary },
                          reminderInterval === interval && styles.intervalButtonTextActive,
                        ]}
                      >
                        {INTERVAL_LABELS[interval]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Reset Today */}
        <TouchableOpacity
          style={[styles.resetCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={handleResetToday}
        >
          <Text style={[styles.resetText, { color: theme.error }]}>Reset Today's Progress</Text>
        </TouchableOpacity>

        {/* Version (Easter egg: 5x tap to reset onboarding) */}
        <TouchableOpacity
          style={styles.versionContainer}
          onPress={handleVersionTap}
          activeOpacity={1}
        >
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>Version 1.0.0</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Start Time Picker */}
      <TimePicker
        visible={showStartPicker}
        value={reminderStartTime}
        onConfirm={(time) => {
          setReminderStartTime(time);
          setShowStartPicker(false);
        }}
        onCancel={() => setShowStartPicker(false)}
        title="Start Time"
      />

      {/* End Time Picker */}
      <TimePicker
        visible={showEndPicker}
        value={reminderEndTime}
        onConfirm={(time) => {
          setReminderEndTime(time);
          setShowEndPicker(false);
        }}
        onCancel={() => setShowEndPicker(false)}
        title="End Time"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
  },

  // Setting Card
  settingCard: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fontSize.sm,
  },

  // Theme Toggle
  themeToggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Goal Input
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  goalInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: '600',
    borderWidth: 2,
  },
  goalUnit: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginLeft: spacing.sm,
    width: 40,
  },
  goalConverted: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },

  // Unit Toggle
  unitToggleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  unitButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  unitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },

  // Reminder Options
  reminderOptions: {
    marginTop: spacing.lg,
    borderRadius: 12,
    padding: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timeLabel: {
    fontSize: fontSize.base,
    fontWeight: '500',
  },
  timeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },

  // Interval
  intervalSection: {
    marginTop: spacing.xs,
  },
  intervalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  intervalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  intervalButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  intervalButtonTextActive: {
    color: '#FFFFFF',
  },

  // Reset Card
  resetCard: {
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  resetText: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },

  // Version text (Easter egg)
  versionContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  versionText: {
    fontSize: fontSize.sm,
  },
});
