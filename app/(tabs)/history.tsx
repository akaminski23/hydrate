import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeContext';
import { drinkColors, DrinkType } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';
import { useHydrateStore, Drink, ML_TO_OZ } from '@/store/useHydrateStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_THRESHOLD = -80;

type FilterType = 'today' | 'week' | 'month';

// Drink options
const DRINK_OPTIONS = [
  { type: 'water' as DrinkType, icon: '💧', label: 'Water' },
  { type: 'coffee' as DrinkType, icon: '☕', label: 'Coffee' },
  { type: 'tea' as DrinkType, icon: '🍵', label: 'Tea' },
  { type: 'juice' as DrinkType, icon: '🧃', label: 'Juice' },
];

// Get drink info by type
const getDrinkInfo = (type: DrinkType) => {
  return DRINK_OPTIONS.find((d) => d.type === type) || DRINK_OPTIONS[0];
};

// Format time
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

// Format date header
const formatDateHeader = (dateStr: string): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Group drinks by date
interface GroupedDrinks {
  date: string;
  drinks: Drink[];
  total: number;
}

const groupDrinksByDate = (drinks: Drink[]): GroupedDrinks[] => {
  const groups: { [key: string]: Drink[] } = {};

  drinks.forEach((drink) => {
    const dateStr = new Date(drink.timestamp).toISOString().split('T')[0];
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(drink);
  });

  return Object.entries(groups)
    .map(([date, drinkList]) => ({
      date,
      drinks: drinkList.sort((a, b) => b.timestamp - a.timestamp),
      total: drinkList.reduce((sum, d) => sum + d.amount, 0),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
};

// Filter drinks by period
const filterDrinks = (drinks: Drink[], filter: FilterType): Drink[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'today':
      return drinks.filter((d) => new Date(d.timestamp) >= today);
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return drinks.filter((d) => new Date(d.timestamp) >= weekAgo);
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return drinks.filter((d) => new Date(d.timestamp) >= monthAgo);
    }
    default:
      return drinks;
  }
};

export default function HistoryScreen() {
  const { theme, isDark } = useTheme();
  const { drinks, unit, removeDrink } = useHydrateStore();
  const [filter, setFilter] = useState<FilterType>('today');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredDrinks = filterDrinks(drinks, filter);
  const groupedDrinks = groupDrinksByDate(filteredDrinks);

  // Format amount based on unit
  const formatAmount = (ml: number): string => {
    if (unit === 'oz') {
      return `${Math.round(ml * ML_TO_OZ * 10) / 10} oz`;
    }
    return `${ml} ml`;
  };

  const filterLabels: { [key in FilterType]: string } = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>History</Text>

        {/* Filter Dropdown */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <Text style={[styles.filterText, { color: theme.text }]}>{filterLabels[filter]}</Text>
          <Text style={[styles.filterArrow, { color: theme.textSecondary }]}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Dropdown Menu */}
      {showFilterDropdown && (
        <View style={[styles.dropdownMenu, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {(['today', 'week', 'month'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.dropdownItem,
                filter === f && { backgroundColor: theme.accent + '20' },
              ]}
              onPress={() => {
                setFilter(f);
                setShowFilterDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  { color: theme.text },
                  filter === f && { color: theme.accent, fontWeight: '600' },
                ]}
              >
                {filterLabels[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {groupedDrinks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyText, { color: theme.text }]}>No drinks recorded yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Start tracking on Home screen
            </Text>
          </View>
        ) : (
          groupedDrinks.map((group) => (
            <View key={group.date} style={styles.dayGroup}>
              {/* Day Header */}
              <View style={styles.dayHeader}>
                <Text style={[styles.dayTitle, { color: theme.text }]}>
                  {formatDateHeader(group.date)}
                </Text>
                <Text style={[styles.dayTotal, { color: theme.accent }]}>
                  Total: {formatAmount(group.total)}
                </Text>
              </View>

              {/* Drinks */}
              {group.drinks.map((drink) => (
                <SwipeableHistoryItem
                  key={drink.id}
                  drink={drink}
                  formatAmount={formatAmount}
                  onDelete={() => removeDrink(drink.id)}
                  theme={theme}
                />
              ))}
            </View>
          ))
        )}

        {/* Bottom spacing */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Swipeable History Item Component
function SwipeableHistoryItem({
  drink,
  formatAmount,
  onDelete,
  theme,
}: {
  drink: Drink;
  formatAmount: (ml: number) => string;
  onDelete: () => void;
  theme: any;
}) {
  const drinkInfo = getDrinkInfo(drink.type);
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < DELETE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDelete());
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      {/* Delete Background */}
      <View style={[styles.deleteBackground, { backgroundColor: theme.error }]}>
        <Text style={styles.deleteText}>Delete</Text>
      </View>

      {/* Swipeable Item */}
      <Animated.View
        style={[styles.historyItem, { backgroundColor: theme.cardAlt, borderColor: theme.cardBorder, transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.historyIcon,
            { backgroundColor: drinkColors[drink.type] + '20' },
          ]}
        >
          <Text style={styles.historyIconText}>{drinkInfo.icon}</Text>
        </View>
        <View style={styles.historyInfo}>
          <Text style={[styles.historyDrinkName, { color: theme.text }]}>
            {drinkInfo.label} • {formatTime(drink.timestamp)}
          </Text>
        </View>
        <Text style={[styles.historyAmount, { color: theme.text }]}>
          {formatAmount(drink.amount)}
        </Text>
      </Animated.View>
    </View>
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

  // Filter
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.xs,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  filterArrow: {
    fontSize: 10,
  },

  // Dropdown
  dropdownMenu: {
    position: 'absolute',
    top: 100,
    right: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: fontSize.base,
  },

  // Scroll View
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: fontSize.base,
    marginTop: spacing.xs,
  },

  // Day Group
  dayGroup: {
    marginBottom: spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  dayTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  dayTotal: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Swipe Container
  swipeContainer: {
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderRadius: 16,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: spacing.lg,
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: fontSize.sm,
  },

  // History Item
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
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
  historyAmount: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
