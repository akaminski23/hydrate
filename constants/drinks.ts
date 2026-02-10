// Drink Configuration - Sip Water Tracker
// Premium design with Ionicons

export type DrinkType =
  // FREE drinks
  | 'water'
  | 'coffee'
  | 'tea'
  | 'sparkling'
  // PRO drinks
  | 'collagen'
  | 'boneBroth'
  | 'electrolytes'
  | 'protein'
  | 'herbalTea'
  | 'preworkout';

export interface DrinkConfig {
  type: DrinkType;
  label: string;
  icon: string; // Ionicons name
  color: string; // Works in both light and dark mode
  isPro: boolean;
  hydrationFactor: number; // 1.0 = full hydration
  description?: string; // For PRO drinks tooltip
}

// Colors chosen to work well on both light (#F5F5F5) and dark (#0F1624) backgrounds
// Using medium saturation and brightness for universal compatibility

export const DRINKS: DrinkConfig[] = [
  // ============ FREE DRINKS ============
  {
    type: 'water',
    label: 'Water',
    icon: 'water-outline',
    color: '#0A84FF', // iOS Blue (bright)
    isPro: false,
    hydrationFactor: 1.0,
  },
  {
    type: 'coffee',
    label: 'Coffee',
    icon: 'cafe-outline',
    color: '#AC8E68', // Warm brown (bright)
    isPro: false,
    hydrationFactor: 0.8,
  },
  {
    type: 'tea',
    label: 'Tea',
    icon: 'leaf-outline',
    color: '#30D158', // iOS Green (bright)
    isPro: false,
    hydrationFactor: 0.95,
  },
  {
    type: 'sparkling',
    label: 'Sparkling',
    icon: 'sparkles-outline',
    color: '#64D2FF', // Cyan bright
    isPro: false,
    hydrationFactor: 1.0,
  },

  // ============ PRO DRINKS ============
  {
    type: 'collagen',
    label: 'Collagen',
    icon: 'body-outline',
    color: '#E91E63', // Pink/rose
    isPro: true,
    hydrationFactor: 0.9,
    description: 'Track collagen for joint health',
  },
  {
    type: 'boneBroth',
    label: 'Bone Broth',
    icon: 'flame-outline',
    color: '#FF9800', // Warm orange
    isPro: true,
    hydrationFactor: 0.85,
    description: 'Natural collagen & minerals',
  },
  {
    type: 'electrolytes',
    label: 'Electrolytes',
    icon: 'flash-outline',
    color: '#03A9F4', // Electric blue
    isPro: true,
    hydrationFactor: 1.1,
    description: 'Enhanced hydration & recovery',
  },
  {
    type: 'protein',
    label: 'Protein',
    icon: 'fitness-outline',
    color: '#9C27B0', // Rich purple
    isPro: true,
    hydrationFactor: 0.7,
    description: 'Post-workout recovery shake',
  },
  {
    type: 'herbalTea',
    label: 'Herbal Tea',
    icon: 'flower-outline',
    color: '#8BC34A', // Lime green
    isPro: true,
    hydrationFactor: 0.95,
    description: 'Anti-inflammatory herbs',
  },
  {
    type: 'preworkout',
    label: 'Pre-workout',
    icon: 'pulse-outline',
    color: '#FF5722', // Energy orange
    isPro: true,
    hydrationFactor: 0.6,
    description: 'Energy boost before training',
  },
];

// Helper functions
export const getDrinkByType = (type: DrinkType): DrinkConfig | undefined => {
  return DRINKS.find((d) => d.type === type);
};

export const getFreeDrinks = (): DrinkConfig[] => {
  return DRINKS.filter((d) => !d.isPro);
};

export const getProDrinks = (): DrinkConfig[] => {
  return DRINKS.filter((d) => d.isPro);
};

export const getAllDrinks = (): DrinkConfig[] => {
  return DRINKS;
};

// For backward compatibility with existing code
export const drinkColors: Record<DrinkType, string> = DRINKS.reduce(
  (acc, drink) => {
    acc[drink.type] = drink.color;
    return acc;
  },
  {} as Record<DrinkType, string>
);
