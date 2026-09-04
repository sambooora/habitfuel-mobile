import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
 Image,
 Modal,
 ScrollView,
 StyleSheet,
 TouchableOpacity,
 View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import { TABBAR_SCROLL_PADDING } from "@/components/floating-tab-bar";
import { HabitHeatmap } from "@/components/habit-heatmap";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, Palette, Shadows } from "@/constants/theme";
// import { useAccentColor } from "@/hooks/use-accent-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
 getDateKey,
 HABIT_COLOR_OPTIONS,
 useHabitStorage,
} from "@/hooks/use-habit-storage";
import { useNickname } from "@/hooks/use-nickname";
import { usePomodoroStorage } from "@/hooks/use-pomodoro-storage";
import { useSplashDone } from "@/hooks/use-splash";
import {
 PRIORITY_CONFIG,
 TAG_CONFIG,
 useTaskStorage,
} from "@/hooks/use-task-storage";

/** Remembers the day the "all habits done" popup was last shown. */
const CONGRATS_STORAGE_KEY = "@habitfuel_last_congrats";

export default function HomeScreen() {
 const colorScheme = useColorScheme();
 const isDarkMode = colorScheme === "dark";
 const t = isDarkMode ? Palette.dark : Palette.light;
 const shadow = isDarkMode ? Shadows.dark : Shadows.light;
 // const { accentColor } = useAccentColor();
 const router = useRouter();
 const { getRecord, reload: reloadPomodoro } = usePomodoroStorage();
 const { nickname } = useNickname();
 const { tasks } = useTaskStorage();
 const {
  habits,
  isCompletedToday,
  toggleCompletion,
  overallHeatmap,
  activeDaysStreak,
  consistencyPercent,
 } = useHabitStorage();

 // ── Reload pomodoro data when tab gains focus ────────
 useFocusEffect(
  useCallback(() => {
   reloadPomodoro();
  }, [reloadPomodoro]),
 );

 const splashDone = useSplashDone();

 // ── Congratulations popup ─────────────────────────────
 const [showCongrats, setShowCongrats] = useState(false);

 // `undefined` while the last-shown date is still being read from storage.
 const [congratsDate, setCongratsDate] = useState<
  string | null | undefined
 >(undefined);

 const allHabitsDoneToday = useMemo(() => {
  if (habits.length === 0) return false;
  return habits.every((h) => isCompletedToday(h.id));
 }, [habits, isCompletedToday]);

 useEffect(() => {
  AsyncStorage.getItem(CONGRATS_STORAGE_KEY).then(setCongratsDate);
 }, []);

 // Habits can be unchecked and rechecked freely now, so the popup is gated
 // on the date instead of on a false→true transition. It fires once a day.
 useEffect(() => {
  if (congratsDate === undefined) return;
  if (!splashDone || !allHabitsDoneToday) return;

  const todayKey = getDateKey();
  if (congratsDate === todayKey) return;

  setCongratsDate(todayKey);
  AsyncStorage.setItem(CONGRATS_STORAGE_KEY, todayKey);
  setShowCongrats(true);
 }, [allHabitsDoneToday, congratsDate, splashDone]);

 // Resolve habit colors for dark mode
 const resolveHabitColors = (bg: string, iconColor: string) => {
  const match = HABIT_COLOR_OPTIONS.find((c) => c.bg === bg);
  if (match && isDarkMode) {
   return { bg: match.bgDark, icon: match.iconDark };
  }
  if (match) {
   return { bg: match.bg, icon: match.icon };
  }
  return { bg, icon: iconColor };
 };

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
   {/* ── Congratulations Modal ──────────────────────── */}
   <Modal
    visible={showCongrats}
    transparent
    animationType="fade"
    onRequestClose={() => setShowCongrats(false)}
   >
    <View style={styles.congratsOverlay}>
     <View
      style={[
       styles.congratsCard,
       { backgroundColor: t.cardBg },
       shadow.card,
      ]}
     >
      {/* Trophy icon */}
      <View
       style={[
        styles.congratsTrophyWrap,
        {
         backgroundColor: isDarkMode ? "#332C08" : "#FFF8E1",
        },
       ]}
      >
       <MaterialIcons name="emoji-events" size={48} color="#D4B534" />
      </View>

      <ThemedText
       style={styles.congratsTitle}
       lightColor={Palette.light.textPrimary}
       darkColor={Palette.dark.textPrimary}
      >
       Congratulations! 🎉
      </ThemedText>

      <ThemedText
       style={styles.congratsBody}
       lightColor={Palette.light.textSecondary}
       darkColor={Palette.dark.textSecondary}
      >
       {
        "You've completed all your habits for today! Keep up the amazing work — consistency is the key to greatness! 🔥"
       }
      </ThemedText>

      {/* Streak badge */}
      {activeDaysStreak > 0 && (
       <View
        style={[
         styles.congratsStreakBadge,
         {
          backgroundColor: t.chipBg,
         },
        ]}
       >
        <MaterialIcons
         name="local-fire-department"
         size={16}
         color={t.textPrimary}
        />
        <ThemedText
         style={[styles.congratsStreakText, { color: t.textPrimary }]}
        >
         {activeDaysStreak}-day streak!
        </ThemedText>
       </View>
      )}

      <TouchableOpacity
       style={[
        styles.congratsBtn,
        { backgroundColor: isDarkMode ? "#252930" : "#F0F2F4" },
       ]}
       activeOpacity={0.8}
       onPress={() => setShowCongrats(false)}
      >
       <ThemedText style={styles.congratsBtnText}>
        Awesome! 🚀
       </ThemedText>
      </TouchableOpacity>
     </View>
    </View>
   </Modal>

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
      <Image
       source={require("@/assets/images/icon.png")}
       style={styles.appLogo}
      />
     </View>

     {/* ── Consistency Card ────────────────────────────── */}
     <View
      style={[
       styles.card,
       { backgroundColor: t.cardBg },
       shadow.card,
      ]}
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
       <ThemedText
        style={styles.cardTitle}
        lightColor={Palette.light.textSubtle}
        darkColor={Palette.dark.textSubtle}
       >
        LAST MONTH
       </ThemedText>
      </View>

      {/* Score + last-month heatmap side by side. The score is a rolling
                69-day completion rate, so a missed habit lowers it instead of
                wiping it out. */}
      <View style={styles.scoreRow}>
       <View style={styles.scoreLeft}>
        <ThemedText
         style={styles.scoreValue}
         lightColor={Palette.light.textPrimary}
         darkColor={Palette.dark.textPrimary}
         numberOfLines={1}
         adjustsFontSizeToFit
        >
         {consistencyPercent}%
        </ThemedText>
        <ThemedText
         style={styles.subtleText}
         lightColor={Palette.light.textSubtle}
         darkColor={Palette.dark.textSubtle}
        >
         {activeDaysStreak > 0
          ? `${activeDaysStreak}-day active streak 🔥`
          : "No streak yet"}
        </ThemedText>
       </View>
       <HabitHeatmap
        cells={overallHeatmap}
        accent={t.chartBarPrimary}
        emptyColor={t.progressTrack}
        labelColor={t.textSubtle}
        todayRingColor={t.textSecondary}
        cellSize={10}
        gap={3}
       />
      </View>

      {/* Progress bar mirrors the rolling 69-day rate */}
      <View
       style={[
        styles.progressTrack,
        { backgroundColor: t.progressTrack },
       ]}
      >
       <View
        style={[
         styles.progressFill,
         {
          backgroundColor: t.progressFill,
          width: `${consistencyPercent}%`,
         },
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
         style={[
          styles.weekDate,
          day.active && styles.weekDateActive,
         ]}
         lightColor={
          day.active
           ? Palette.light.weekDateActiveText
           : Palette.light.weekDateText
         }
         darkColor={
          day.active
           ? Palette.dark.weekDayActiveText
           : Palette.dark.weekDayText
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
      <TouchableOpacity
       onPress={() => router.push("/habits")}
       activeOpacity={0.6}
      >
       <ThemedText
        style={styles.sectionLink}
        lightColor={Palette.light.textSubtle}
        darkColor={Palette.dark.textSubtle}
       >
        View All
       </ThemedText>
      </TouchableOpacity>
     </View>

     <View
      style={[
       styles.card,
       { backgroundColor: t.cardBg },
       shadow.card,
      ]}
     >
      <ScrollView
       horizontal
       showsHorizontalScrollIndicator={false}
       contentContainerStyle={styles.habitScroll}
      >
       {habits.map((habit) => {
        const done = isCompletedToday(habit.id);
        const colors = resolveHabitColors(
         habit.background,
         habit.iconColor,
        );
        return (
         <TouchableOpacity
          key={habit.id}
          style={styles.habitItem}
          activeOpacity={0.7}
          onPress={() => toggleCompletion(habit.id)}
         >
          <View
           style={[
            styles.habitIcon,
            { backgroundColor: colors.bg },
            done && styles.habitIconDone,
           ]}
          >
           {done ? (
            <MaterialIcons
             name="check"
             size={20}
             color={t.textPrimary}
            />
           ) : (
            <MaterialIcons
             name={habit.icon as any}
             size={18}
             color={colors.icon}
            />
           )}
          </View>
          <ThemedText
           style={[styles.habitLabel, done && styles.habitLabelDone]}
           lightColor={
            done ? t.textPrimary : Palette.light.textSecondary
           }
           darkColor={
            done ? t.textPrimary : Palette.dark.textSecondary
           }
          >
           {habit.label}
          </ThemedText>
         </TouchableOpacity>
        );
       })}
      </ScrollView>
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
       <View
        style={[styles.countBadge, { backgroundColor: t.chipBg }]}
       >
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
      {focusTasks.length === 0 ? (
       <View
        style={[
         styles.emptyState,
         { backgroundColor: t.cardBg },
         shadow.card,
        ]}
       >
        <MaterialIcons
         name="check-circle-outline"
         size={36}
         color={t.textSubtle}
         style={{ marginBottom: 8 }}
        />
        <ThemedText
         style={styles.emptyTitle}
         lightColor={Palette.light.textPrimary}
         darkColor={Palette.dark.textPrimary}
        >
         No Focus Tasks
        </ThemedText>
        <ThemedText
         style={styles.emptySubtitle}
         lightColor={Palette.light.textSubtle}
         darkColor={Palette.dark.textSubtle}
        >
         Add a high or urgent priority task to start a focus session.
        </ThemedText>
       </View>
      ) : (
       focusTasks.map((task) => {
        const priorityConfig = PRIORITY_CONFIG[task.priority];
        const tagConfig = TAG_CONFIG[task.tag];
        const record = getRecord(task.id, task.priority);
        const required = record.requiredSessions;
        const completedSessions = record.completedSessions;
        const allDone = completedSessions >= required;

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
           <View style={styles.taskBadgeRow}>
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
            {/* Pomodoro session progress badge */}
            <View
             style={[
              styles.sessionBadge,
              {
               backgroundColor: t.chipBg,
              },
             ]}
            >
             <MaterialIcons
              name="timer"
              size={10}
              color={allDone ? t.textPrimary : t.textSubtle}
             />
             <ThemedText
              style={[
               styles.sessionBadgeText,
               { color: allDone ? t.textPrimary : t.textSubtle },
              ]}
             >
              {completedSessions}/{required}
             </ThemedText>
            </View>
           </View>
          </View>
          <TouchableOpacity
           style={[styles.playButton, { backgroundColor: t.playBg }]}
           activeOpacity={0.7}
           onPress={() =>
            router.push({
             pathname: "/pomodoro",
             params: {
              taskId: task.id,
              taskTitle: task.title,
              taskPriority: task.priority,
             },
            })
           }
          >
           <MaterialIcons
            name="play-arrow"
            size={18}
            color={t.playIcon}
           />
          </TouchableOpacity>
         </View>
        );
       })
      )}
     </View>
    </ScrollView>
   </ThemedView>
  </SafeAreaView>
 );
}

const styles = StyleSheet.create({
 // ── Congratulations Modal ──────────────────────────────
 congratsOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.55)",
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 24,
 },
 congratsCard: {
  borderRadius: 24,
  paddingHorizontal: 28,
  paddingTop: 32,
  paddingBottom: 28,
  alignItems: "center",
  width: "100%",
  gap: 14,
 },
 congratsTrophyWrap: {
  width: 88,
  height: 88,
  borderRadius: 44,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 4,
 },
 congratsTitle: {
  fontSize: 22,
  fontWeight: "700",
  textAlign: "center",
  letterSpacing: 0.2,
 },
 congratsBody: {
  fontSize: 14,
  textAlign: "center",
  lineHeight: 22,
 },
 congratsStreakBadge: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 14,
  paddingVertical: 7,
  borderRadius: 20,
 },
 congratsStreakText: {
  fontSize: 13,
  fontWeight: "600",
 },
 congratsBtn: {
  height: 48,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  marginTop: 6,
 },
 congratsBtnText: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "700",
 },

 container: {
  flex: 1,
 },
 content: {
  paddingHorizontal: 20,
  paddingTop: 16,
  paddingBottom: TABBAR_SCROLL_PADDING,
  gap: 20,
 },

 // ── Header ──────────────────────────────────────────────────
 header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
 },
 appLogo: {
  width: 48,
  height: 48,
  borderRadius: 12,
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
 progressTrack: {
  height: 6,
  borderRadius: 99,
 },
 progressFill: {
  height: 6,
  borderRadius: 99,
  minWidth: 6,
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
 habitScroll: {
  flexDirection: "row",
  gap: 16,
  paddingHorizontal: 4,
 },
 habitItem: {
  alignItems: "center",
  gap: 4,
  minWidth: 56,
 },
 habitIcon: {
  width: 52,
  height: 52,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
 },
 habitIconDone: {
  borderWidth: 2,
  borderColor: "#9AA0A8",
 },
 habitLabel: {
  fontSize: 11,
  fontWeight: "500",
 },
 habitLabelDone: {
  fontWeight: "700",
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
  gap: 10,
 },
 taskBadgeRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
 },
 emptyState: {
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 32,
  paddingHorizontal: 24,
  borderRadius: 16,
  width: "100%",
 },
 emptyTitle: {
  fontSize: 15,
  fontWeight: "600",
  marginBottom: 4,
 },
 emptySubtitle: {
  fontSize: 13,
  textAlign: "center",
  lineHeight: 18,
 },
 sessionBadge: {
  flexDirection: "row",
  alignItems: "center",
  gap: 3,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 6,
 },
 sessionBadgeText: {
  fontSize: 10,
  fontWeight: "600",
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
