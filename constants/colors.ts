// Water Theme - Hydrate App 💧

export const lightTheme = {
  background: '#F2F2F7',        // iOS light background
  card: '#FFFFFF',
  cardDark: '#FFFFFF',
  cardAlt: '#FFFFFF',
  cardBorder: '#E5E5EA',        // iOS separator
  accent: '#007AFF',            // Apple blue
  accentLight: '#5AC8FA',
  text: '#000000',
  textSecondary: '#8E8E93',     // iOS secondary
  success: '#34C759',           // iOS green
  border: '#E5E5EA',
  error: '#FF3B30',             // iOS red
  gaugeTrack: '#E5E5EA',
  gaugeProgress: '#007AFF',     // Apple blue
  gaugeTicks: '#C7C7CC',
  premium: '#FFD700',           // gold for Pro
} as const;

export const darkTheme = {
  background: '#000000',        // Pure black (OLED)
  card: '#1C1C1E',              // elevated surface
  cardDark: '#1C1C1E',          // gauge card
  cardAlt: '#1C1C1E',           // history items
  cardBorder: '#2C2C2E',        // subtle border for cards
  accent: '#007AFF',            // Apple blue
  accentLight: '#5AC8FA',       // lighter accent
  text: '#FFFFFF',
  textSecondary: '#8E8E93',     // iOS secondary text
  success: '#34C759',           // iOS green
  border: '#2C2C2E',            // iOS separator
  error: '#FF453A',             // iOS red
  gaugeTrack: '#2C2C2E',        // subtle track
  gaugeProgress: '#007AFF',     // Apple blue
  gaugeTicks: '#3A3A3C',        // subtle ticks
  premium: '#FFD700',           // gold for Pro
} as const;

export type ThemeColors = {
  background: string;
  card: string;
  cardDark: string;
  cardAlt: string;
  cardBorder: string;
  accent: string;
  accentLight: string;
  text: string;
  textSecondary: string;
  success: string;
  border: string;
  error: string;
  gaugeTrack: string;
  gaugeProgress: string;
  gaugeTicks: string;
  premium: string;
};

// Default export for backward compatibility (will be replaced by context)
export const colors = lightTheme;

// DrinkType and drinkColors are now in constants/drinks.ts
// Re-export for backward compatibility
export { DrinkType, drinkColors } from './drinks';
