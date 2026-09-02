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
export const HABIT_CATEGORIES: {
  key: HabitCategory;
  label: string;
}[] = [
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
  {
    bg: "#E8F3FF",
    icon: "#2B7BD4",
    bgDark: "#1A2F44",
    iconDark: "#5BA3E8",
  },
  {
    bg: "#F1EDFF",
    icon: "#6B4DC7",
    bgDark: "#2A2044",
    iconDark: "#9B82E0",
  },
  {
    bg: "#FFF1E7",
    icon: "#C47020",
    bgDark: "#3A2A14",
    iconDark: "#E8943E",
  },
  {
    bg: "#EAF8F1",
    icon: "#1A8A55",
    bgDark: "#142E22",
    iconDark: "#3DBB7A",
  },
  {
    bg: "#FFE8E8",
    icon: "#D43B3B",
    bgDark: "#3A1616",
    iconDark: "#E86A6A",
  },
  {
    bg: "#FFE8F5",
    icon: "#C74D8A",
    bgDark: "#3A1630",
    iconDark: "#E07AB0",
  },
  {
    bg: "#E4F6F6",
    icon: "#1A8A8A",
    bgDark: "#142E2E",
    iconDark: "#3DBBBB",
  },
  {
    bg: "#FFF8E1",
    icon: "#B8960C",
    bgDark: "#332C08",
    iconDark: "#D4B534",
  },
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

const MS_PER_DAY = 86_400_000;

export function getDateKey(date?: Date): string {
  const d = date ?? new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
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
  const today = startOfDay(new Date());
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

// ─── Heatmap ─────────────────────────────────────────────────

/** Weeks rendered on a single habit card. */
export const HABIT_HEATMAP_WEEKS = 13;
/** Weeks rendered on the "all habits" overview heatmap (~1 month). */
export const OVERALL_HEATMAP_WEEKS = 5;

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatmapCell {
  dateKey: string;
  date: Date;
  /** 0 = nothing done, 4 = fully done / deep into a streak. */
  level: HeatmapLevel;
  completed: number;
  total: number;
  /** False for dates before the habit existed — rendered as a blank slot. */
  inRange: boolean;
  isFuture: boolean;
  isToday: boolean;
}

/**
 * Builds a GitHub-style grid: `weeks` columns of 7 days, Monday-first, ending
 * on the Sunday of the current week. Days after today are kept so the last
 * column keeps its full height — they are flagged `isFuture`.
 */
export function buildWeekGrid(weeks: number): Date[] {
  const today = startOfDay(new Date());
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const end = addDays(today, daysUntilSunday);
  const start = addDays(end, -(weeks * 7 - 1));
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
}

/** Longer runs get a darker square, mirroring GitHub's intensity ramp. */
function levelFromRun(run: number): HeatmapLevel {
  if (run <= 0) return 0;
  if (run === 1) return 2;
  if (run <= 4) return 3;
  return 4;
}

function levelFromRatio(completed: number, total: number): HeatmapLevel {
  if (completed <= 0 || total <= 0) return 0;
  const ratio = completed / total;
  if (ratio >= 1) return 4;
  if (ratio >= 0.66) return 3;
  if (ratio >= 0.34) return 2;
  return 1;
}

/** Consecutive completed days immediately preceding `date` (capped). */
function runBefore(
  habitCompletions: Record<string, boolean>,
  date: Date,
): number {
  let run = 0;
  let cursor = addDays(date, -1);
  while (run < 90 && habitCompletions[getDateKey(cursor)]) {
    run++;
    cursor = addDays(cursor, -1);
  }
  return run;
}

export function getHabitHeatmap(
  habit: Habit,
  habitCompletions: Record<string, boolean> | undefined,
  weeks: number = HABIT_HEATMAP_WEEKS,
): HeatmapCell[] {
  const done = habitCompletions ?? {};
  const grid = buildWeekGrid(weeks);
  const today = startOfDay(new Date());
  const todayKey = getDateKey(today);
  const createdAt = startOfDay(new Date(habit.createdAt));

  // Seed the run counter with history that falls outside the visible grid, so
  // the leftmost column doesn't restart the intensity ramp from scratch.
  let run = runBefore(done, grid[0]);

  return grid.map((date) => {
    const dateKey = getDateKey(date);
    const isDone = !!done[dateKey];
    run = isDone ? run + 1 : 0;
    return {
      dateKey,
      date,
      level: levelFromRun(run),
      completed: isDone ? 1 : 0,
      total: 1,
      inRange: date >= createdAt,
      isFuture: date > today,
      isToday: dateKey === todayKey,
    };
  });
}

export function getOverallHeatmap(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
  weeks: number = OVERALL_HEATMAP_WEEKS,
): HeatmapCell[] {
  const grid = buildWeekGrid(weeks);
  const today = startOfDay(new Date());
  const todayKey = getDateKey(today);
  const created = habits.map((h) => startOfDay(new Date(h.createdAt)));

  return grid.map((date) => {
    const dateKey = getDateKey(date);
    let total = 0;
    let completed = 0;
    habits.forEach((habit, i) => {
      if (created[i] > date) return;
      total++;
      if (completions[habit.id]?.[dateKey]) completed++;
    });
    return {
      dateKey,
      date,
      level: levelFromRatio(completed, total),
      completed,
      total,
      inRange: total > 0,
      isFuture: date > today,
      isToday: dateKey === todayKey,
    };
  });
}

// ─── Stats ───────────────────────────────────────────────────

export interface HabitStats {
  /** Current streak, in days. */
  current: number;
  /** All-time longest streak, in days. */
  best: number;
  /** Total completed days. */
  total: number;
  /** Completion rate since the habit was created, 0-100. */
  rate: number;
}

export function getHabitStats(
  habit: Habit,
  habitCompletions: Record<string, boolean> | undefined,
): HabitStats {
  const done = habitCompletions ?? {};
  const keys = Object.keys(done)
    .filter((k) => done[k])
    .sort();

  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of keys) {
    const date = startOfDay(new Date(`${key}T00:00:00`));
    const isConsecutive =
      prev !== null &&
      Math.round((date.getTime() - prev.getTime()) / MS_PER_DAY) === 1;
    run = isConsecutive ? run + 1 : 1;
    if (run > best) best = run;
    prev = date;
  }

  const today = startOfDay(new Date());
  const createdAt = startOfDay(new Date(habit.createdAt));
  const daysTracked = Math.max(
    1,
    Math.round((today.getTime() - createdAt.getTime()) / MS_PER_DAY) + 1,
  );

  return {
    current: getStreakForHabit(done),
    best,
    total: keys.length,
    rate: Math.min(100, Math.round((keys.length / daysTracked) * 100)),
  };
}

export const CONSISTENCY_TARGET = 69;

/**
 * Rolling completion rate (0-100) over the last `window` days.
 *
 * Unlike an all-or-nothing streak, missing a single habit only nudges the
 * score down instead of resetting it to zero. Days before a habit existed are
 * not counted against it.
 */
export function getConsistencyRate(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
  window: number = CONSISTENCY_TARGET,
): number {
  if (habits.length === 0) return 0;
  const today = startOfDay(new Date());
  const created = habits.map((h) => startOfDay(new Date(h.createdAt)));

  let sum = 0;
  let counted = 0;
  for (let i = 0; i < window; i++) {
    const date = addDays(today, -i);
    const dateKey = getDateKey(date);
    let total = 0;
    let completed = 0;
    habits.forEach((habit, idx) => {
      if (created[idx] > date) return;
      total++;
      if (completions[habit.id]?.[dateKey]) completed++;
    });
    if (total === 0) continue;
    sum += completed / total;
    counted++;
  }

  if (counted === 0) return 0;
  return Math.round((sum / counted) * 100);
}

/**
 * Consecutive days on which *at least one* habit was completed. Momentum
 * survives an off-day on any single habit.
 */
export function getActiveDaysStreak(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
): number {
  if (habits.length === 0) return 0;
  const today = startOfDay(new Date());
  const hasAny = (date: Date) => {
    const key = getDateKey(date);
    return habits.some((h) => !!completions[h.id]?.[key]);
  };

  let cursor = hasAny(today) ? today : addDays(today, -1);
  let streak = 0;
  while (hasAny(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
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
  getStats: (habitId: string) => HabitStats;
  getHeatmap: (habitId: string, weeks?: number) => HeatmapCell[];
  overallHeatmap: HeatmapCell[];
  activeDaysStreak: number;
  consistencyPercent: number;
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
      await saveStore({
        habits: nextHabits,
        completions: nextCompletions,
      });
    },
    [],
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

  const getStats = useCallback(
    (habitId: string): HabitStats => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return { current: 0, best: 0, total: 0, rate: 0 };
      return getHabitStats(habit, completions[habitId]);
    },
    [habits, completions],
  );

  const getHeatmap = useCallback(
    (habitId: string, weeks: number = HABIT_HEATMAP_WEEKS): HeatmapCell[] => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return [];
      return getHabitHeatmap(habit, completions[habitId], weeks);
    },
    [habits, completions],
  );

  const overallHeatmap = useMemo(
    () => getOverallHeatmap(habits, completions, OVERALL_HEATMAP_WEEKS),
    [habits, completions],
  );

  const activeDaysStreak = useMemo(
    () => getActiveDaysStreak(habits, completions),
    [habits, completions],
  );

  const consistencyPercent = useMemo(
    () => getConsistencyRate(habits, completions, CONSISTENCY_TARGET),
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
      getStats,
      getHeatmap,
      overallHeatmap,
      activeDaysStreak,
      consistencyPercent,
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
      getStats,
      getHeatmap,
      overallHeatmap,
      activeDaysStreak,
      consistencyPercent,
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
