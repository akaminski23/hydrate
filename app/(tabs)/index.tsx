import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/providers/ThemeContext';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { drinkColors, DrinkType } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';
import { useHydrateStore, Drink, ML_TO_OZ } from '@/store/useHydrateStore';
import { HydrationCounter } from '@/components/HydrationCounter';
import { AddDrinkModal } from '@/components/AddDrinkModal';

// Drink options
const DRINK_OPTIONS = [
  { type: 'water' as DrinkType, icon: '💧', label: 'Water' },
  { type: 'coffee' as DrinkType, icon: '☕', label: 'Coffee' },
  { type: 'tea' as DrinkType, icon: '🍵', label: 'Tea' },
  { type: 'juice' as DrinkType, icon: '🧃', label: 'Juice' },
];

// Format time for history
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

// Get drink info by type
const getDrinkInfo = (type: DrinkType) => {
  return DRINK_OPTIONS.find((d) => d.type === type) || DRINK_OPTIONS[0];
};

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const { isPro } = useRevenueCat();
  const { dailyGoal, addDrink, getTotalMl, getPercentage, getTodayDrinks, reset, unit } =
    useHydrateStore();

  const totalMl = getTotalMl();
  const percentage = getPercentage();
  const todayDrinks = getTodayDrinks();

  // Quick add amount based on unit (250ml or ~8.5oz)
  const quickAddAmount = unit === 'oz' ? 251 : 250; // 251ml ≈ 8.5oz
  const quickAddLabel = unit === 'oz' ? '8.5 oz' : '250 ml';

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<{
    type: DrinkType;
    icon: string;
    label: string;
    color: string;
  } | null>(null);

  // Quick add water
  const handleQuickAdd = () => {
    addDrink('water', quickAddAmount);
  };

  const handleSelectDrink = (type: DrinkType) => {
    const drinkInfo = getDrinkInfo(type);
    setSelectedDrink({
      type,
      icon: drinkInfo.icon,
      label: drinkInfo.label,
      color: drinkColors[type],
    });
    setModalVisible(true);
  };

  const handleAddDrink = (amount: number) => {
    if (selectedDrink) {
      addDrink(selectedDrink.type, amount);
    }
    setModalVisible(false);
    setSelectedDrink(null);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDrink(null);
  };

  // Get last 3 drinks for history preview (today only)
  const recentDrinks = [...todayDrinks].reverse().slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>💧</Text>
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Home</Text>
          <View style={styles.headerActions}>
            {!isPro && (
              <TouchableOpacity
                style={styles.proButton}
                onPress={() => router.push('/paywall')}
              >
                <Ionicons name="diamond" size={20} color={theme.premium} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.themeToggleButton} onPress={toggleTheme}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={22}
                color={theme.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Gauge Card */}
        <View style={[styles.gaugeCard, { backgroundColor: theme.cardDark, borderColor: theme.cardBorder }]}>
          <HydrationCounter
            totalMl={totalMl}
            percentage={percentage}
            goal={dailyGoal}
          />

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.resetIconButton, { backgroundColor: 'transparent', borderColor: theme.accent, borderWidth: 2 }]}
              onPress={reset}
              activeOpacity={0.8}
            >
              <Text style={[styles.resetIconText, { color: theme.accent }]}>↺</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.drinkButton, { backgroundColor: theme.accent }]}
              onPress={handleQuickAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.drinkButtonText}>Drink ({quickAddLabel})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.glassButton, { backgroundColor: 'transparent', borderColor: theme.accent, borderWidth: 2 }]}
              onPress={() => handleSelectDrink('water')}
              activeOpacity={0.8}
            >
              <Text style={styles.glassIcon}>💧</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: theme.text }]}>History</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={[styles.viewAllText, { color: theme.accent }]}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentDrinks.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No drinks yet today
              </Text>
            </View>
          ) : (
            recentDrinks.map((drink) => (
              <HistoryItem key={drink.id} drink={drink} theme={theme} />
            ))
          )}
        </View>

      </ScrollView>

      {/* Add Drink Modal */}
      <AddDrinkModal
        visible={modalVisible}
        drinkType={selectedDrink?.type || null}
        drinkIcon={selectedDrink?.icon || ''}
        drinkLabel={selectedDrink?.label || ''}
        drinkColor={selectedDrink?.color || theme.accent}
        onAdd={handleAddDrink}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}

// History Item Component
function HistoryItem({ drink, theme }: { drink: Drink; theme: any }) {
  const drinkInfo = getDrinkInfo(drink.type);
  const { unit } = useHydrateStore();

  // Format amount based on unit
  const displayAmount = unit === 'oz'
    ? `${Math.round(drink.amount * ML_TO_OZ * 10) / 10} oz`
    : `${drink.amount} ml`;

  return (
    <View style={[styles.historyItem, { backgroundColor: theme.cardAlt, borderColor: theme.cardBorder }]}>
      <View
        style={[
          styles.historyIcon,
          { backgroundColor: drinkColors[drink.type] + '20' },
        ]}
      >
        <Text style={styles.historyIconText}>{drinkInfo.icon}</Text>
      </View>
      <View style={styles.historyInfo}>
        <Text style={[styles.historyDrinkName, { color: theme.text }]}>{drinkInfo.label}</Text>
        <Text style={[styles.historyTime, { color: theme.textSecondary }]}>
          {formatTime(drink.timestamp)}
        </Text>
      </View>
      <Text style={[styles.historyAmount, { color: theme.text }]}>{displayAmount}</Text>
      <TouchableOpacity style={styles.historyMenu}>
        <Text style={[styles.historyMenuDots, { color: theme.textSecondary }]}>⋮</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  proButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gauge Card
  gaugeCard: {
    marginHorizontal: spacing.md,
    borderRadius: 24,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  drinkButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 30,
    alignItems: 'center',
  },
  drinkButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  glassButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassIcon: {
    fontSize: 22,
  },
  resetIconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetIconText: {
    fontSize: 22,
  },

  // History Section
  historySection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  historyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  emptyHistory: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
  },

  // History Item
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconText: {
    fontSize: 20,
  },
  historyInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  historyDrinkName: {
    fontSize: fontSize.base,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: fontSize.base,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  historyMenu: {
    padding: spacing.xs,
  },
  historyMenuDots: {
    fontSize: 16,
  },
});
