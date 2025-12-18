// Water Theme - Hydrate App 💧

export const lightTheme = {
  background: '#F5F5F5',
  card: '#FFFFFF',
  cardDark: '#FFFFFF',
  cardAlt: '#FFFFFF',
  cardBorder: 'transparent',
  accent: '#2D9CDB',
  accentLight: '#56CCF2',
  text: '#1A1A2E',
  textSecondary: '#828282',
  success: '#27AE60',
  border: '#E0E0E0',
  error: '#EB5757',
  gaugeTrack: '#E8F4FD',
  gaugeProgress: '#2D9CDB',
  gaugeTicks: '#BDBDBD',
  premium: '#FFD700',        // złoty dla Pro button
} as const;

export const darkTheme = {
  background: '#0F1624',        // deep navy
  card: '#1A2332',              // lighter navy (settings cards)
  cardDark: '#101823',          // ciemniejsze tło gauge (bliżej background)
  cardAlt: '#1A2332',           // jaśniejsze (history items)
  cardBorder: 'rgba(74, 144, 217, 0.2)', // subtle blue border
  accent: '#4A90D9',            // główny niebieski (gauge arc)
  accentLight: '#6BA3E0',       // jaśniejszy akcent
  text: '#FFFFFF',
  textSecondary: '#8E9BB3',     // szaro-niebieski
  success: '#4CD964',
  border: '#2A3444',            // navy border
  error: '#FF453A',
  gaugeTrack: '#1E2A3D',        // ciemniejszy navy dla gauge track
  gaugeProgress: '#4A90D9',     // ten sam niebieski co accent
  gaugeTicks: '#3A4A5E',        // navy-gray dla ticków
  premium: '#FFD700',           // złoty dla Pro button
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

// Kolory napojów dla sylwetki
export const drinkColors = {
  water: '#00BFFF',   // niebieski
  coffee: '#8B4513', // brązowy
  tea: '#90EE90',    // zielony
  juice: '#FFA500',  // pomarańczowy
} as const;

export type DrinkType = keyof typeof drinkColors;
