import "../public/tamagui.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { TamaguiProvider } from "tamagui";

import { CustomSplashScreen } from "@/components/splash-screen";
import { AppThemeProvider, useThemeSetting } from "@/hooks/use-color-scheme";
import { NicknameProvider } from "@/hooks/use-nickname";
import { SplashProvider } from "@/hooks/use-splash";
import { TaskStorageProvider } from "@/hooks/use-task-storage";
import { HabitStorageProvider } from "@/hooks/use-habit-storage";
import { AccentColorProvider } from "@/hooks/use-accent-color";
import { tamaguiConfig } from "../tamagui.config";

// Keep the native splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { colorScheme } = useThemeSetting();
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular: require("@expo-google-fonts/poppins/400Regular/Poppins_400Regular.ttf"),
    Poppins_700Bold: require("@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf"),
  });

  // Hide native splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  const splashDone = !showSplash;

  // Don't render anything until fonts are ready
  if (!fontsLoaded) {
    return null;
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <SplashProvider value={{ splashDone }}>
          <NicknameProvider>
            <TaskStorageProvider>
              <HabitStorageProvider>
                <AccentColorProvider>
                  <Stack>
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="modal"
                      options={{ presentation: "modal" }}
                    />
                    <Stack.Screen
                      name="pomodoro"
                      options={{
                        headerShown: false,
                        presentation: "fullScreenModal",
                      }}
                    />
                    <Stack.Screen
                      name="habits"
                      options={{
                        headerShown: false,
                        presentation: "fullScreenModal",
                      }}
                    />
                  </Stack>
                  {showSplash && (
                    <CustomSplashScreen onFinish={handleSplashFinish} />
                  )}
                </AccentColorProvider>
              </HabitStorageProvider>
            </TaskStorageProvider>
          </NicknameProvider>
        </SplashProvider>
      </ThemeProvider>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutContent />
    </AppThemeProvider>
  );
}
