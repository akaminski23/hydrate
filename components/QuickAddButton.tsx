import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeContext';
import { spacing, fontSize } from '@/constants/spacing';

interface QuickAddButtonProps {
  icon: string;
  label: string;
  color: string;
  isLocked?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function QuickAddButton({
  icon,
  label,
  color,
  isLocked = false,
  onPress,
  onLongPress,
}: QuickAddButtonProps) {
  const { theme } = useTheme();

  const handlePress = async () => {
    // Light haptic on tap
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleLongPress = async () => {
    if (onLongPress) {
      // Heavy haptic on long press
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onLongPress();
    }
  };

  // PRO icons: muted gray, no lock badge
  const iconColor = isLocked ? theme.textSecondary : color;
  const bgColor = isLocked ? theme.card : color + '25'; // 25% opacity
  const borderColor = isLocked ? theme.cardBorder : color + '40';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: bgColor, borderColor },
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      {/* Icon - same size for all */}
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={28} color={iconColor} />
      </View>

      {/* Label */}
      <Text
        style={[
          styles.label,
          { color: isLocked ? theme.textSecondary : theme.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Min 44x44 hit target is satisfied
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
