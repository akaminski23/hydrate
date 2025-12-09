import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Generate hours (1-12 for 12h format)
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
// Generate minutes (00, 15, 30, 45)
const MINUTES = [0, 15, 30, 45];
// AM/PM options
const PERIODS = ['AM', 'PM'];

interface TimePickerProps {
  visible: boolean;
  value: string; // "HH:MM" format (24h)
  onConfirm: (time: string) => void;
  onCancel: () => void;
  title?: string;
}

// Convert 24h time string to 12h components
const parse24hTo12h = (time: string): { hour: number; minute: number; period: 'AM' | 'PM' } => {
  const [hours24, minutes] = time.split(':').map(Number);
  const period = hours24 >= 12 ? 'PM' : 'AM';
  let hour = hours24 % 12;
  if (hour === 0) hour = 12;

  // Round minutes to nearest 15
  const roundedMinute = Math.round(minutes / 15) * 15;
  const finalMinute = roundedMinute === 60 ? 0 : roundedMinute;

  return { hour, minute: finalMinute, period };
};

// Convert 12h components to 24h time string
const convert12hTo24h = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
  let hours24 = hour;
  if (period === 'AM' && hour === 12) {
    hours24 = 0;
  } else if (period === 'PM' && hour !== 12) {
    hours24 = hour + 12;
  }
  return `${hours24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export function TimePicker({ visible, value, onConfirm, onCancel, title = 'Select Time' }: TimePickerProps) {
  const parsed = parse24hTo12h(value);

  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(parsed.period);

  // Key to force remount WheelPickers when modal opens
  const [pickerKey, setPickerKey] = useState(0);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      const newParsed = parse24hTo12h(value);
      setSelectedHour(newParsed.hour);
      setSelectedMinute(newParsed.minute);
      setSelectedPeriod(newParsed.period);
      // Force remount to reset scroll positions
      setPickerKey(prev => prev + 1);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    const time24h = convert12hTo24h(selectedHour, selectedMinute, selectedPeriod);
    onConfirm(time24h);
  };

  const handleHourScroll = (index: number) => {
    if (index >= 0 && index < HOURS_12.length) {
      setSelectedHour(HOURS_12[index]);
    }
  };

  const handleMinuteScroll = (index: number) => {
    if (index >= 0 && index < MINUTES.length) {
      setSelectedMinute(MINUTES[index]);
    }
  };

  const handlePeriodScroll = (index: number) => {
    if (index >= 0 && index < PERIODS.length) {
      setSelectedPeriod(PERIODS[index] as 'AM' | 'PM');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Picker Wheels */}
          <View style={styles.pickerContainer}>
            {/* Selection Highlight */}
            <View style={styles.selectionHighlight} pointerEvents="none" />

            {/* Hour Wheel */}
            <View style={styles.wheelContainer}>
              <WheelPicker
                key={`hour-${pickerKey}`}
                data={HOURS_12}
                selectedValue={selectedHour}
                onScroll={handleHourScroll}
                formatValue={(v) => v.toString()}
                initialIndex={HOURS_12.indexOf(selectedHour)}
              />
            </View>

            {/* Separator */}
            <Text style={styles.separator}>:</Text>

            {/* Minute Wheel */}
            <View style={styles.wheelContainer}>
              <WheelPicker
                key={`minute-${pickerKey}`}
                data={MINUTES}
                selectedValue={selectedMinute}
                onScroll={handleMinuteScroll}
                formatValue={(v) => v.toString().padStart(2, '0')}
                initialIndex={MINUTES.indexOf(selectedMinute)}
              />
            </View>

            {/* Period Wheel */}
            <View style={styles.periodContainer}>
              <WheelPicker
                key={`period-${pickerKey}`}
                data={PERIODS}
                selectedValue={selectedPeriod}
                onScroll={handlePeriodScroll}
                formatValue={(v) => String(v)}
                initialIndex={PERIODS.indexOf(selectedPeriod)}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Wheel Picker Component
interface WheelPickerProps {
  data: (number | string)[];
  selectedValue: number | string;
  onScroll: (index: number) => void;
  formatValue: (value: number | string) => string;
  initialIndex: number;
}

const WheelPicker = ({ data, selectedValue, onScroll, formatValue, initialIndex }: WheelPickerProps) => {
  const flatListRef = useRef<FlatList>(null);
  const lastIndexRef = useRef<number>(initialIndex);

  // Scroll to initial position on mount
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < data.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 50);
    }
  }, []);

  // Add padding items for scroll effect
  const paddedData = ['', '', ...data, '', ''];

  // Handle scroll with haptic feedback
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newIndex = Math.round(offsetY / ITEM_HEIGHT);

    // Trigger haptic when index changes
    if (newIndex !== lastIndexRef.current && newIndex >= 0 && newIndex < data.length) {
      lastIndexRef.current = newIndex;
      Haptics.selectionAsync();
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    onScroll(index);
  };

  const handleItemPress = (index: number) => {
    // Adjust for padding
    const actualIndex = index - 2;
    if (actualIndex >= 0 && actualIndex < data.length) {
      Haptics.selectionAsync();
      flatListRef.current?.scrollToIndex({ index: actualIndex, animated: true });
      onScroll(actualIndex);
    }
  };

  const renderItem = ({ item, index }: { item: number | string; index: number }) => {
    const actualIndex = index - 2;
    const isSelected = item === selectedValue;
    const isEmpty = item === '';

    return (
      <TouchableOpacity
        style={styles.wheelItem}
        onPress={() => !isEmpty && handleItemPress(index)}
        disabled={isEmpty}
      >
        <Text
          style={[
            styles.wheelItemText,
            isSelected && styles.wheelItemTextSelected,
            isEmpty && styles.wheelItemTextEmpty,
          ]}
        >
          {isEmpty ? '' : formatValue(item)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={paddedData}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item}-${index}`}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onMomentumScrollEnd={handleScrollEnd}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      style={styles.wheelList}
      contentContainerStyle={styles.wheelListContent}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  cancelText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  doneText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.accent,
  },

  // Picker Container
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: PICKER_HEIGHT,
    paddingHorizontal: spacing.lg,
  },
  selectionHighlight: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    backgroundColor: colors.accent + '15',
    borderRadius: 12,
  },
  wheelContainer: {
    width: 70,
    height: PICKER_HEIGHT,
  },
  periodContainer: {
    width: 60,
    height: PICKER_HEIGHT,
    marginLeft: spacing.sm,
  },
  separator: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: spacing.xs,
  },

  // Wheel List
  wheelList: {
    height: PICKER_HEIGHT,
  },
  wheelListContent: {
    // No extra padding needed since we add empty items
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  wheelItemTextSelected: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.accent,
  },
  wheelItemTextEmpty: {
    color: 'transparent',
  },
});
