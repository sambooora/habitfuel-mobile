import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  createElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useColorScheme } from "./use-color-scheme";

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = "@habitfuel_accent_id";

// ---------------------------------------------------------------------------
// Accent options
// ---------------------------------------------------------------------------

export interface AccentOption {
  id: string;
  label: string;
  /** Color shown as the swatch circle in the picker */
  swatch: string;
  /** Primary color used in light mode */
  primary: string;
  /** Primary color used in dark mode (slightly lighter) */
  primaryDark: string;
  /** Color for text / icons placed ON TOP of the primary background */
  onPrimary: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: "blue",
    label: "Blue",
    swatch: "#3B7BF2",
    primary: "#3B7BF2",
    primaryDark: "#5B93F5",
    onPrimary: "#FFFFFF",
  },
  {
    id: "red",
    label: "Red",
    swatch: "#E53935",
    primary: "#E53935",
    primaryDark: "#EF5350",
    onPrimary: "#FFFFFF",
  },
  {
    id: "white",
    label: "White",
    swatch: "#F1F5F9",
    primary: "#9AA0A8",
    primaryDark: "#BDC1C6",
    onPrimary: "#FFFFFF",
  },
  {
    id: "green",
    label: "Green",
    swatch: "#16A34A",
    primary: "#16A34A",
    primaryDark: "#4ADE80",
    onPrimary: "#FFFFFF",
  },
  {
    id: "purple",
    label: "Purple",
    swatch: "#7C3AED",
    primary: "#7C3AED",
    primaryDark: "#A78BFA",
    onPrimary: "#FFFFFF",
  },
];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AccentColorContextValue {
  /** ID of the currently selected accent ("blue" | "red" | "white" | "green" | "purple") */
  accentId: string;
  /** Resolved primary color for the current color scheme */
  accentColor: string;
  /** Color to use for text / icons placed on top of accentColor */
  accentOnColor: string;
  /** Full list of available options (for rendering the picker) */
  options: AccentOption[];
  /** Persist a new accent selection */
  setAccentId: (id: string) => Promise<void>;
}

const AccentColorContext = createContext<AccentColorContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [accentId, setAccentIdState] = useState<string>("blue");

  // Load persisted choice on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored && ACCENT_OPTIONS.some((o) => o.id === stored)) {
          setAccentIdState(stored);
        }
      })
      .catch(() => {
        // Silently ignore storage errors — fall back to default blue
      });
  }, []);

  const setAccentId = useCallback(async (id: string) => {
    setAccentIdState(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Silently ignore write errors
    }
  }, []);

  const value = useMemo<AccentColorContextValue>(() => {
    const option =
      ACCENT_OPTIONS.find((o) => o.id === accentId) ?? ACCENT_OPTIONS[0];
    return {
      accentId,
      accentColor: isDark ? option.primaryDark : option.primary,
      accentOnColor: option.onPrimary,
      options: ACCENT_OPTIONS,
      setAccentId,
    };
  }, [accentId, isDark, setAccentId]);

  return createElement(AccentColorContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// Default fallback (used when hook is called outside the provider,
// e.g. inside a Tamagui Sheet / React Native Modal portal)
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT: AccentColorContextValue = {
  accentId: "blue",
  accentColor: "#3B7BF2",
  accentOnColor: "#FFFFFF",
  options: ACCENT_OPTIONS,
  setAccentId: async () => {},
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAccentColor(): AccentColorContextValue {
  return useContext(AccentColorContext) ?? DEFAULT_ACCENT;
}
