// Water Theme - Hydrate App 💧
// Light Mode (from Figma design)
export const colors = {
  background: '#F5F5F5',      // light gray background
  card: '#FFFFFF',            // white cards
  accent: '#2D9CDB',          // water blue from Figma
  accentLight: '#56CCF2',     // lighter blue for gradient
  text: '#1A1A2E',            // dark text
  textSecondary: '#828282',   // gray secondary text
  success: '#27AE60',         // green for goal reached
  border: '#E0E0E0',          // light border
  error: '#EB5757',
  // Gauge specific colors
  gaugeTrack: '#E8F4FD',      // light blue track background
  gaugeProgress: '#2D9CDB',   // blue progress
  gaugeTicks: '#BDBDBD',      // gray tick marks
} as const;

// Kolory napojów dla sylwetki
export const drinkColors = {
  water: '#00BFFF',   // niebieski
  coffee: '#8B4513', // brązowy
  tea: '#90EE90',    // zielony
  juice: '#FFA500',  // pomarańczowy
} as const;

export type DrinkType = keyof typeof drinkColors;
