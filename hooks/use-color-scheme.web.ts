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

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
 const [hasHydrated, setHasHydrated] = useState(false);

 useEffect(() => {
  setHasHydrated(true);
 }, []);

 const colorScheme = useRNColorScheme();

 if (hasHydrated) {
  return normalizeScheme(colorScheme);
 }

 return "light";
}

export function AppThemeProvider({
 children,
}: {
 children: ReactNode;
}) {
 const [hasHydrated, setHasHydrated] = useState(false);
 const systemScheme = useRNColorScheme();
 const [schemeSetting, setSchemeSettingState] = useState(
  "system" as ThemeSetting,
 );
 useEffect(() => {
  setHasHydrated(true);
 }, []);
 const resolvedSystemScheme = hasHydrated ? systemScheme : "light";
 const colorScheme =
  schemeSetting === "system"
   ? normalizeScheme(resolvedSystemScheme)
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
