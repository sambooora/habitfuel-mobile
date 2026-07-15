import AsyncStorage from "@react-native-async-storage/async-storage";
import type React from "react";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "@habitfuel_tasks";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: string; color: string }
> = {
  todo: { label: "To Do", icon: "radio-button-unchecked", color: "#8F98A1" },
  in_progress: { label: "In Progress", icon: "timelapse", color: "#717882" },
  done: { label: "Done", icon: "check-circle", color: "#555B64" },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bgColor: string }
> = {
  low: { label: "Low", color: "#9AA0A8", bgColor: "#F0F2F4" },
  medium: { label: "Medium", color: "#717882", bgColor: "#F0F2F4" },
  high: { label: "High", color: "#555B64", bgColor: "#ECEEF1" },
  urgent: { label: "Urgent", color: "#111318", bgColor: "#E8EAED" },
};

export type TaskTag =
  | "design"
  | "development"
  | "research"
  | "meeting"
  | "planning"
  | "testing"
  | "review"
  | "personal"
  | "health"
  | "learning"
  | "other";

export const TAG_CONFIG: Record<
  TaskTag,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  design: {
    label: "Design",
    icon: "palette",
    color: "#717882",
    bgColor: "#F0F2F4",
  },
  development: {
    label: "Development",
    icon: "code",
    color: "#717882",
    bgColor: "#F0F2F4",
  },
  research: {
    label: "Research",
    icon: "science",
    color: "#717882",
    bgColor: "#F0F2F4",
  },
  meeting: {
    label: "Meeting",
    icon: "groups",
    color: "#717882",
    bgColor: "#F0F2F4",
  },
  planning: {
    label: "Planning",
    icon: "event-note",
    color: "#717882",
    bgColor: "#F0F2F4",
  },
  testing: {
    label: "Testing",
    icon: "bug-report",
    color: "#717882",
    bgColor: "#F0F2F4",
  },
  review: {
    label: "Review",
    icon: "rate-review",
    color: "#717882",
    bgColor: "#F0F2F4",
  },
  personal: {
    label: "Personal",
    icon: "person",
    color: "#717882",
    bgColor: "#F0F2F4",
  },
  health: {
    label: "Health",
    icon: "favorite",
    color: "#717882",
    bgColor: "#F0F2F4",
  },
  learning: {
    label: "Learning",
    icon: "school",
    color: "#717882",
    bgColor: "#F0F2F4",
  },
  other: {
    label: "Other",
    icon: "label",
    color: "#8F98A1",
    bgColor: "#F0F2F4",
  },
};

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tag: TaskTag;
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  note?: string;
}

export interface TaskFilters {
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  tag: TaskTag | "all";
  searchQuery: string;
  sortBy: "newest" | "oldest" | "priority" | "dueDate";
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  completionRate: number;
  urgentCount: number;
  highCount: number;
  overdue: number;
  dueToday: number;
}

const PRIORITY_SORT_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function computeStats(tasks: Task[]): TaskStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const urgentCount = tasks.filter(
    (t) => t.priority === "urgent" && t.status !== "done",
  ).length;
  const highCount = tasks.filter(
    (t) => t.priority === "high" && t.status !== "done",
  ).length;

  const overdue = tasks.filter((t) => {
    if (!t.dueDate || t.status === "done") return false;
    return new Date(t.dueDate) < todayStart;
  }).length;

  const dueToday = tasks.filter((t) => {
    if (!t.dueDate || t.status === "done") return false;
    const due = new Date(t.dueDate);
    return due >= todayStart && due < todayEnd;
  }).length;

  return {
    total,
    todo,
    inProgress,
    done,
    completionRate,
    urgentCount,
    highCount,
    overdue,
    dueToday,
  };
}

function filterAndSortTasks(tasks: Task[], filters: TaskFilters): Task[] {
  let result = [...tasks];

  if (filters.status !== "all") {
    result = result.filter((t) => t.status === filters.status);
  }

  if (filters.priority !== "all") {
    result = result.filter((t) => t.priority === filters.priority);
  }

  if (filters.tag !== "all") {
    result = result.filter((t) => t.tag === filters.tag);
  }

  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        TAG_CONFIG[t.tag]?.label.toLowerCase().includes(query) ||
        PRIORITY_CONFIG[t.priority]?.label.toLowerCase().includes(query) ||
        (t.note && t.note.toLowerCase().includes(query)),
    );
  }

  switch (filters.sortBy) {
    case "newest":
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "oldest":
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      break;
    case "priority":
      result.sort(
        (a, b) =>
          PRIORITY_SORT_ORDER[a.priority] - PRIORITY_SORT_ORDER[b.priority],
      );
      break;
    case "dueDate":
      result.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      break;
  }

  return result;
}

export function formatTaskDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDate.getTime() === today.getTime()) return "Today";
  if (txDate.getTime() === yesterday.getTime()) return "Yesterday";
  if (txDate.getTime() === tomorrow.getTime()) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done") return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(task.dueDate) < today;
}

export function isDueToday(task: Task): boolean {
  if (!task.dueDate || task.status === "done") return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const due = new Date(task.dueDate);
  return due >= todayStart && due < todayEnd;
}

export function getSubtaskProgress(task: Task): {
  completed: number;
  total: number;
} {
  const total = task.subtasks.length;
  const completed = task.subtasks.filter((s) => s.completed).length;
  return { completed, total };
}

export function getDefaultFilters(): TaskFilters {
  return {
    status: "all",
    priority: "all",
    tag: "all",
    searchQuery: "",
    sortBy: "newest",
  };
}

// ─── Context ────────────────────────────────────────────────

interface TaskContextValue {
  // Raw data
  tasks: Task[];
  isLoading: boolean;

  // CRUD
  addTask: (
    input: Omit<Task, "id" | "createdAt" | "updatedAt" | "subtasks"> & {
      subtasks?: SubTask[];
    },
  ) => Promise<Task>;
  updateTask: (
    id: string,
    input: Partial<Omit<Task, "id" | "createdAt">>,
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Task | undefined;
  cycleStatus: (id: string) => Promise<void>;

  // Subtasks
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // Filters (per-consumer, derived from shared tasks)
  filters: TaskFilters;
  filteredTasks: Task[];
  stats: TaskStats;
  statusCounts: {
    all: number;
    todo: number;
    in_progress: number;
    done: number;
  };
  hasActiveFilters: boolean;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: TaskStatus | "all") => void;
  setPriorityFilter: (priority: TaskPriority | "all") => void;
  setTagFilter: (tag: TaskTag | "all") => void;
  setSortBy: (sortBy: TaskFilters["sortBy"]) => void;
  setFilters: React.Dispatch<React.SetStateAction<TaskFilters>>;
  resetFilters: () => void;

  // Misc
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────

export function TaskStorageProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>(getDefaultFilters());

  const loadTasks = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: Task[] = JSON.parse(data);
        setTasks(parsed);
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTasks = useCallback(async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    } catch (error) {
      console.error("Failed to save tasks:", error);
    }
  }, []);

  const addTask = useCallback(
    async (
      input: Omit<Task, "id" | "createdAt" | "updatedAt" | "subtasks"> & {
        subtasks?: SubTask[];
      },
    ) => {
      const now = new Date().toISOString();
      const newTask: Task = {
        ...input,
        id: generateId(),
        subtasks: input.subtasks ?? [],
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newTask, ...tasks];
      setTasks(updated);
      await saveTasks(updated);
      return newTask;
    },
    [tasks, saveTasks],
  );

  const updateTask = useCallback(
    async (id: string, input: Partial<Omit<Task, "id" | "createdAt">>) => {
      const updated = tasks.map((t) =>
        t.id === id
          ? { ...t, ...input, updatedAt: new Date().toISOString() }
          : t,
      );
      setTasks(updated);
      await saveTasks(updated);
    },
    [tasks, saveTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      await saveTasks(updated);
    },
    [tasks, saveTasks],
  );

  const getTask = useCallback(
    (id: string): Task | undefined => tasks.find((t) => t.id === id),
    [tasks],
  );

  const cycleStatus = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const nextStatus: Record<TaskStatus, TaskStatus> = {
        todo: "in_progress",
        in_progress: "done",
        done: "todo",
      };
      await updateTask(id, { status: nextStatus[task.status] });
    },
    [tasks, updateTask],
  );

  const addSubtask = useCallback(
    async (taskId: string, title: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const newSubtask: SubTask = { id: generateId(), title, completed: false };
      await updateTask(taskId, { subtasks: [...task.subtasks, newSubtask] });
    },
    [tasks, updateTask],
  );

  const toggleSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const updatedSubtasks = task.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s,
      );
      await updateTask(taskId, { subtasks: updatedSubtasks });
    },
    [tasks, updateTask],
  );

  const deleteSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const updatedSubtasks = task.subtasks.filter((s) => s.id !== subtaskId);
      await updateTask(taskId, { subtasks: updatedSubtasks });
    },
    [tasks, updateTask],
  );

  const clearAll = useCallback(async () => {
    setTasks([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  // Filter helpers
  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setStatusFilter = useCallback((status: TaskStatus | "all") => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const setPriorityFilter = useCallback((priority: TaskPriority | "all") => {
    setFilters((prev) => ({ ...prev, priority }));
  }, []);

  const setTagFilter = useCallback((tag: TaskTag | "all") => {
    setFilters((prev) => ({ ...prev, tag }));
  }, []);

  const setSortBy = useCallback((sortBy: TaskFilters["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters());
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.status !== "all" ||
      filters.priority !== "all" ||
      filters.tag !== "all" ||
      filters.searchQuery.trim() !== "" ||
      filters.sortBy !== "newest",
    [filters],
  );

  const stats = useMemo(() => computeStats(tasks), [tasks]);
  const filteredTasks = useMemo(
    () => filterAndSortTasks(tasks, filters),
    [tasks, filters],
  );

  const statusCounts = useMemo(() => {
    const base = filters.searchQuery.trim()
      ? tasks.filter((t) => {
          const query = filters.searchQuery.toLowerCase().trim();
          return (
            t.title.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            TAG_CONFIG[t.tag]?.label.toLowerCase().includes(query) ||
            PRIORITY_CONFIG[t.priority]?.label.toLowerCase().includes(query) ||
            (t.note && t.note.toLowerCase().includes(query))
          );
        })
      : tasks;

    return {
      all: base.length,
      todo: base.filter((t) => t.status === "todo").length,
      in_progress: base.filter((t) => t.status === "in_progress").length,
      done: base.filter((t) => t.status === "done").length,
    };
  }, [tasks, filters.searchQuery]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const value = useMemo<TaskContextValue>(
    () => ({
      tasks,
      isLoading,
      addTask,
      updateTask,
      deleteTask,
      getTask,
      cycleStatus,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      filters,
      filteredTasks,
      stats,
      statusCounts,
      hasActiveFilters,
      setSearchQuery,
      setStatusFilter,
      setPriorityFilter,
      setTagFilter,
      setSortBy,
      setFilters,
      resetFilters,
      clearAll,
      refresh: loadTasks,
    }),
    [
      tasks,
      isLoading,
      addTask,
      updateTask,
      deleteTask,
      getTask,
      cycleStatus,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      filters,
      filteredTasks,
      stats,
      statusCounts,
      hasActiveFilters,
      setSearchQuery,
      setStatusFilter,
      setPriorityFilter,
      setTagFilter,
      setSortBy,
      resetFilters,
      clearAll,
      loadTasks,
    ],
  );

  return createElement(TaskContext.Provider, { value }, children);
}

// ─── Hook ────────────────────────────────────────────────────

export function useTaskStorage(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error("useTaskStorage must be used inside <TaskStorageProvider>");
  }
  return ctx;
}
