import type { ReactNode } from "react";
import {
 createContext,
 createElement,
 useCallback,
 useContext,
 useEffect,
 useMemo,
 useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useRNColorScheme } from "react-native";

type ThemeSetting = "light" | "dark" | "system";
type ThemeContextValue = {
 colorScheme: "light" | "dark";
 schemeSetting: ThemeSetting;
 setSchemeSetting: (scheme: ThemeSetting) => void;
};
type ThemeContextValueOrNull = ThemeContextValue | null;

// `useColorScheme()` returns 'unspecified' (not null) since React Native 0.86,
// so a nullish fallback is no longer enough to narrow it to a concrete theme.
function normalizeScheme(
 scheme: "light" | "dark" | "unspecified" | null | undefined,
): "light" | "dark" {
 return scheme === "dark" ? "dark" : "light";
}

const ThemeContext = createContext(null as ThemeContextValueOrNull);

export function AppThemeProvider({
 children,
}: {
 children: ReactNode;
}) {
 const systemScheme = useRNColorScheme();
 const [schemeSetting, setSchemeSettingState] = useState(
  "system" as ThemeSetting,
 );
 const colorScheme =
  schemeSetting === "system"
   ? normalizeScheme(systemScheme)
   : schemeSetting;

 useEffect(() => {
  let isActive = true;
  const loadSetting = async () => {
   const saved = await AsyncStorage.getItem("themeSetting");
   if (!isActive || !saved) {
    return;
   }
   if (saved === "light" || saved === "dark" || saved === "system") {
    setSchemeSettingState(saved);
   }
  };
  loadSetting();
  return () => {
   isActive = false;
  };
 }, []);

 const setSchemeSetting = useCallback((scheme: ThemeSetting) => {
  setSchemeSettingState(scheme);
  AsyncStorage.setItem("themeSetting", scheme);
 }, []);

 const value = useMemo(
  () => ({
   colorScheme,
   schemeSetting,
   setSchemeSetting,
  }),
  [colorScheme, schemeSetting],
 );

 return createElement(ThemeContext.Provider, { value }, children);
}

export function useThemeSetting() {
 const systemScheme = useRNColorScheme();
 const context = useContext(ThemeContext);

 if (context) {
  return context;
 }

 return {
  colorScheme: normalizeScheme(systemScheme),
  schemeSetting: "system" as ThemeSetting,
  setSchemeSetting: () => {},
 };
}

export function useColorScheme() {
 const { colorScheme } = useThemeSetting();
 return colorScheme;
}
