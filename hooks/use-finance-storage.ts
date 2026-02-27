import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@habitfuel_transactions';

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'grocery'
  | 'freelance'
  | 'coffee'
  | 'gym'
  | 'salary'
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'bills'
  | 'health'
  | 'education'
  | 'other';

export const CATEGORY_CONFIG: Record<
  TransactionCategory,
  { label: string; icon: string }
> = {
  grocery: { label: 'Grocery', icon: 'shopping-bag' },
  freelance: { label: 'Freelance', icon: 'work' },
  coffee: { label: 'Coffee', icon: 'local-cafe' },
  gym: { label: 'Gym', icon: 'fitness-center' },
  salary: { label: 'Salary', icon: 'account-balance' },
  food: { label: 'Food', icon: 'restaurant' },
  transport: { label: 'Transport', icon: 'directions-car' },
  entertainment: { label: 'Entertainment', icon: 'movie' },
  shopping: { label: 'Shopping', icon: 'shopping-cart' },
  bills: { label: 'Bills', icon: 'receipt' },
  health: { label: 'Health', icon: 'local-hospital' },
  education: { label: 'Education', icon: 'school' },
  other: { label: 'Other', icon: 'more-horiz' },
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
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeChange: number; // percentage vs previous period
  expenseChange: number;
  weeklyData: { day: string; income: number; expense: number }[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfPreviousWeek(date: Date): Date {
  const startOfWeek = getStartOfWeek(date);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  return startOfWeek;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function computeStats(transactions: Transaction[]): FinanceStats {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const startOfPrevWeek = getStartOfPreviousWeek(now);
  const endOfPrevWeek = new Date(startOfWeek.getTime() - 1);

  // Current week transactions
  const currentWeekTxns = transactions.filter(
    (t) => new Date(t.date) >= startOfWeek && new Date(t.date) <= now
  );

  // Previous week transactions
  const prevWeekTxns = transactions.filter(
    (t) => new Date(t.date) >= startOfPrevWeek && new Date(t.date) <= endOfPrevWeek
  );

  const totalIncome = currentWeekTxns
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentWeekTxns
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevIncome = prevWeekTxns
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevExpense = prevWeekTxns
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeChange =
    prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : totalIncome > 0 ? 100 : 0;

  const expenseChange =
    prevExpense > 0
      ? ((totalExpense - prevExpense) / prevExpense) * 100
      : totalExpense > 0
        ? 100
        : 0;

  // Weekly chart data (Mon–Sun)
  const weeklyData = DAY_LABELS.map((day, index) => {
    const dayDate = new Date(startOfWeek);
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
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = dayTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { day, income, expense };
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    incomeChange: Math.round(incomeChange),
    expenseChange: Math.round(expenseChange),
    weeklyData,
  };
}

export function formatCurrency(amount: number): string {
  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatTransactionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (txDate.getTime() === today.getTime()) {
    return `Today, ${timeStr}`;
  }
  if (txDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${timeStr}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function useFinanceStorage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<FinanceStats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    incomeChange: 0,
    expenseChange: 0,
    weeklyData: DAY_LABELS.map((day) => ({ day, income: 0, expense: 0 })),
  });

  // Load transactions from AsyncStorage
  const loadTransactions = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: Transaction[] = JSON.parse(data);
        // Sort by date descending
        parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(parsed);
        setStats(computeStats(parsed));
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save transactions to AsyncStorage
  const saveTransactions = useCallback(async (txns: Transaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
    } catch (error) {
      console.error('Failed to save transactions:', error);
    }
  }, []);

  // Create
  const addTransaction = useCallback(
    async (input: Omit<Transaction, 'id'>) => {
      const newTransaction: Transaction = {
        ...input,
        id: generateId(),
      };
      const updated = [newTransaction, ...transactions];
      updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(updated);
      setStats(computeStats(updated));
      await saveTransactions(updated);
      return newTransaction;
    },
    [transactions, saveTransactions]
  );

  // Update
  const updateTransaction = useCallback(
    async (id: string, input: Partial<Omit<Transaction, 'id'>>) => {
      const updated = transactions.map((t) => (t.id === id ? { ...t, ...input } : t));
      updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(updated);
      setStats(computeStats(updated));
      await saveTransactions(updated);
    },
    [transactions, saveTransactions]
  );

  // Delete
  const deleteTransaction = useCallback(
    async (id: string) => {
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      setStats(computeStats(updated));
      await saveTransactions(updated);
    },
    [transactions, saveTransactions]
  );

  // Get single transaction by ID
  const getTransaction = useCallback(
    (id: string): Transaction | undefined => {
      return transactions.find((t) => t.id === id);
    },
    [transactions]
  );

  // Clear all
  const clearAll = useCallback(async () => {
    setTransactions([]);
    setStats(computeStats([]));
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
  };
}
