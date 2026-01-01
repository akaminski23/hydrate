import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Screenshot data with benefit-focused headlines
const SCREENSHOTS = [
  {
    id: 1,
    headline: 'Finally Hit Your\nWater Goals',
    subheadline: 'Track Every Sip in Seconds',
    gradient: ['#0A1628', '#1E3A5F'],
    icon: '💧',
    showProgress: true,
    progress: 68,
  },
  {
    id: 2,
    headline: 'More Energy.\nBetter Focus.',
    subheadline: 'Proper Hydration Changes Everything',
    gradient: ['#0F2027', '#203A43'],
    icon: '⚡',
    stats: ['2,100 ml', '70%', '6 drinks'],
  },
  {
    id: 3,
    headline: 'Never Forget\nto Drink',
    subheadline: 'Smart Reminders That Actually Work',
    gradient: ['#1A1A2E', '#16213E'],
    icon: '🔔',
    showReminder: true,
  },
  {
    id: 4,
    headline: 'Build Better\nHabits',
    subheadline: 'Track Your Progress Over Time',
    gradient: ['#0D1B2A', '#1B263B'],
    icon: '📈',
    showHistory: true,
  },
  {
    id: 5,
    headline: 'Unlock Your\nFull Potential',
    subheadline: 'Advanced Analytics & More',
    gradient: ['#1A1A2E', '#4A1942'],
    icon: '💎',
    showPro: true,
  },
  {
    id: 6,
    headline: 'Beautiful.\nSimple. Yours.',
    subheadline: 'Dark & Light Themes Included',
    gradient: ['#0A1628', '#1E3A5F'],
    icon: '🎨',
    showThemes: true,
  },
];

export default function ScreenshotsScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentScreenshot = SCREENSHOTS[currentIndex];

  const nextScreenshot = () => {
    setCurrentIndex((prev) => (prev + 1) % SCREENSHOTS.length);
  };

  const prevScreenshot = () => {
    setCurrentIndex((prev) => (prev - 1 + SCREENSHOTS.length) % SCREENSHOTS.length);
  };

  return (
    <LinearGradient
      colors={currentScreenshot.gradient as [string, string]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Close button - HIDE FOR SCREENSHOT */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Screenshot content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{currentScreenshot.icon}</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>{currentScreenshot.headline}</Text>
          <Text style={styles.subheadline}>{currentScreenshot.subheadline}</Text>

          {/* Mockup area */}
          <View style={styles.mockupContainer}>
            {currentScreenshot.showProgress && (
              <ProgressMockup progress={currentScreenshot.progress || 0} />
            )}
            {currentScreenshot.stats && (
              <StatsMockup stats={currentScreenshot.stats} />
            )}
            {currentScreenshot.showReminder && <ReminderMockup />}
            {currentScreenshot.showHistory && <HistoryMockup />}
            {currentScreenshot.showPro && <ProMockup />}
            {currentScreenshot.showThemes && <ThemesMockup />}
          </View>
        </View>

        {/* Navigation - HIDE FOR SCREENSHOT */}
        <View style={styles.navigation}>
          <TouchableOpacity style={styles.navButton} onPress={prevScreenshot}>
            <Text style={styles.navButtonText}>← Prev</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>
            {currentIndex + 1} / {SCREENSHOTS.length}
          </Text>
          <TouchableOpacity style={styles.navButton} onPress={nextScreenshot}>
            <Text style={styles.navButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Mockup Components
function ProgressMockup({ progress }: { progress: number }) {
  return (
    <View style={styles.progressMockup}>
      <View style={styles.gaugeOuter}>
        <View style={styles.gaugeInner}>
          <Text style={styles.gaugePercent}>{progress}%</Text>
          <Text style={styles.gaugeLabel}>of daily goal</Text>
        </View>
      </View>
      <View style={styles.quickActions}>
        <View style={[styles.quickButton, { backgroundColor: '#3B82F6' }]}>
          <Text style={styles.quickButtonText}>💧 Drink (250ml)</Text>
        </View>
      </View>
    </View>
  );
}

function StatsMockup({ stats }: { stats: string[] }) {
  return (
    <View style={styles.statsMockup}>
      {['Today', 'Progress', 'Drinks'].map((label, i) => (
        <View key={i} style={styles.statCard}>
          <Text style={styles.statValue}>{stats[i]}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function ReminderMockup() {
  return (
    <View style={styles.reminderMockup}>
      <View style={styles.notificationCard}>
        <View style={styles.notificationIcon}>
          <Text style={{ fontSize: 24 }}>💧</Text>
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>Time to hydrate!</Text>
          <Text style={styles.notificationBody}>
            You're 30% away from your goal. Take a sip!
          </Text>
        </View>
      </View>
      <View style={styles.reminderSettings}>
        <Text style={styles.reminderLabel}>Remind every</Text>
        <View style={styles.intervalButtons}>
          {['1h', '2h', '3h', '4h'].map((t, i) => (
            <View
              key={i}
              style={[styles.intervalButton, i === 1 && styles.intervalActive]}
            >
              <Text style={[styles.intervalText, i === 1 && { color: '#000' }]}>
                {t}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function HistoryMockup() {
  const drinks = [
    { time: '10:30 AM', type: '💧 Water', amount: '250ml' },
    { time: '12:15 PM', type: '☕ Coffee', amount: '200ml' },
    { time: '2:45 PM', type: '💧 Water', amount: '350ml' },
    { time: '4:00 PM', type: '🍵 Tea', amount: '200ml' },
  ];

  return (
    <View style={styles.historyMockup}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Today</Text>
        <Text style={styles.historyTotal}>1,000ml</Text>
      </View>
      {drinks.map((d, i) => (
        <View key={i} style={styles.historyItem}>
          <Text style={styles.historyType}>{d.type}</Text>
          <Text style={styles.historyAmount}>{d.amount}</Text>
          <Text style={styles.historyTime}>{d.time}</Text>
        </View>
      ))}
    </View>
  );
}

function ProMockup() {
  const features = [
    { icon: '📊', title: 'Advanced Analytics' },
    { icon: '🔔', title: 'Smart Reminders' },
    { icon: '☁️', title: 'iCloud Sync' },
    { icon: '🎨', title: 'Premium Themes' },
  ];

  return (
    <View style={styles.proMockup}>
      {features.map((f, i) => (
        <View key={i} style={styles.proFeature}>
          <Text style={styles.proIcon}>{f.icon}</Text>
          <Text style={styles.proTitle}>{f.title}</Text>
          <Ionicons name="checkmark-circle" size={22} color="#4ADE80" />
        </View>
      ))}
    </View>
  );
}

function ThemesMockup() {
  return (
    <View style={styles.themesMockup}>
      <View style={styles.themePreview}>
        <View style={[styles.themeCard, { backgroundColor: '#0A1628' }]}>
          <Text style={styles.themeLabel}>Dark</Text>
          <Ionicons name="moon" size={32} color="#3B82F6" />
        </View>
        <View style={[styles.themeCard, { backgroundColor: '#F8FAFC' }]}>
          <Text style={[styles.themeLabel, { color: '#1E293B' }]}>Light</Text>
          <Ionicons name="sunny" size={32} color="#F59E0B" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  headline: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 48,
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 40,
  },
  mockupContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pageIndicator: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },

  // Progress Mockup
  progressMockup: {
    alignItems: 'center',
  },
  gaugeOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59,130,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: '#3B82F6',
  },
  gaugeInner: {
    alignItems: 'center',
  },
  gaugePercent: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gaugeLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  quickActions: {
    marginTop: 32,
  },
  quickButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Stats Mockup
  statsMockup: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },

  // Reminder Mockup
  reminderMockup: {
    gap: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  notificationBody: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  reminderSettings: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  reminderLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  intervalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  intervalActive: {
    backgroundColor: '#3B82F6',
  },
  intervalText: {
    color: '#fff',
    fontWeight: '600',
  },

  // History Mockup
  historyMockup: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  historyTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  historyType: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginRight: 16,
  },
  historyTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },

  // Pro Mockup
  proMockup: {
    gap: 12,
  },
  proFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  proIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  proTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Themes Mockup
  themesMockup: {
    alignItems: 'center',
  },
  themePreview: {
    flexDirection: 'row',
    gap: 16,
  },
  themeCard: {
    width: 140,
    height: 180,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  themeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
