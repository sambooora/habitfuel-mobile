import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, Palette, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNickname } from "@/hooks/use-nickname";
import {
  PRIORITY_CONFIG,
  TAG_CONFIG,
  useTaskStorage,
} from "@/hooks/use-task-storage";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const t = isDarkMode ? Palette.dark : Palette.light;
  const shadow = isDarkMode ? Shadows.dark : Shadows.light;

  const { nickname } = useNickname();
  const { tasks } = useTaskStorage();

  // Filter high + urgent tasks that are not done, sorted urgent first then high
  const focusTasks = useMemo(() => {
    return tasks
      .filter(
        (task) =>
          (task.priority === "urgent" || task.priority === "high") &&
          task.status !== "done",
      )
      .sort((a, b) => {
        const order = { urgent: 0, high: 1 };
        return (
          order[a.priority as "urgent" | "high"] -
          order[b.priority as "urgent" | "high"]
        );
      })
      .slice(0, 5);
  }, [tasks]);

  const habits = [
    {
      label: "Water",
      icon: "water-drop",
      background: isDarkMode ? "#1A2E42" : "#E8F3FF",
      iconColor: isDarkMode ? "#5BA8F5" : "#2B7BD4",
    },
    {
      label: "Mind",
      icon: "self-improvement",
      background: isDarkMode ? "#2A2140" : "#F1EDFF",
      iconColor: isDarkMode ? "#A78BF5" : "#6B4DC7",
    },
    {
      label: "Read",
      icon: "menu-book",
      background: isDarkMode ? "#3A2A1A" : "#FFF1E7",
      iconColor: isDarkMode ? "#E8A050" : "#C47020",
    },
    {
      label: "Gym",
      icon: "fitness-center",
      background: isDarkMode ? "#1A3028" : "#EAF8F1",
      iconColor: isDarkMode ? "#50C090" : "#1A8A55",
    },
  ];

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    // start from today - 3 days so today is roughly in the middle
    d.setDate(today.getDate() - 3 + i);
    const isActive = d.toDateString() === today.toDateString();
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: String(d.getDate()),
      active: isActive,
    };
  });

  const todayLabel = today
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();

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
          {/* ── Header ─────────────────────────────────────── */}
          <View style={styles.header}>
            <View>
              <ThemedText
                style={styles.dateLabel}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                {todayLabel}
              </ThemedText>
              <ThemedText
                style={styles.greeting}
                lightColor={Palette.light.textPrimary}
                darkColor={Palette.dark.textPrimary}
              >
                Hello, {nickname || "User"}!
              </ThemedText>
            </View>
            <View style={[styles.avatar, { backgroundColor: t.avatarBg }]} />
          </View>

          {/* ── Consistency Card ────────────────────────────── */}
          <View
            style={[styles.card, { backgroundColor: t.cardBg }, shadow.card]}
          >
            {/* Top row: label + badge */}
            <View style={styles.cardHeader}>
              <ThemedText
                style={styles.cardTitle}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                CONSISTENCY SCORE
              </ThemedText>
              <View style={[styles.badge, { backgroundColor: t.badgeBg }]}>
                <ThemedText
                  style={styles.badgeText}
                  lightColor={Palette.light.badgeText}
                  darkColor={Palette.dark.badgeText}
                >
                  +12%
                </ThemedText>
              </View>
            </View>

            {/* Score + mini chart side by side */}
            <View style={styles.scoreRow}>
              <View style={styles.scoreLeft}>
                <ThemedText
                  style={styles.scoreValue}
                  lightColor={Palette.light.textPrimary}
                  darkColor={Palette.dark.textPrimary}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  85%
                </ThemedText>
                <ThemedText
                  style={styles.subtleText}
                  lightColor={Palette.light.textSubtle}
                  darkColor={Palette.dark.textSubtle}
                >
                  5-day streak 🔥
                </ThemedText>
              </View>
              <View style={styles.chart}>
                {[16, 22, 28, 20].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.chartBar,
                      { height: h, backgroundColor: t.chartBarPrimary },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Progress bar */}
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: t.progressTrack },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: t.progressFill },
                ]}
              />
            </View>
          </View>

          {/* ── Week Days ──────────────────────────────────── */}
          <View style={styles.weekRow}>
            {weekDays.map((day) => (
              <View
                key={day.label + day.date}
                style={[
                  styles.weekDay,
                  {
                    backgroundColor: day.active
                      ? t.weekDayActiveBg
                      : t.weekDayBg,
                  },
                  !day.active && shadow.cardSubtle,
                ]}
              >
                <ThemedText
                  style={[
                    styles.weekLabel,
                    day.active && styles.weekLabelActive,
                  ]}
                  lightColor={
                    day.active
                      ? Palette.light.weekDayActiveText
                      : Palette.light.weekDayText
                  }
                  darkColor={
                    day.active
                      ? Palette.dark.weekDayActiveText
                      : Palette.dark.weekDayText
                  }
                >
                  {day.label}
                </ThemedText>
                <ThemedText
                  style={[styles.weekDate, day.active && styles.weekDateActive]}
                  lightColor={
                    day.active
                      ? Palette.light.weekDateActiveText
                      : Palette.light.weekDateText
                  }
                  darkColor={
                    day.active
                      ? Palette.dark.weekDateActiveText
                      : Palette.dark.weekDateText
                  }
                >
                  {day.date}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* ── Daily Habits ───────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <ThemedText
              style={styles.sectionTitle}
              lightColor={Palette.light.textPrimary}
              darkColor={Palette.dark.textPrimary}
            >
              Daily Habits
            </ThemedText>
            <ThemedText
              style={styles.sectionLink}
              lightColor={Palette.light.textSubtle}
              darkColor={Palette.dark.textSubtle}
            >
              View All
            </ThemedText>
          </View>

          <View
            style={[styles.card, { backgroundColor: t.cardBg }, shadow.card]}
          >
            <View style={styles.habitRow}>
              {habits.map((habit) => (
                <View key={habit.label} style={styles.habitItem}>
                  <View
                    style={[
                      styles.habitIcon,
                      { backgroundColor: habit.background },
                    ]}
                  >
                    <MaterialIcons
                      name={habit.icon as any}
                      size={18}
                      color={habit.iconColor}
                    />
                  </View>
                  <ThemedText
                    style={styles.habitLabel}
                    lightColor={Palette.light.textSecondary}
                    darkColor={Palette.dark.textSecondary}
                  >
                    {habit.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* ── Focus Tasks ────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <ThemedText
              style={styles.sectionTitle}
              lightColor={Palette.light.textPrimary}
              darkColor={Palette.dark.textPrimary}
            >
              Focus Tasks
            </ThemedText>
            {focusTasks.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: t.chipBg }]}>
                <ThemedText
                  style={styles.countBadgeText}
                  lightColor={Palette.light.textSecondary}
                  darkColor={Palette.dark.textSecondary}
                >
                  {focusTasks.length} tasks
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.taskList}>
            {focusTasks.map((task) => {
              const priorityConfig = PRIORITY_CONFIG[task.priority];
              const tagConfig = TAG_CONFIG[task.tag];

              return (
                <View
                  key={task.id}
                  style={[
                    styles.taskCard,
                    { backgroundColor: t.cardBg },
                    shadow.card,
                  ]}
                >
                  <View
                    style={[
                      styles.taskIconWrap,
                      { backgroundColor: t.taskIconBg },
                    ]}
                  >
                    <MaterialIcons
                      name={tagConfig.icon as any}
                      size={18}
                      color={t.taskIconColor}
                    />
                  </View>
                  <View style={styles.taskInfo}>
                    <ThemedText
                      style={styles.taskTitle}
                      lightColor={Palette.light.textPrimary}
                      darkColor={Palette.dark.textPrimary}
                      numberOfLines={1}
                    >
                      {task.title}
                    </ThemedText>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: priorityConfig.bgColor },
                      ]}
                    >
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: priorityConfig.color },
                        ]}
                      />
                      <ThemedText
                        style={[
                          styles.priorityLabel,
                          { color: priorityConfig.color },
                        ]}
                      >
                        {priorityConfig.label}
                      </ThemedText>
                    </View>
                  </View>
                  <View
                    style={[styles.playButton, { backgroundColor: t.playBg }]}
                  >
                    <MaterialIcons
                      name="play-arrow"
                      size={18}
                      color={t.playIcon}
                    />
                  </View>
                </View>
              );
            })}
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
    gap: 20,
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateLabel: {
    fontSize: 12,
    letterSpacing: 1.4,
    fontFamily: Fonts.rounded,
  },
  greeting: {
    fontSize: 26,
    marginTop: 4,
    fontFamily: Fonts.rounded,
    fontWeight: "700",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  // ── Consistency Card ────────────────────────────────────────
  card: {
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: Fonts.rounded,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  scoreLeft: {
    flex: 1,
    gap: 4,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: "800",
    lineHeight: 44,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  chartBar: {
    width: 6,
    borderRadius: 99,
  },
  progressTrack: {
    height: 6,
    borderRadius: 99,
  },
  progressFill: {
    width: "70%",
    height: 6,
    borderRadius: 99,
  },
  subtleText: {
    fontSize: 12,
  },

  // ── Week Days ───────────────────────────────────────────────
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekDay: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    flex: 1,
    marginHorizontal: 3,
  },
  weekLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weekLabelActive: {
    fontWeight: "600",
  },
  weekDate: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  weekDateActive: {
    fontWeight: "700",
  },

  // ── Section Headers ─────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionLink: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  // ── Habits ──────────────────────────────────────────────────
  habitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  habitItem: {
    alignItems: "center",
    gap: 3,
  },
  habitIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  habitLabel: {
    fontSize: 12,
  },

  // ── Count Badge ─────────────────────────────────────────────
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Task List ───────────────────────────────────────────────
  taskList: {
    gap: 12,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    gap: 12,
  },
  taskIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  taskInfo: {
    flex: 1,
    gap: 5,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Priority badge
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  playButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
