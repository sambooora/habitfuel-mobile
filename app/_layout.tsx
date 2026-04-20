import "../public/tamagui.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { TamaguiProvider } from "tamagui";

import { AppThemeProvider, useThemeSetting } from "@/hooks/use-color-scheme";
import { NicknameProvider } from "@/hooks/use-nickname";
import { TaskStorageProvider } from "@/hooks/use-task-storage";
import { HabitStorageProvider } from "@/hooks/use-habit-storage";
import { AccentColorProvider } from "@/hooks/use-accent-color";
import { tamaguiConfig } from "../tamagui.config";

function RootLayoutContent() {
  const { colorScheme } = useThemeSetting();

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
              </AccentColorProvider>
            </HabitStorageProvider>
          </TaskStorageProvider>
        </NicknameProvider>
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
