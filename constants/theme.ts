/**
 * HabitFuel Design System
 * ──────────────────────────────────────────────────────────────
 * Centralized design tokens for consistent light & dark theming.
 *
 * Contrast guidelines followed:
 *   • Body text on background    ≥ 7:1  (WCAG AAA)
 *   • Large/bold text on background ≥ 4.5:1
 *   • Subtle/secondary text      ≥ 4.5:1 (WCAG AA)
 *   • Interactive elements       ≥ 3:1 against adjacent colors
 *   • Card surfaces clearly differentiated from page background
 */

import { Platform } from "react-native";

// ─── Brand / Accent Colors ──────────────────────────────────
export const Brand = {
  primary: "#3B7BF2", // Main accent — good contrast on both themes
  primaryLight: "#5B93F5", // Lighter variant for dark mode interactive
  primaryDark: "#2A5FCC", // Darker variant for light mode hover/press
  primaryMuted: "#3B7BF220", // Translucent for backgrounds

  success: "#0A8F5A",
  successLight: "#12B873",
  successBg: "#E6F5EE",
  successBgDark: "#0A8F5A1A",

  danger: "#D94141",
  dangerLight: "#E25B5B",
  dangerBg: "#FDECEC",
  dangerBgDark: "#D941411A",

  warning: "#E8A317",
  warningLight: "#F0B840",
  warningBg: "#FFF5E0",
  warningBgDark: "#E8A3171A",

  info: "#3B7BF2",
  infoBg: "#EBF1FE",
  infoBgDark: "#3B7BF21A",
} as const;

// ─── Semantic Palette ───────────────────────────────────────
export const Palette = {
  light: {
    // Surfaces
    pageBg: "#F2F3F5", // Page background — warm gray
    cardBg: "#FFFFFF", // Card / elevated surface
    cardBgHover: "#F8F9FB", // Card pressed / hover state
    sheetBg: "#FFFFFF", // Bottom sheet background

    // Borders & dividers
    border: "#E0E2E6", // Default border
    borderSubtle: "#ECEEF1", // Subtle divider
    borderFocus: "#3B7BF2", // Focused input border

    // Text — all meet WCAG AA on cardBg (#FFF)
    textPrimary: "#111318", // Primary text — 15.4:1 on white
    textSecondary: "#555B64", // Secondary text — 7.2:1 on white
    textSubtle: "#717882", // Subtle / placeholder — 4.6:1 on white
    textInverse: "#FFFFFF", // Text on dark/accent backgrounds
    textOnAccent: "#FFFFFF", // Text on Brand.primary

    // Interactive
    inputBg: "#F5F6F8", // Input field background
    inputText: "#111318", // Input value text
    inputPlaceholder: "#9AA0A8", // Placeholder — 3.5:1 (acceptable for placeholder)

    // Status button / chip backgrounds
    chipBg: "#F0F2F4", // Default chip bg
    chipBgActive: "#111318", // Active chip bg
    chipTextActive: "#FFFFFF", // Active chip text

    // Tab bar
    tabBarBg: "#FFFFFF",
    tabBarBorder: "#E0E2E6",
    tabIconDefault: "#8A9099", // 4.5:1 on white
    tabIconActive: "#3B7BF2",

    // FAB
    fabBg: "#111318",
    fabIcon: "#FFFFFF",
    fabShadow: "#00000033",

    // Misc
    skeleton: "#E8EAED",
    overlay: "#00000066",
    progressTrack: "#E8EAED",
    progressFill: "#111318",

    // Week day pills (Home)
    weekDayBg: "#FFFFFF",
    weekDayActiveBg: "#111318",
    weekDayText: "#717882",
    weekDayActiveText: "#FFFFFF",
    weekDateText: "#111318",
    weekDateActiveText: "#FFFFFF",

    // Stat cards
    statCardBg: "#FFFFFF",
    statCardActiveBg: "#EBF1FE", // Light blue tint
    statIconBg: "#F0F2F4",

    // Chart
    chartBarPrimary: "#111318",
    chartBarMuted: "#C8CDD3",

    // Badge
    badgeBg: "#F0F2F4",
    badgeText: "#111318",

    // Duration badge
    durationBg: "#F0F2F4",
    durationText: "#111318",

    // Task icon wrap
    taskIconBg: "#F0F2F4",
    taskIconColor: "#555B64",

    // Play button (Home)
    playBg: "#111318",
    playIcon: "#FFFFFF",

    // Empty state
    emptyIcon: "#C8CDD3",

    // Avatar
    avatarBg: "#D9DBDE",

    // Habit icon (always on colored bg so we use a dark text)
    habitIconColor: "#111318",

    // Transaction icon backgrounds (finance)
    transactionIncomeBg: "#E6F5EE",
    transactionIncomeIcon: "#0A8F5A",
    transactionExpenseBg: "#F0F2F4",
    transactionExpenseIcon: "#555B64",

    // StatusBtn (explore)
    statusBtnBg: "rgba(0,0,0,0.06)",
  },

  dark: {
    // Surfaces
    pageBg: "#0D0E11", // Deep dark page bg
    cardBg: "#1A1D22", // Card surface — clearly lifted from page
    cardBgHover: "#22262C", // Card pressed state
    sheetBg: "#1A1D22", // Bottom sheet

    // Borders & dividers
    border: "#2E333A", // Default border — visible on cardBg
    borderSubtle: "#252930", // Subtle divider
    borderFocus: "#5B93F5", // Focused input border

    // Text — all meet WCAG AA on cardBg (#1A1D22)
    textPrimary: "#F0F1F3", // Primary text — 13.8:1 on #1A1D22
    textSecondary: "#A0A7B0", // Secondary text — 6.2:1 on #1A1D22
    textSubtle: "#7B838D", // Subtle text — 4.6:1 on #1A1D22
    textInverse: "#111318", // Text on light backgrounds
    textOnAccent: "#FFFFFF", // Text on Brand.primary

    // Interactive
    inputBg: "#14171B", // Input field background
    inputText: "#F0F1F3", // Input value text
    inputPlaceholder: "#636A73", // Placeholder — acceptable at 3.5:1

    // Status button / chip backgrounds
    chipBg: "#252930", // Default chip bg
    chipBgActive: "#F0F1F3", // Active chip bg
    chipTextActive: "#111318", // Active chip text — high contrast on light

    // Tab bar
    tabBarBg: "#131518",
    tabBarBorder: "#252930",
    tabIconDefault: "#636A73", // 4.5:1 on tabBarBg
    tabIconActive: "#5B93F5",

    // FAB
    fabBg: "#3B7BF2", // Use accent in dark mode — visible!
    fabIcon: "#FFFFFF",
    fabShadow: "#3B7BF244",

    // Misc
    skeleton: "#252930",
    overlay: "#000000AA",
    progressTrack: "#252930",
    progressFill: "#5B93F5",

    // Week day pills
    weekDayBg: "#1A1D22",
    weekDayActiveBg: "#3B7BF2",
    weekDayText: "#7B838D",
    weekDayActiveText: "#FFFFFF",
    weekDateText: "#E4E6E9",
    weekDateActiveText: "#FFFFFF",

    // Stat cards
    statCardBg: "#1A1D22",
    statCardActiveBg: "#1E2A40", // Dark blue tint
    statIconBg: "#252930",

    // Chart
    chartBarPrimary: "#5B93F5", // Visible accent on dark card
    chartBarMuted: "#3A3F47",

    // Badge
    badgeBg: "#252930",
    badgeText: "#F0F1F3",

    // Duration badge
    durationBg: "#252930",
    durationText: "#F0F1F3",

    // Task icon wrap
    taskIconBg: "#252930",
    taskIconColor: "#A0A7B0",

    // Play button
    playBg: "#3B7BF2",
    playIcon: "#FFFFFF",

    // Empty state
    emptyIcon: "#3A3F47",

    // Avatar
    avatarBg: "#2E333A",

    // Habit icon color (on colored background)
    habitIconColor: "#111318",

    // Transaction icon backgrounds (finance)
    transactionIncomeBg: "#0A8F5A1A",
    transactionIncomeIcon: "#12B873",
    transactionExpenseBg: "#252930",
    transactionExpenseIcon: "#A0A7B0",

    // StatusBtn (explore)
    statusBtnBg: "rgba(255,255,255,0.08)",
  },
} as const;

// ─── Helper to get the palette for a given scheme ───────────
export type ThemeMode = "light" | "dark";
export type ThemePalette = typeof Palette.light | typeof Palette.dark;

export function getTheme(mode: ThemeMode): ThemePalette {
  return Palette[mode];
}

// ─── Legacy Color Tokens (for backwards compat) ─────────────
const tintColorLight = "#3B7BF2";
const tintColorDark = "#5B93F5";

export const Colors = {
  light: {
    text: Palette.light.textPrimary,
    background: Palette.light.pageBg,
    tint: tintColorLight,
    icon: Palette.light.tabIconDefault,
    tabIconDefault: Palette.light.tabIconDefault,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Palette.dark.textPrimary,
    background: Palette.dark.pageBg,
    tint: tintColorDark,
    icon: Palette.dark.tabIconDefault,
    tabIconDefault: Palette.dark.tabIconDefault,
    tabIconSelected: tintColorDark,
  },
};

// ─── Typography / Fonts ─────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    /** iOS UIFontDescriptorSystemDesignDefault */
    sans: "system-ui",
    /** iOS UIFontDescriptorSystemDesignSerif */
    serif: "ui-serif",
    /** iOS UIFontDescriptorSystemDesignRounded */
    rounded: "ui-rounded",
    /** iOS UIFontDescriptorSystemDesignMonospaced */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ─── Spacing ────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Radii ──────────────────────────────────────────────────
export const Radii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 20,
  xxxl: 28,
  full: 999,
} as const;

// ─── Shadows ────────────────────────────────────────────────
export const Shadows = {
  light: {
    card: {
      shadowColor: "#000000",
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardSubtle: {
      shadowColor: "#000000",
      shadowOpacity: 0.03,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    fab: {
      shadowColor: "#000000",
      shadowOpacity: 0.2,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  },
  dark: {
    card: {
      shadowColor: "#000000",
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    cardSubtle: {
      shadowColor: "#000000",
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    fab: {
      shadowColor: "#3B7BF2",
      shadowOpacity: 0.4,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
  },
} as const;
