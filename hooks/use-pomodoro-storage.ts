import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@habitfuel_pomodoro";

export type PomodoroPhase = "focus" | "short_break" | "long_break";

export interface PomodoroSettings {
  focusDuration: number; // minutes (editable)
  // short/long break durations are fixed constants in the app:
  // short break = 2 minutes, long break = 5 minutes
  shortBreakDuration: number; // minutes (static - not editable)
  longBreakDuration: number; // minutes (static - not editable)
  sessionsBeforeLongBreak: number;
  requiredSessions: number; // global default # of focus sessions required to complete a task
}

export interface TaskPomodoroRecord {
  taskId: string;
  completedSessions: number; // total completed focus sessions for this task
  requiredSessions: number; // how many sessions needed to unlock "done"
  lastSessionAt?: string; // ISO string
}

export interface PomodoroStore {
  settings: PomodoroSettings;
  records: Record<string, TaskPomodoroRecord>;
}

/**
 * Application defaults:
 * - Focus duration default: 5 minutes
 * - Required sessions default: 2 sessions
 */
export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 5,
  // enforce static break durations here
  shortBreakDuration: 2, // static short break (2 minutes)
  longBreakDuration: 5, // static long break (5 minutes)
  sessionsBeforeLongBreak: 4,
  requiredSessions: 2,
};

const DEFAULT_STORE: PomodoroStore = {
  settings: DEFAULT_SETTINGS,
  records: {},
};

/**
 * Priority-based mapping kept for legacy behavior / overrides for certain priorities.
 * Note: For typical tasks the store.settings.requiredSessions is used as authoritative
 * default when creating records; this function is only a fallback for priority-specific rules.
 */
export function getRequiredSessions(priority: string): number {
  switch (priority) {
    case "urgent":
      return 4;
    case "high":
      return 2;
    default:
      return 1;
  }
}

/** Returns true if the task qualifies as a "focus task" that needs pomodoro */
export function isFocusTask(priority: string): boolean {
  return priority === "urgent" || priority === "high";
}

/**
 * Hook: usePomodoroStorage
 * - Persists pomodoro settings and per-task records in AsyncStorage.
 * - Exposes helpers to read/update settings and record completed focus sessions.
 */
export function usePomodoroStorage() {
  const [store, setStore] = useState<PomodoroStore>(DEFAULT_STORE);
  const [isLoading, setIsLoading] = useState(true);

  // Load from AsyncStorage and merge with defaults
  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PomodoroStore = JSON.parse(raw);
        const mergedSettings: PomodoroSettings = {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings ?? {}),
        };
        setStore({
          settings: mergedSettings,
          records: parsed.records ?? {},
        });
      } else {
        // nothing stored -> use defaults
        setStore(DEFAULT_STORE);
      }
    } catch (err) {
      console.error("[PomodoroStorage] load error:", err);
      setStore(DEFAULT_STORE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save helper
  const save = useCallback(async (next: PomodoroStore) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("[PomodoroStorage] save error:", err);
    }
  }, []);

  // Record a completed focus session for a task
  const recordCompletedSession = useCallback(
    async (taskId: string, priority: string) => {
      setStore((prev) => {
        const existing = prev.records[taskId];
        // Always use the current global setting so changes take effect immediately
        const required =
          prev.settings?.requiredSessions ?? getRequiredSessions(priority);
        const completedSessions = (existing?.completedSessions ?? 0) + 1;
        const next: PomodoroStore = {
          ...prev,
          records: {
            ...prev.records,
            [taskId]: {
              taskId,
              completedSessions,
              requiredSessions: required,
              lastSessionAt: new Date().toISOString(),
            },
          },
        };
        save(next);
        return next;
      });
    },
    [save],
  );

  // Get a task's pomodoro record (or sensible defaults)
  // Always uses the current global requiredSessions so changes reflect immediately.
  const getRecord = useCallback(
    (taskId: string, priority?: string): TaskPomodoroRecord => {
      const globalRequired =
        store.settings?.requiredSessions ??
        getRequiredSessions(priority ?? "medium");
      const existing = store.records[taskId];
      if (existing) {
        return {
          ...existing,
          requiredSessions: globalRequired,
        };
      }
      return {
        taskId,
        completedSessions: 0,
        requiredSessions: globalRequired,
      };
    },
    [store.records, store.settings],
  );

  // Check if a task has met its pomodoro requirement
  const hasCompletedRequiredSessions = useCallback(
    (taskId: string, priority: string): boolean => {
      if (!isFocusTask(priority)) return true; // non-focus tasks: always allowed
      const record = getRecord(taskId, priority);
      return record.completedSessions >= record.requiredSessions;
    },
    [getRecord],
  );

  // Update settings (partial merge)
  const updateSettings = useCallback(
    async (partial: Partial<PomodoroSettings>) => {
      setStore((prev) => {
        // Prevent updating short/long break durations — they are static constants.
        // Only allow changes to focusDuration, sessionsBeforeLongBreak, requiredSessions.
        const safePartial: Partial<PomodoroSettings> = { ...partial };
        delete (safePartial as any).shortBreakDuration;
        delete (safePartial as any).longBreakDuration;

        const next: PomodoroStore = {
          ...prev,
          settings: { ...prev.settings, ...safePartial },
        };
        save(next);
        return next;
      });
    },
    [save],
  );

  // Reset a task's sessions (remove record)
  const resetTaskSessions = useCallback(
    async (taskId: string) => {
      setStore((prev) => {
        const records = { ...prev.records };
        delete records[taskId];
        const next: PomodoroStore = { ...prev, records };
        save(next);
        return next;
      });
    },
    [save],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    settings: store.settings,
    records: store.records,
    isLoading,
    getRecord,
    hasCompletedRequiredSessions,
    recordCompletedSession,
    updateSettings,
    resetTaskSessions,
    reload: load,
  };
}
