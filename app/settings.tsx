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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
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
  const router = useRouter();
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Settings Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Daily Goal */}
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Daily Goal</Text>
          <Text style={styles.settingDescription}>Set your daily hydration target (2000-4000 ml)</Text>
          <View style={styles.goalInputRow}>
            <TextInput
              style={styles.goalInput}
              value={goalInput}
              onChangeText={handleGoalChange}
              onBlur={handleGoalSubmit}
              onSubmitEditing={handleGoalSubmit}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={4}
            />
            <Text style={styles.goalUnit}>ml</Text>
          </View>
          <Text style={styles.goalConverted}>
            = {formatGoalDisplay(parseInt(goalInput, 10) || dailyGoal)}
          </Text>
        </View>

        {/* Units */}
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Units</Text>
          <Text style={styles.settingDescription}>Choose your preferred measurement unit</Text>
          <View style={styles.unitToggleContainer}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                unit === 'ml' && styles.unitButtonActive,
              ]}
              onPress={() => handleUnitToggle('ml')}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  unit === 'ml' && styles.unitButtonTextActive,
                ]}
              >
                ml
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                unit === 'oz' && styles.unitButtonActive,
              ]}
              onPress={() => handleUnitToggle('oz')}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  unit === 'oz' && styles.unitButtonTextActive,
                ]}
              >
                oz
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reminders */}
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Reminders</Text>
              <Text style={styles.settingDescription}>Get notified to drink water</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={handleRemindersToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Reminder Options (shown when enabled) */}
          {remindersEnabled && (
            <View style={styles.reminderOptions}>
              {/* Start Time */}
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.timeButtonText}>
                    {formatTimeDisplay(reminderStartTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* End Time */}
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.timeButtonText}>
                    {formatTimeDisplay(reminderEndTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Interval */}
              <View style={styles.intervalSection}>
                <Text style={styles.timeLabel}>Remind every</Text>
                <View style={styles.intervalButtons}>
                  {INTERVAL_OPTIONS.map((interval) => (
                    <TouchableOpacity
                      key={interval}
                      style={[
                        styles.intervalButton,
                        reminderInterval === interval && styles.intervalButtonActive,
                      ]}
                      onPress={() => setReminderInterval(interval)}
                    >
                      <Text
                        style={[
                          styles.intervalButtonText,
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
        <TouchableOpacity style={styles.resetCard} onPress={handleResetToday}>
          <Text style={styles.resetText}>Reset Today's Progress</Text>
        </TouchableOpacity>

        {/* Version (Easter egg: 5x tap to reset onboarding) */}
        <TouchableOpacity
          style={styles.versionContainer}
          onPress={handleVersionTap}
          activeOpacity={1}
        >
          <Text style={styles.versionText}>Version 1.0.0</Text>
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

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <NavItem iconName="home" label="Home" href="/" />
        <NavItem iconName="time" label="History" href="/history" />
        <NavItem iconName="settings" label="Settings" active />
      </View>
    </SafeAreaView>
  );
}

// Navigation Item Component
function NavItem({
  iconName,
  label,
  active = false,
  href,
}: {
  iconName: 'home' | 'time' | 'settings';
  label: string;
  active?: boolean;
  href?: string;
}) {
  const router = useRouter();

  const handlePress = () => {
    if (href) {
      router.push(href as any);
    }
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    return active ? iconName : `${iconName}-outline` as keyof typeof Ionicons.glyphMap;
  };

  return (
    <TouchableOpacity style={styles.navItem} onPress={handlePress}>
      <Ionicons
        name={getIconName()}
        size={24}
        color={active ? colors.accent : colors.textSecondary}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
  },
  goalUnit: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    width: 40,
  },
  goalConverted: {
    fontSize: fontSize.sm,
    color: colors.accent,
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
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  unitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },

  // Reminder Options
  reminderOptions: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  timeButton: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.accent,
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
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  intervalButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  intervalButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  intervalButtonTextActive: {
    color: '#FFFFFF',
  },

  // Reset Card
  resetCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  resetText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.error,
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
    color: colors.textSecondary,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  navLabelActive: {
    color: colors.accent,
    fontWeight: '500',
  },
});
