import {
  createContext,
  createElement,
  ReactNode,
  useContext,
  useMemo,
} from "react";

import { useColorScheme } from "./use-color-scheme";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AccentColorContextValue {
  /** Resolved primary color for the current color scheme (monochrome) */
  accentColor: string;
  /** Color for text / icons placed on top of accentColor */
  accentOnColor: string;
}

const AccentColorContext = createContext<AccentColorContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const value = useMemo<AccentColorContextValue>(
    () => ({
      // Monochrome: near-black in light mode, near-white in dark mode
      accentColor: isDark ? "#F0F1F3" : "#111318",
      accentOnColor: isDark ? "#111318" : "#FFFFFF",
    }),
    [isDark]
  );

  return createElement(AccentColorContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// Default fallback (used when hook is called outside the provider)
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT: AccentColorContextValue = {
  accentColor: "#111318",
  accentOnColor: "#FFFFFF",
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAccentColor(): AccentColorContextValue {
  return useContext(AccentColorContext) ?? DEFAULT_ACCENT;
}
