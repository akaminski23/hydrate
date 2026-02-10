import { useState, useCallback } from 'react';
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
import { DrinkConfig, getFreeDrinks, getProDrinks } from '@/constants/drinks';
import { spacing, fontSize } from '@/constants/spacing';
import { useHydrateStore } from '@/store/useHydrateStore';
import { HydrationCounter } from '@/components/HydrationCounter';
import { QuickAddButton } from '@/components/QuickAddButton';
import { UndoToast } from '@/components/UndoToast';

// Quick add amount (250ml)
const QUICK_ADD_AMOUNT = 250;

// PRO drinks to show (only 3 most relevant for recovery)
const VISIBLE_PRO_DRINKS: string[] = ['collagen', 'electrolytes', 'protein'];

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const { isPro } = useRevenueCat();
  const {
    dailyGoal,
    addDrink,
    removeDrink,
    getTotalMl,
    getPercentage,
    getDailySummary,
    getLastDrinkId,
    unit,
  } = useHydrateStore();

  const totalMl = getTotalMl();
  const percentage = getPercentage();
  const { summary } = getDailySummary();

  // Quick add label based on unit
  const quickAddLabel = unit === 'oz' ? '8.5 oz' : '250 ml';

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [lastAddedDrink, setLastAddedDrink] = useState<{ id: string; label: string } | null>(null);

  // Get drinks
  const freeDrinks = getFreeDrinks();
  const proDrinks = getProDrinks().filter((d) => VISIBLE_PRO_DRINKS.includes(d.type));

  // Quick add water (main button)
  const handleQuickAddWater = useCallback(() => {
    addDrink('water', QUICK_ADD_AMOUNT);
    const lastId = getLastDrinkId();
    if (lastId) {
      const amountLabel = unit === 'oz' ? '8.5oz' : '250ml';
      setLastAddedDrink({ id: lastId, label: `${amountLabel} Water` });
      setToastVisible(true);
    }
  }, [addDrink, getLastDrinkId, unit]);

  // Handle tap on drink button (quick add 250ml)
  const handleDrinkTap = useCallback((drink: DrinkConfig) => {
    if (drink.isPro && !isPro) {
      router.push('/paywall');
      return;
    }
    addDrink(drink.type, QUICK_ADD_AMOUNT);
    const lastId = getLastDrinkId();
    if (lastId) {
      const amountLabel = unit === 'oz' ? '8.5oz' : '250ml';
      setLastAddedDrink({ id: lastId, label: `${amountLabel} ${drink.label}` });
      setToastVisible(true);
    }
  }, [addDrink, getLastDrinkId, isPro, router, unit]);

  // Handle long press (open custom amount modal as route)
  const handleDrinkLongPress = useCallback((drink: DrinkConfig) => {
    if (drink.isPro && !isPro) {
      router.push('/paywall');
      return;
    }
    router.push({
      pathname: '/modal/custom-amount',
      params: { drinkType: drink.type },
    });
  }, [isPro, router]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (lastAddedDrink) {
      removeDrink(lastAddedDrink.id);
    }
    setToastVisible(false);
    setLastAddedDrink(null);
  }, [lastAddedDrink, removeDrink]);

  // Dismiss toast
  const handleDismissToast = useCallback(() => {
    setToastVisible(false);
    setLastAddedDrink(null);
  }, []);

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
            <Ionicons name="water" size={24} color={theme.accent} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Hydration</Text>
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

          {/* Main Drink Button */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.drinkButton, { backgroundColor: theme.accent }]}
              onPress={handleQuickAddWater}
              activeOpacity={0.8}
            >
              <Text style={styles.drinkButtonText}>Drink ({quickAddLabel})</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Add Section */}
        <View style={styles.quickAddSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Add</Text>

          {/* FREE Drinks Grid (2x2) */}
          <View style={styles.drinksGrid}>
            {freeDrinks.map((drink) => (
              <QuickAddButton
                key={drink.type}
                icon={drink.icon}
                label={drink.label}
                color={drink.color}
                isLocked={false}
                onPress={() => handleDrinkTap(drink)}
                onLongPress={() => handleDrinkLongPress(drink)}
              />
            ))}
          </View>

          {/* Hint text */}
          <Text style={styles.hintText}>Long press for custom amount</Text>

          {/* PRO Drinks Row */}
          <View style={styles.proDrinksRow}>
            <View style={styles.proLabel}>
              <Ionicons name="diamond-outline" size={14} color={theme.premium} />
              <Text style={[styles.proLabelText, { color: theme.textSecondary }]}>PRO</Text>
            </View>
            <View style={styles.proDrinksContainer}>
              {proDrinks.map((drink) => (
                <QuickAddButton
                  key={drink.type}
                  icon={drink.icon}
                  label={drink.label}
                  color={drink.color}
                  isLocked={!isPro}
                  onPress={() => handleDrinkTap(drink)}
                  onLongPress={() => handleDrinkLongPress(drink)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Daily Summary */}
        <View style={styles.summarySection}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="sunny-outline" size={20} color={theme.accent} />
            <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
              {summary}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Undo Toast */}
      <UndoToast
        visible={toastVisible}
        message={lastAddedDrink ? `Added ${lastAddedDrink.label}` : ''}
        onUndo={handleUndo}
        onDismiss={handleDismissToast}
      />
    </SafeAreaView>
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
    paddingBottom: spacing.xl,
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

  // Action Row (Drink button only)
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
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

  // Quick Add Section
  quickAddSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  drinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  hintText: {
    fontSize: 12,
    color: '#8E8E93', // iOS secondary label
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // PRO Drinks Row
  proDrinksRow: {
    marginTop: spacing.lg,
  },
  proLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  proLabelText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  proDrinksContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // Daily Summary
  summarySection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
});
