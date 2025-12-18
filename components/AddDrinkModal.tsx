import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
} from 'react-native';
import { useTheme } from '@/providers/ThemeContext';
import { DrinkType } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';
import { useHydrateStore, Unit, ML_TO_OZ, OZ_TO_ML } from '@/store/useHydrateStore';

interface AddDrinkModalProps {
  visible: boolean;
  drinkType: DrinkType | null;
  drinkIcon: string;
  drinkLabel: string;
  drinkColor: string;
  onAdd: (amount: number) => void;
  onClose: () => void;
}

const QUICK_AMOUNTS_ML = [100, 200, 250, 500];

export function AddDrinkModal({
  visible,
  drinkType,
  drinkIcon,
  drinkLabel,
  drinkColor,
  onAdd,
  onClose,
}: AddDrinkModalProps) {
  const { theme } = useTheme();
  const { unit, setUnit } = useHydrateStore();
  const [selectedAmount, setSelectedAmount] = useState(250);
  const [customInput, setCustomInput] = useState('');
  const [localUnit, setLocalUnit] = useState<Unit>(unit);
  const [isCustom, setIsCustom] = useState(false);

  // Sync with store unit when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedAmount(250);
      setCustomInput('');
      setLocalUnit(unit);
      setIsCustom(false);
    }
  }, [visible, unit]);

  // Convert ml to oz for display
  const mlToOz = (ml: number): number => {
    return Math.round(ml * ML_TO_OZ * 10) / 10;
  };

  // Convert oz to ml
  const ozToMl = (oz: number): number => {
    return Math.round(oz * OZ_TO_ML);
  };

  // Get display amount based on unit
  const getDisplayAmount = (mlAmount: number): string => {
    if (localUnit === 'oz') {
      return mlToOz(mlAmount).toString();
    }
    return mlAmount.toString();
  };

  // Get quick amounts based on unit
  const getQuickAmounts = (): number[] => {
    if (localUnit === 'oz') {
      return QUICK_AMOUNTS_ML.map((ml) => Math.round(mlToOz(ml) * 10) / 10);
    }
    return QUICK_AMOUNTS_ML;
  };

  // Handle quick amount selection
  const handleQuickSelect = (amount: number) => {
    setIsCustom(false);
    setCustomInput('');
    if (localUnit === 'oz') {
      setSelectedAmount(ozToMl(amount));
    } else {
      setSelectedAmount(amount);
    }
  };

  // Handle custom input change
  const handleCustomInputChange = (text: string) => {
    // Only allow numbers and one decimal point
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filtered;

    setCustomInput(sanitized);
    setIsCustom(true);

    const numValue = parseFloat(sanitized);
    if (!isNaN(numValue) && numValue > 0) {
      if (localUnit === 'oz') {
        setSelectedAmount(ozToMl(numValue));
      } else {
        setSelectedAmount(Math.round(numValue));
      }
    }
  };

  // Handle unit toggle - saves to store
  const handleUnitToggle = (newUnit: Unit) => {
    if (newUnit !== localUnit) {
      setLocalUnit(newUnit);
      setUnit(newUnit); // Save to store!
      // Convert custom input if exists
      if (isCustom && customInput) {
        const numValue = parseFloat(customInput);
        if (!isNaN(numValue)) {
          if (newUnit === 'oz') {
            // Converting from ml to oz
            setCustomInput(mlToOz(numValue).toString());
          } else {
            // Converting from oz to ml
            setCustomInput(Math.round(numValue * OZ_TO_ML).toString());
          }
        }
      }
    }
  };

  const handleAdd = () => {
    Keyboard.dismiss();
    onAdd(selectedAmount);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  // Check if a quick amount is selected
  const isQuickAmountSelected = (amount: number): boolean => {
    if (isCustom) return false;
    if (localUnit === 'oz') {
      return selectedAmount === ozToMl(amount);
    }
    return selectedAmount === amount;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[styles.modalContainer, { backgroundColor: theme.card }]}
          onPress={Keyboard.dismiss}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              Add {drinkLabel} {drinkIcon}
            </Text>
          </View>

          {/* Unit Toggle */}
          <View style={styles.unitToggleContainer}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                { backgroundColor: theme.background, borderColor: theme.border },
                localUnit === 'ml' && { backgroundColor: drinkColor, borderColor: drinkColor },
              ]}
              onPress={() => handleUnitToggle('ml')}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  { color: theme.textSecondary },
                  localUnit === 'ml' && styles.unitButtonTextActive,
                ]}
              >
                ml
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                { backgroundColor: theme.background, borderColor: theme.border },
                localUnit === 'oz' && { backgroundColor: drinkColor, borderColor: drinkColor },
              ]}
              onPress={() => handleUnitToggle('oz')}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  { color: theme.textSecondary },
                  localUnit === 'oz' && styles.unitButtonTextActive,
                ]}
              >
                oz
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickButtonsContainer}>
            {getQuickAmounts().map((amount, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickButton,
                  { borderColor: theme.border, backgroundColor: theme.background },
                  isQuickAmountSelected(amount) && {
                    backgroundColor: drinkColor,
                    borderColor: drinkColor,
                  },
                ]}
                onPress={() => handleQuickSelect(amount)}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    { color: theme.textSecondary },
                    isQuickAmountSelected(amount) && styles.quickButtonTextSelected,
                  ]}
                >
                  {amount} {localUnit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Input */}
          <View style={styles.customInputContainer}>
            <Text style={[styles.customLabel, { color: theme.textSecondary }]}>
              Custom amount:
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.customInput,
                  {
                    borderColor: isCustom ? drinkColor : theme.border,
                    color: theme.text,
                    backgroundColor: theme.background,
                  },
                ]}
                value={customInput}
                onChangeText={handleCustomInputChange}
                placeholder={`Enter ${localUnit}`}
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={[styles.inputUnit, { color: theme.textSecondary }]}>
                {localUnit}
              </Text>
            </View>
          </View>

          {/* Selected Amount Display */}
          <View style={styles.amountDisplay}>
            <Text style={[styles.amountText, { color: drinkColor }]}>
              {getDisplayAmount(selectedAmount)} {localUnit}
            </Text>
            {localUnit === 'oz' && (
              <Text style={[styles.amountSubtext, { color: theme.textSecondary }]}>
                ({selectedAmount} ml)
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: drinkColor }]}
              onPress={handleAdd}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 20,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },

  // Unit Toggle
  unitToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  unitButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
  },
  unitButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },

  // Quick Buttons
  quickButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 75,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  quickButtonTextSelected: {
    color: '#FFFFFF',
  },

  // Custom Input
  customInputContainer: {
    marginBottom: spacing.md,
  },
  customLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
  },
  inputUnit: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    width: 30,
  },

  // Amount Display
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  amountText: {
    fontSize: 40,
    fontWeight: '700',
  },
  amountSubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
