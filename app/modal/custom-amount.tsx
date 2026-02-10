import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeContext';
import { getDrinkByType, DrinkType } from '@/constants/drinks';
import { useHydrateStore } from '@/store/useHydrateStore';
import { spacing, fontSize } from '@/constants/spacing';

// Picker values: 50-1000ml, step 50
const PICKER_VALUES = Array.from({ length: 20 }, (_, i) => (i + 1) * 50);

export default function CustomAmountModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const { drinkType } = useLocalSearchParams<{ drinkType: string }>();
  const { addDrink, getTotalMl, unit } = useHydrateStore();

  const [selectedAmount, setSelectedAmount] = useState(250);

  const drink = drinkType ? getDrinkByType(drinkType as DrinkType) : null;
  const totalToday = getTotalMl();

  // Format total based on unit
  const totalFormatted = unit === 'oz'
    ? `${Math.round(totalToday * 0.033814)} oz`
    : `${totalToday} ml`;

  const handleValueChange = (value: number) => {
    setSelectedAmount(value);
    Haptics.selectionAsync();
  };

  const handleCancel = () => {
    router.back();
  };

  const handleAdd = async () => {
    if (drink) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addDrink(drink.type, selectedAmount);
    }
    router.back();
  };

  if (!drink) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      {/* iOS-style Navigation Bar */}
      <View style={[styles.navBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.navButton}>
          <Text style={[styles.cancelText, { color: theme.accent }]}>Cancel</Text>
        </TouchableOpacity>

        <Text style={[styles.navTitle, { color: theme.text }]}>
          Add {drink.label}
        </Text>

        <TouchableOpacity onPress={handleAdd} style={styles.navButton}>
          <Text style={[styles.addText, { color: theme.accent }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Picker Container */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedAmount}
          onValueChange={handleValueChange}
          style={styles.picker}
          itemStyle={[styles.pickerItem, { color: theme.text }]}
        >
          {PICKER_VALUES.map((val) => (
            <Picker.Item key={val} label={`${val} ml`} value={val} />
          ))}
        </Picker>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
          Total today: {totalFormatted}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Navigation Bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navButton: {
    minWidth: 60,
    paddingVertical: spacing.xs,
  },
  cancelText: {
    fontSize: fontSize.base,
    fontWeight: '400',
  },
  navTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  addText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Picker
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  picker: {
    width: '100%',
  },
  pickerItem: {
    fontSize: 22,
    fontWeight: '500',
  },

  // Summary
  summaryContainer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: fontSize.sm,
  },
});
