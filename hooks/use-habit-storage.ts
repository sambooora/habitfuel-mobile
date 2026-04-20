import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@habitfuel_habits";

export type HabitCategory = "health" | "productivity" | "personal" | "other";
export const HABIT_CATEGORIES: { key: HabitCategory; label: string }[] = [
  { key: "health", label: "Health" },
  { key: "productivity", label: "Productivity" },
  { key: "personal", label: "Personal" },
  { key: "other", label: "Other" },
];

export interface Habit {
  id: string;
  label: string;
  icon: string;
  iconColor: string;
  background: string;
  category: HabitCategory;
  createdAt: string;
}

export interface HabitStore {
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;
}

export const HABIT_ICON_OPTIONS: { icon: string; label: string }[] = [
  { icon: "water-drop", label: "Water" },
  { icon: "fitness-center", label: "Fitness" },
  { icon: "self-improvement", label: "Meditate" },
  { icon: "menu-book", label: "Read" },
  { icon: "code", label: "Code" },
  { icon: "edit", label: "Write" },
  { icon: "music-note", label: "Music" },
  { icon: "brush", label: "Art" },
  { icon: "local-florist", label: "Nature" },
  { icon: "restaurant", label: "Eat" },
  { icon: "directions-run", label: "Run" },
  { icon: "nightlight-round", label: "Sleep" },
];

export const HABIT_COLOR_OPTIONS: {
  bg: string;
  icon: string;
  bgDark: string;
  iconDark: string;
}[] = [
  { bg: "#E8F3FF", icon: "#2B7BD4", bgDark: "#1A2F44", iconDark: "#5BA3E8" },
  { bg: "#F1EDFF", icon: "#6B4DC7", bgDark: "#2A2044", iconDark: "#9B82E0" },
  { bg: "#FFF1E7", icon: "#C47020", bgDark: "#3A2A14", iconDark: "#E8943E" },
  { bg: "#EAF8F1", icon: "#1A8A55", bgDark: "#142E22", iconDark: "#3DBB7A" },
  { bg: "#FFE8E8", icon: "#D43B3B", bgDark: "#3A1616", iconDark: "#E86A6A" },
  { bg: "#FFE8F5", icon: "#C74D8A", bgDark: "#3A1630", iconDark: "#E07AB0" },
  { bg: "#E4F6F6", icon: "#1A8A8A", bgDark: "#142E2E", iconDark: "#3DBBBB" },
  { bg: "#FFF8E1", icon: "#B8960C", bgDark: "#332C08", iconDark: "#D4B534" },
];

const DEFAULT_HABITS: Omit<Habit, "id" | "createdAt">[] = [
  {
    label: "Water",
    icon: "water-drop",
    iconColor: "#2B7BD4",
    background: "#E8F3FF",
    category: "health",
  },
  {
    label: "Mind",
    icon: "self-improvement",
    iconColor: "#6B4DC7",
    background: "#F1EDFF",
    category: "personal",
  },
  {
    label: "Read",
    icon: "menu-book",
    iconColor: "#C47020",
    background: "#FFF1E7",
    category: "productivity",
  },
  {
    label: "Gym",
    icon: "fitness-center",
    iconColor: "#1A8A55",
    background: "#EAF8F1",
    category: "health",
  },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getDateKey(date?: Date): string {
  const d = date ?? new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekDateKeys(): string[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    keys.push(getDateKey(d));
  }
  return keys;
}

export function getStreakForHabit(
  completions: Record<string, boolean> | undefined,
): number {
  if (!completions) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = getDateKey(today);
  const current = new Date(today);
  if (!completions[todayKey]) {
    current.setDate(current.getDate() - 1);
  }
  let streak = 0;
  while (true) {
    const key = getDateKey(current);
    if (completions[key]) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export const CONSISTENCY_TARGET = 69;

export function getConsistencyStreak(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
): number {
  if (habits.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = getDateKey(today);
  const allDoneToday = habits.every((h) => !!completions[h.id]?.[todayKey]);
  const current = new Date(today);
  if (!allDoneToday) {
    current.setDate(current.getDate() - 1);
  }
  let streak = 0;
  while (true) {
    const key = getDateKey(current);
    const allDone = habits.every((h) => !!completions[h.id]?.[key]);
    if (allDone) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getDailyCompletionRates(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
  days: number = 4,
): number[] {
  if (habits.length === 0) return Array(days).fill(0);
  const rates: number[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getDateKey(d);
    const completed = habits.filter((h) => !!completions[h.id]?.[key]).length;
    rates.push(completed / habits.length);
  }
  return rates;
}

// ─── Persistence helpers ─────────────────────────────────────

async function loadStore(): Promise<HabitStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as HabitStore;
    }
  } catch (e) {
    console.error("[useHabitStorage] Failed to load store:", e);
  }
  const now = new Date().toISOString();
  const seededHabits: Habit[] = DEFAULT_HABITS.map((h) => ({
    ...h,
    id: generateId(),
    createdAt: now,
  }));
  const store: HabitStore = { habits: seededHabits, completions: {} };
  await saveStore(store);
  return store;
}

async function saveStore(store: HabitStore): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error("[useHabitStorage] Failed to save store:", e);
  }
}

// ─── Context ─────────────────────────────────────────────────

interface HabitStorageContextValue {
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;
  isLoading: boolean;
  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => Promise<void>;
  updateHabit: (
    id: string,
    partial: Partial<Omit<Habit, "id" | "createdAt">>,
  ) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, dateKey?: string) => Promise<void>;
  isCompletedToday: (habitId: string) => boolean;
  getWeekProgress: (habitId: string) => boolean[];
  getStreak: (habitId: string) => number;
  consistencyStreak: number;
  consistencyPercent: number;
  dailyRates: number[];
  reload: () => Promise<void>;
}

const HabitStorageContext = createContext<HabitStorageContextValue | null>(
  null,
);

// ─── Provider ────────────────────────────────────────────────

export function HabitStorageProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const store = await loadStore();
      setHabits(store.habits);
      setCompletions(store.completions);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    async (
      nextHabits: Habit[],
      nextCompletions: Record<string, Record<string, boolean>>,
    ) => {
      setHabits(nextHabits);
      setCompletions(nextCompletions);
      await saveStore({ habits: nextHabits, completions: nextCompletions });
    },
    [habits, completions],
  );

  const addHabit = useCallback(
    async (habit: Omit<Habit, "id" | "createdAt">) => {
      const newHabit: Habit = {
        ...habit,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      const next = [...habits, newHabit];
      await persist(next, completions);
    },
    [habits, completions, persist],
  );

  const updateHabit = useCallback(
    async (id: string, partial: Partial<Omit<Habit, "id" | "createdAt">>) => {
      const next = habits.map((h) => (h.id === id ? { ...h, ...partial } : h));
      await persist(next, completions);
    },
    [habits, completions, persist],
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      const next = habits.filter((h) => h.id !== id);
      const nextCompletions = { ...completions };
      delete nextCompletions[id];
      await persist(next, nextCompletions);
    },
    [habits, completions, persist],
  );

  const toggleCompletion = useCallback(
    async (habitId: string, dateKey?: string) => {
      const key = dateKey ?? getDateKey();
      const habitCompletions = completions[habitId] ?? {};
      const updated = { ...habitCompletions };
      if (updated[key]) {
        delete updated[key];
      } else {
        updated[key] = true;
      }
      const nextCompletions = { ...completions, [habitId]: updated };
      await persist(habits, nextCompletions);
    },
    [habits, completions, persist],
  );

  const isCompletedToday = useCallback(
    (habitId: string): boolean => {
      const todayKey = getDateKey();
      return !!completions[habitId]?.[todayKey];
    },
    [completions],
  );

  const getWeekProgress = useCallback(
    (habitId: string): boolean[] => {
      const weekKeys = getWeekDateKeys();
      const habitCompletions = completions[habitId] ?? {};
      return weekKeys.map((k) => !!habitCompletions[k]);
    },
    [completions],
  );

  const getStreak = useCallback(
    (habitId: string): number => {
      return getStreakForHabit(completions[habitId]);
    },
    [completions],
  );

  const consistencyStreak = useMemo(
    () => getConsistencyStreak(habits, completions),
    [habits, completions],
  );

  const consistencyPercent = useMemo(
    () =>
      CONSISTENCY_TARGET > 0
        ? Math.min(
            100,
            Math.round((consistencyStreak / CONSISTENCY_TARGET) * 100),
          )
        : 0,
    [consistencyStreak],
  );

  const dailyRates = useMemo(
    () => getDailyCompletionRates(habits, completions, 4),
    [habits, completions],
  );

  const value = useMemo<HabitStorageContextValue>(
    () => ({
      habits,
      completions,
      isLoading,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleCompletion,
      isCompletedToday,
      getWeekProgress,
      getStreak,
      consistencyStreak,
      consistencyPercent,
      dailyRates,
      reload,
    }),
    [
      habits,
      completions,
      isLoading,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleCompletion,
      isCompletedToday,
      getWeekProgress,
      getStreak,
      consistencyStreak,
      consistencyPercent,
      dailyRates,
      reload,
    ],
  );

  return createElement(HabitStorageContext.Provider, { value }, children);
}

// ─── Hook ────────────────────────────────────────────────────

export function useHabitStorage(): HabitStorageContextValue {
  const ctx = useContext(HabitStorageContext);
  if (!ctx) {
    throw new Error(
      "useHabitStorage must be used inside <HabitStorageProvider>",
    );
  }
  return ctx;
}
