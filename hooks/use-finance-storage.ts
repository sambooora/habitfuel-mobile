import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@habitfuel_transactions";

export type TransactionType = "income" | "expense";

export type TransactionCategory =
  | "grocery"
  | "freelance"
  | "coffee"
  | "gym"
  | "salary"
  | "food"
  | "transport"
  | "entertainment"
  | "shopping"
  | "bills"
  | "health"
  | "education"
  | "other";

export const CATEGORY_CONFIG: Record<
  TransactionCategory,
  { label: string; icon: string }
> = {
  grocery: { label: "Grocery", icon: "shopping-bag" },
  freelance: { label: "Freelance", icon: "work" },
  coffee: { label: "Coffee", icon: "local-cafe" },
  gym: { label: "Gym", icon: "fitness-center" },
  salary: { label: "Salary", icon: "account-balance" },
  food: { label: "Food", icon: "restaurant" },
  transport: { label: "Transport", icon: "directions-car" },
  entertainment: { label: "Entertainment", icon: "movie" },
  shopping: { label: "Shopping", icon: "shopping-cart" },
  bills: { label: "Bills", icon: "receipt" },
  health: { label: "Health", icon: "local-hospital" },
  education: { label: "Education", icon: "school" },
  other: { label: "Other", icon: "more-horiz" },
};

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO string
  note?: string;
}

export interface FinanceStats {
  /** All-time balance (total income − total expense across ALL transactions) */
  balance: number;
  /** Income total for the currently viewed week */
  totalIncome: number;
  /** Expense total for the currently viewed week */
  totalExpense: number;
  /** % change vs the week before the currently viewed week */
  incomeChange: number;
  expenseChange: number;
  /** Per-day chart data for the currently viewed week (Mon–Sun) */
  weeklyData: { day: string; income: number; expense: number }[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Returns the Monday 00:00:00.000 of the week that contains `date`,
 * shifted by `weekOffset` weeks (negative = past, 0 = current).
 */
function getStartOfWeek(date: Date, weekOffset = 0): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Computes stats from all transactions.
 *
 * @param transactions  Full list of transactions (all-time).
 * @param weekOffset    0 = current week, -1 = previous week, +1 = next week, …
 */
export function computeStats(
  transactions: Transaction[],
  weekOffset = 0,
): FinanceStats {
  const now = new Date();

  // ── All-time balance ────────────────────────────────────────────────────────
  const allTimeIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const allTimeExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = allTimeIncome - allTimeExpense;

  // ── Viewed week range ───────────────────────────────────────────────────────
  const startOfViewedWeek = getStartOfWeek(now, weekOffset);
  const endOfViewedWeek = new Date(startOfViewedWeek);
  endOfViewedWeek.setDate(endOfViewedWeek.getDate() + 7);
  endOfViewedWeek.setMilliseconds(endOfViewedWeek.getMilliseconds() - 1);

  // ── Previous week range (one week before the viewed week) ──────────────────
  const startOfPrevWeek = getStartOfWeek(now, weekOffset - 1);
  const endOfPrevWeek = new Date(startOfViewedWeek.getTime() - 1);

  // ── Transactions for each window ───────────────────────────────────────────
  const viewedWeekTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= startOfViewedWeek && d <= endOfViewedWeek;
  });

  const prevWeekTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= startOfPrevWeek && d <= endOfPrevWeek;
  });

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalIncome = viewedWeekTxns
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = viewedWeekTxns
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const prevIncome = prevWeekTxns
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const prevExpense = prevWeekTxns
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // ── % changes ──────────────────────────────────────────────────────────────
  const incomeChange =
    prevIncome > 0
      ? ((totalIncome - prevIncome) / prevIncome) * 100
      : totalIncome > 0
        ? 100
        : 0;

  const expenseChange =
    prevExpense > 0
      ? ((totalExpense - prevExpense) / prevExpense) * 100
      : totalExpense > 0
        ? 100
        : 0;

  // ── Per-day chart data (Mon–Sun of the viewed week) ────────────────────────
  const weeklyData = DAY_LABELS.map((day, index) => {
    const dayDate = new Date(startOfViewedWeek);
    dayDate.setDate(dayDate.getDate() + index);
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayTxns = transactions.filter((t) => {
      const td = new Date(t.date);
      return td >= dayStart && td <= dayEnd;
    });

    const income = dayTxns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = dayTxns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return { day, income, expense };
  });

  return {
    balance,
    totalIncome,
    totalExpense,
    incomeChange: Math.round(incomeChange),
    expenseChange: Math.round(expenseChange),
    weeklyData,
  };
}

export function formatCurrency(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return (Number.isInteger(val) ? val.toFixed(0) : val.toFixed(1)) + "M";
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return (Number.isInteger(val) ? val.toFixed(0) : val.toFixed(1)) + "K";
  }
  return amount.toFixed(0);
}

export function formatTransactionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (txDate.getTime() === today.getTime()) {
    return `Today, ${timeStr}`;
  }
  if (txDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${timeStr}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Returns a human-readable label for a given week offset relative to today.
 *  0  → "This Week"
 * -1  → "Last Week"
 * -n  → the Mon–Sun date range string
 * +n  → the Mon–Sun date range string
 */
export function getWeekLabel(weekOffset: number): string {
  if (weekOffset === 0) return "This Week";
  if (weekOffset === -1) return "Last Week";

  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${fmt(monday)} – ${fmt(sunday)}`;
}

export function useFinanceStorage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default stats (weekOffset = 0)
  const [stats, setStats] = useState<FinanceStats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    incomeChange: 0,
    expenseChange: 0,
    weeklyData: DAY_LABELS.map((day) => ({ day, income: 0, expense: 0 })),
  });

  // Keep the raw transaction list in a ref-like manner so we can recompute
  // stats for any week offset on demand.
  const recomputeStats = useCallback(
    (txns: Transaction[], weekOffset: number) => {
      setStats(computeStats(txns, weekOffset));
    },
    [],
  );

  // Load transactions from AsyncStorage
  const loadTransactions = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: Transaction[] = JSON.parse(data);
        parsed.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setTransactions(parsed);
        setStats(computeStats(parsed, 0));
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save transactions to AsyncStorage
  const saveTransactions = useCallback(async (txns: Transaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
    } catch (error) {
      console.error("Failed to save transactions:", error);
    }
  }, []);

  // Create
  const addTransaction = useCallback(
    async (input: Omit<Transaction, "id">) => {
      const newTransaction: Transaction = { ...input, id: generateId() };
      const updated = [newTransaction, ...transactions];
      updated.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setTransactions(updated);
      // Recompute at current week (caller is responsible for passing weekOffset
      // if needed; default to 0 here — the screen will recompute via effect)
      setStats(computeStats(updated, 0));
      await saveTransactions(updated);
      return newTransaction;
    },
    [transactions, saveTransactions],
  );

  // Update
  const updateTransaction = useCallback(
    async (id: string, input: Partial<Omit<Transaction, "id">>) => {
      const updated = transactions.map((t) =>
        t.id === id ? { ...t, ...input } : t,
      );
      updated.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setTransactions(updated);
      setStats(computeStats(updated, 0));
      await saveTransactions(updated);
    },
    [transactions, saveTransactions],
  );

  // Delete
  const deleteTransaction = useCallback(
    async (id: string) => {
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      setStats(computeStats(updated, 0));
      await saveTransactions(updated);
    },
    [transactions, saveTransactions],
  );

  // Get single transaction by ID
  const getTransaction = useCallback(
    (id: string): Transaction | undefined =>
      transactions.find((t) => t.id === id),
    [transactions],
  );

  // Clear all
  const clearAll = useCallback(async () => {
    setTransactions([]);
    setStats(computeStats([], 0));
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    stats,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransaction,
    clearAll,
    refresh: loadTransactions,
    /** Call this whenever the week offset changes so stats reflect the right week */
    recomputeStats,
  };
}
