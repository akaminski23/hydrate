import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, drinkColors, DrinkType } from '@/constants/colors';
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
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Home</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuDots}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Gauge Card */}
        <View style={styles.gaugeCard}>
          <HydrationCounter
            totalMl={totalMl}
            percentage={percentage}
            goal={dailyGoal}
          />

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.resetIconButton}
              onPress={reset}
              activeOpacity={0.8}
            >
              <Text style={styles.resetIconText}>↺</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drinkButton}
              onPress={handleQuickAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.drinkButtonText}>Drink ({quickAddLabel})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.glassButton}
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
            <Text style={styles.historyTitle}>History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentDrinks.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyText}>No drinks yet today</Text>
            </View>
          ) : (
            recentDrinks.map((drink) => (
              <HistoryItem key={drink.id} drink={drink} />
            ))
          )}
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <NavItem iconName="home" label="Home" active />
        <NavItem iconName="time" label="History" href="/history" />
        <NavItem iconName="settings" label="Settings" href="/settings" />
      </View>

      {/* Add Drink Modal */}
      <AddDrinkModal
        visible={modalVisible}
        drinkType={selectedDrink?.type || null}
        drinkIcon={selectedDrink?.icon || ''}
        drinkLabel={selectedDrink?.label || ''}
        drinkColor={selectedDrink?.color || colors.accent}
        onAdd={handleAddDrink}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}

// History Item Component
function HistoryItem({ drink }: { drink: Drink }) {
  const drinkInfo = getDrinkInfo(drink.type);
  const { unit } = useHydrateStore();

  // Format amount based on unit
  const displayAmount = unit === 'oz'
    ? `${Math.round(drink.amount * ML_TO_OZ * 10) / 10} oz`
    : `${drink.amount} ml`;

  return (
    <View style={styles.historyItem}>
      <View
        style={[
          styles.historyIcon,
          { backgroundColor: drinkColors[drink.type] + '20' },
        ]}
      >
        <Text style={styles.historyIconText}>{drinkInfo.icon}</Text>
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyDrinkName}>{drinkInfo.label}</Text>
        <Text style={styles.historyTime}>{formatTime(drink.timestamp)}</Text>
      </View>
      <Text style={styles.historyAmount}>{displayAmount}</Text>
      <TouchableOpacity style={styles.historyMenu}>
        <Text style={styles.historyMenuDots}>⋮</Text>
      </TouchableOpacity>
    </View>
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
    color: colors.text,
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDots: {
    fontSize: 20,
    color: colors.text,
  },

  // Gauge Card
  gaugeCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: 24,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
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
    backgroundColor: colors.accent,
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
    backgroundColor: colors.gaugeTrack,
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
    backgroundColor: colors.gaugeTrack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetIconText: {
    fontSize: 22,
    color: colors.textSecondary,
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
    color: colors.text,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '500',
  },
  emptyHistory: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },

  // History Item
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
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
    color: colors.text,
  },
  historyTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  historyMenu: {
    padding: spacing.xs,
  },
  historyMenuDots: {
    fontSize: 16,
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
