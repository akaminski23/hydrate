import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrinkType } from '@/constants/colors';

// Helper: get today's date as YYYY-MM-DD
const getTodayDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Helper: generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export interface Drink {
  id: string;
  type: DrinkType;
  amount: number; // Always stored in ml
  timestamp: number;
}

export type Unit = 'ml' | 'oz';
export type ReminderInterval = 1 | 2 | 3 | 4;

// Conversion constants
export const ML_TO_OZ = 0.033814;
export const OZ_TO_ML = 29.5735;

interface HydrateState {
  // Data
  drinks: Drink[]; // All drinks (history)
  dailyGoal: number;
  lastDate: string;
  unit: Unit; // User's preferred unit
  remindersEnabled: boolean;
  reminderStartTime: string; // HH:MM format
  reminderEndTime: string; // HH:MM format
  reminderInterval: ReminderInterval; // hours

  // Actions
  addDrink: (type: DrinkType, amount: number) => void;
  removeDrink: (id: string) => void;
  getTodayDrinks: () => Drink[];
  getTotalMl: () => number;
  getPercentage: () => number;
  reset: () => void;
  setUnit: (unit: Unit) => void;
  setDailyGoal: (goal: number) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setReminderStartTime: (time: string) => void;
  setReminderEndTime: (time: string) => void;
  setReminderInterval: (interval: ReminderInterval) => void;

  // Helpers for unit conversion
  formatAmount: (ml: number) => string;
  formatGoal: () => string;
}

export const useHydrateStore = create<HydrateState>()(
  persist(
    (set, get) => ({
      drinks: [],
      dailyGoal: 3000,
      lastDate: getTodayDate(),
      unit: 'ml' as Unit,
      remindersEnabled: false,
      reminderStartTime: '08:00',
      reminderEndTime: '22:00',
      reminderInterval: 2 as ReminderInterval,

      addDrink: (type: DrinkType, amount: number) => {
        const newDrink: Drink = {
          id: generateId(),
          type,
          amount,
          timestamp: Date.now(),
        };

        set((state) => ({
          drinks: [...state.drinks, newDrink],
          lastDate: getTodayDate(),
        }));
      },

      removeDrink: (id: string) => {
        set((state) => ({
          drinks: state.drinks.filter((drink) => drink.id !== id),
        }));
      },

      getTodayDrinks: () => {
        const { drinks } = get();
        const today = getTodayDate();
        return drinks.filter((drink) => {
          const drinkDate = new Date(drink.timestamp).toISOString().split('T')[0];
          return drinkDate === today;
        });
      },

      getTotalMl: () => {
        const todayDrinks = get().getTodayDrinks();
        return todayDrinks.reduce((sum, drink) => sum + drink.amount, 0);
      },

      getPercentage: () => {
        const { dailyGoal } = get();
        const total = get().getTotalMl();
        return Math.min(100, (total / dailyGoal) * 100);
      },

      reset: () => {
        // Reset only today's drinks
        const { drinks } = get();
        const today = getTodayDate();
        const filteredDrinks = drinks.filter((drink) => {
          const drinkDate = new Date(drink.timestamp).toISOString().split('T')[0];
          return drinkDate !== today;
        });
        set({
          drinks: filteredDrinks,
          lastDate: getTodayDate(),
        });
      },

      setUnit: (unit: Unit) => {
        set({ unit });
      },

      setDailyGoal: (goal: number) => {
        // Clamp between 2000 and 4000
        const clampedGoal = Math.max(2000, Math.min(4000, goal));
        set({ dailyGoal: clampedGoal });
      },

      setRemindersEnabled: (enabled: boolean) => {
        set({ remindersEnabled: enabled });
      },

      setReminderStartTime: (time: string) => {
        set({ reminderStartTime: time });
      },

      setReminderEndTime: (time: string) => {
        set({ reminderEndTime: time });
      },

      setReminderInterval: (interval: ReminderInterval) => {
        set({ reminderInterval: interval });
      },

      formatAmount: (ml: number) => {
        const { unit } = get();
        if (unit === 'oz') {
          const oz = Math.round(ml * ML_TO_OZ * 10) / 10;
          return `${oz} oz`;
        }
        return `${ml} ml`;
      },

      formatGoal: () => {
        const { dailyGoal, unit } = get();
        if (unit === 'oz') {
          const oz = Math.round(dailyGoal * ML_TO_OZ);
          return `/${oz} oz`;
        }
        return `/${dailyGoal} ml`;
      },
    }),
    {
      name: 'hydrate-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Migration: Fix invalid reminderInterval (0 is no longer valid)
        if (persistedState && (persistedState.reminderInterval === 0 || persistedState.reminderInterval < 1 || persistedState.reminderInterval > 4)) {
          persistedState.reminderInterval = 2; // Default to 2h
        }
        return persistedState;
      },
    }
  )
);
