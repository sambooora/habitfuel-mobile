// @ts-nocheck
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  DeviceEventEmitter,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Palette } from "@/constants/theme";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useColorScheme } from "@/hooks/use-color-scheme";

const TAB_HEIGHT = 64;
const ADD_BTN_SIZE = 64;

/** Routes that show the standalone "add" button on the right. */
const ADD_BUTTON_ROUTES = new Set(["tasks", "finances"]);

/**
 * Event name pages should listen to in order to open their "add" flow.
 * Example: `DeviceEventEmitter.addListener("tabbar:add:tasks", handler)`
 */
export const TABBAR_ADD_EVENT = (routeName: string) =>
  `tabbar:add:${routeName}`;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const t = isDark ? Palette.dark : Palette.light;
  const { accentColor } = useAccentColor();

  const currentRouteName = state.routes[state.index]?.name;
  const showAddButton = ADD_BUTTON_ROUTES.has(currentRouteName);

  const borderColor = isDark
    ? "rgba(255,255,255,0.07)"
    : "rgba(255,255,255,0.8)";
  const overlayColor = isDark
    ? "rgba(13,14,17,0.45)"
    : "rgba(255,255,255,0.35)";
  const shadowOpacity = isDark ? 0.5 : 0.14;

  const handleAddPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    DeviceEventEmitter.emit(TABBAR_ADD_EVENT(currentRouteName));
  };

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom }]}>
      {/* ─── Main pill tab bar ─────────────────────────────────── */}
      <View
        style={[
          styles.mainShadow,
          { shadowColor: "#000", shadowOpacity },
        ]}
      >
        <View style={[styles.mainClip, { borderColor }]}>
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: overlayColor },
            ]}
          />

          <View style={styles.tabsRow}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const label = (options.title ?? route.name) as string;

              const iconEl = options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? accentColor : t.tabIconDefault,
                size: 22,
              });

              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({ type: "tabLongPress", target: route.key });
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  style={styles.tabItem}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isFocused }}
                  accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      isFocused && { backgroundColor: accentColor + "22" },
                    ]}
                  >
                    {iconEl}
                  </View>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.label,
                      {
                        color: isFocused ? accentColor : t.tabIconDefault,
                        fontWeight: isFocused ? "700" : "500",
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ─── Standalone "add" button ───────────────────────────── */}
      {showAddButton && (
        <View
          style={[
            styles.addShadow,
            { shadowColor: "#000", shadowOpacity },
          ]}
        >
          <View style={[styles.addClip, { borderColor }]}>
            <BlurView
              intensity={isDark ? 60 : 80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: overlayColor },
              ]}
            />
            <TouchableOpacity
              onPress={handleAddPress}
              activeOpacity={0.75}
              style={styles.addBtnHit}
              accessibilityRole="button"
              accessibilityLabel={`Add ${currentRouteName}`}
            >
              <MaterialIcons name="add" size={28} color={accentColor} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    // `bottom` is injected inline from safe-area inset
  },

  // Main pill
  mainShadow: {
    flex: 1,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 20,
  },
  mainClip: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    height: TAB_HEIGHT,
  },
  tabsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 42,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },

  // Standalone add button
  addShadow: {
    width: ADD_BTN_SIZE,
    height: ADD_BTN_SIZE,
    borderRadius: ADD_BTN_SIZE / 2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 20,
  },
  addClip: {
    width: ADD_BTN_SIZE,
    height: ADD_BTN_SIZE,
    borderRadius: ADD_BTN_SIZE / 2,
    overflow: "hidden",
    borderWidth: 1,
  },
  addBtnHit: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
