import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, Palette, Shadows } from "@/constants/theme";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useThemeSetting } from "@/hooks/use-color-scheme";
import { useNickname } from "@/hooks/use-nickname";

export default function SettingsScreen() {
  const { nickname, setNickname } = useNickname();
  const { schemeSetting, setSchemeSetting, colorScheme } = useThemeSetting();
  const { accentId, accentColor, options, setAccentId } = useAccentColor();
  const isDarkMode = colorScheme === "dark";
  const t = isDarkMode ? Palette.dark : Palette.light;
  const shadow = isDarkMode ? Shadows.dark : Shadows.light;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: t.pageBg }}
    >
      <ThemedView
        style={styles.container}
        lightColor={Palette.light.pageBg}
        darkColor={Palette.dark.pageBg}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText
              style={styles.headerLabel}
              lightColor={Palette.light.textSubtle}
              darkColor={Palette.dark.textSubtle}
            >
              SETTINGS
            </ThemedText>
            <ThemedText
              style={styles.headerTitle}
              lightColor={Palette.light.textPrimary}
              darkColor={Palette.dark.textPrimary}
            >
              Preferences
            </ThemedText>
          </View>

          {/* Nickname Card */}
          <View
            style={[styles.card, { backgroundColor: t.cardBg }, shadow.card]}
          >
            <View style={styles.row}>
              <View>
                <ThemedText
                  style={styles.cardTitle}
                  lightColor={Palette.light.textPrimary}
                  darkColor={Palette.dark.textPrimary}
                >
                  Nickname
                </ThemedText>
                <ThemedText
                  style={styles.cardSubtitle}
                  lightColor={Palette.light.textSecondary}
                  darkColor={Palette.dark.textSecondary}
                >
                  This name will be shown on your home screen.
                </ThemedText>
              </View>
            </View>
            <TextInput
              value={nickname}
              onChangeText={(value) => {
                setNickname(value);
              }}
              placeholder="Enter your nickname"
              placeholderTextColor={t.inputPlaceholder}
              style={[
                styles.input,
                {
                  backgroundColor: t.inputBg,
                  color: t.inputText,
                  borderColor: t.border,
                },
              ]}
            />
          </View>

          {/* Appearance Card */}
          <View
            style={[styles.card, { backgroundColor: t.cardBg }, shadow.card]}
          >
            <View style={styles.row}>
              <View>
                <ThemedText
                  style={styles.cardTitle}
                  lightColor={Palette.light.textPrimary}
                  darkColor={Palette.dark.textPrimary}
                >
                  Appearance
                </ThemedText>
                <ThemedText
                  style={styles.cardSubtitle}
                  lightColor={Palette.light.textSecondary}
                  darkColor={Palette.dark.textSecondary}
                >
                  Choose your preferred theme
                </ThemedText>
              </View>
            </View>
            <View style={styles.themeRow}>
              <Pressable
                onPress={() => setSchemeSetting("light")}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor:
                      schemeSetting === "light" ? accentColor : t.chipBg,
                    borderWidth: 1,
                    borderColor:
                      schemeSetting === "light" ? accentColor : t.border,
                  },
                ]}
              >
                <ThemedText
                  style={styles.themeChipText}
                  lightColor={
                    schemeSetting === "light"
                      ? "#FFFFFF"
                      : Palette.light.textSecondary
                  }
                  darkColor={
                    schemeSetting === "light"
                      ? "#FFFFFF"
                      : Palette.dark.textSecondary
                  }
                >
                  ☀️ Light
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setSchemeSetting("dark")}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor:
                      schemeSetting === "dark" ? accentColor : t.chipBg,
                    borderWidth: 1,
                    borderColor:
                      schemeSetting === "dark" ? accentColor : t.border,
                  },
                ]}
              >
                <ThemedText
                  style={styles.themeChipText}
                  lightColor={
                    schemeSetting === "dark"
                      ? "#FFFFFF"
                      : Palette.light.textSecondary
                  }
                  darkColor={
                    schemeSetting === "dark"
                      ? "#FFFFFF"
                      : Palette.dark.textSecondary
                  }
                >
                  🌙 Dark
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setSchemeSetting("system")}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor:
                      schemeSetting === "system" ? accentColor : t.chipBg,
                    borderWidth: 1,
                    borderColor:
                      schemeSetting === "system" ? accentColor : t.border,
                  },
                ]}
              >
                <ThemedText
                  style={styles.themeChipText}
                  lightColor={
                    schemeSetting === "system"
                      ? "#FFFFFF"
                      : Palette.light.textSecondary
                  }
                  darkColor={
                    schemeSetting === "system"
                      ? "#FFFFFF"
                      : Palette.dark.textSecondary
                  }
                >
                  ⚙️ System
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Accent Color Card */}
          <View
            style={[styles.card, { backgroundColor: t.cardBg }, shadow.card]}
          >
            <View style={styles.row}>
              <View>
                <ThemedText
                  style={styles.cardTitle}
                  lightColor={Palette.light.textPrimary}
                  darkColor={Palette.dark.textPrimary}
                >
                  Accent Color
                </ThemedText>
                <ThemedText
                  style={styles.cardSubtitle}
                  lightColor={Palette.light.textSecondary}
                  darkColor={Palette.dark.textSecondary}
                >
                  {"Choose your app's primary color"}
                </ThemedText>
              </View>
            </View>
            <View style={styles.accentRow}>
              {options.map((option) => {
                const isSelected = accentId === option.id;
                const isWhite = option.id === "white";
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setAccentId(option.id)}
                    style={[
                      styles.accentSwatchWrapper,
                      { borderColor: isSelected ? accentColor : "transparent" },
                    ]}
                  >
                    <View
                      style={[
                        styles.accentSwatch,
                        { backgroundColor: option.swatch },
                        isWhite &&
                          !isSelected && {
                            borderWidth: 1,
                            borderColor: t.border,
                          },
                        isSelected && {
                          borderWidth: 3,
                          borderColor: "#FFFFFF",
                        },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 18,
  },
  header: {
    gap: 4,
  },
  headerLabel: {
    fontSize: 12,
    letterSpacing: 1.4,
    fontFamily: Fonts.rounded,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cardLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "600",
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  themeRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 14,
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  accentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  accentSwatchWrapper: {
    padding: 3,
    borderWidth: 2,
    borderRadius: 24,
    borderColor: "transparent",
  },
  accentSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
