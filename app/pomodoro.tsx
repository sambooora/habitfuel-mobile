// @ts-nocheck
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Button,
  Input,
  ScrollView as TScrollView,
  Text,
  XStack,
  YStack,
} from "tamagui";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Brand, Palette, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAccentColor } from "@/hooks/use-accent-color";
import {
  getRequiredSessions,
  usePomodoroStorage,
} from "@/hooks/use-pomodoro-storage";
import { useTaskStorage } from "@/hooks/use-task-storage";

type Phase = "focus" | "short_break" | "long_break";

const PHASE_LABEL: Record<Phase, string> = {
  focus: "Focus Time",
  short_break: "Short Break",
  long_break: "Long Break",
};

// Ring geometry
const RING_SIZE = 240;
const RING_BORDER = 8;
const HALF = RING_SIZE / 2;

export default function PomodoroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    taskId: string;
    taskTitle: string;
    taskPriority: string;
  }>();

  const taskId = params.taskId ?? "";
  const taskTitle = params.taskTitle ?? "Unnamed Task";
  const taskPriority = params.taskPriority ?? "medium";

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const t = isDarkMode ? Palette.dark : Palette.light;
  const shadow = isDarkMode ? Shadows.dark : Shadows.light;
  const { accentColor, accentOnColor } = useAccentColor();

  const { settings, getRecord, recordCompletedSession, updateSettings } =
    usePomodoroStorage();
  const { updateTask } = useTaskStorage();

  // Timer state
  const [phase, setPhase] = useState<Phase>("focus");
  const [secondsLeft, setSecondsLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(
    () => getRecord(taskId, taskPriority).completedSessions,
  );
  const [progress, setProgress] = useState(1);

  // Settings sheet
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editFocus, setEditFocus] = useState(String(settings.focusDuration));
  const [editRequiredSessions, setEditRequiredSessions] = useState(
    String(settings.requiredSessions ?? 2),
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = useRef(settings.focusDuration * 60);

  const durationForPhase = useCallback(
    (p: Phase): number => {
      if (p === "focus") return settings.focusDuration * 60;
      if (p === "short_break") return settings.shortBreakDuration * 60;
      return settings.longBreakDuration * 60;
    },
    [settings],
  );

  const transitionToPhase = useCallback(
    (nextPhase: Phase, nextIdx: number) => {
      const dur = durationForPhase(nextPhase);
      totalSeconds.current = dur;
      setPhase(nextPhase);
      setSecondsLeft(dur);
      setSessionIndex(nextIdx);
      setIsRunning(false);
      setProgress(1);
    },
    [durationForPhase],
  );

  const onFocusSessionComplete = useCallback(async () => {
    Vibration.vibrate([0, 300, 100, 300]);
    const newCompleted = completedFocusSessions + 1;
    setCompletedFocusSessions(newCompleted);
    await recordCompletedSession(taskId, taskPriority);

    const rec = getRecord(taskId, taskPriority);
    const required = rec?.requiredSessions ?? getRequiredSessions(taskPriority);
    const nextIdx = sessionIndex + 1;
    const isLong = nextIdx % settings.sessionsBeforeLongBreak === 0;
    const remaining = required - newCompleted;

    if (newCompleted >= required) {
      Alert.alert(
        "🎉 Congratulations!",
        `You've completed all ${required} session${required > 1 ? "s" : ""}!\n\nGreat focus work on "${taskTitle}".\nThis task will be marked as done.`,
        [
          {
            text: "Awesome!",
            onPress: async () => {
              await updateTask(taskId, { status: "done" });
              router.dismiss();
              router.replace("/(tabs)/tasks");
            },
          },
        ],
        { cancelable: false },
      );
      return;
    } else {
      Alert.alert(
        "Session Complete",
        `${remaining} more session${remaining > 1 ? "s" : ""} needed.\nTake a ${isLong ? "long" : "short"} break?`,
        [
          {
            text: "Skip Break",
            onPress: () => transitionToPhase("focus", nextIdx),
          },
          {
            text: "Start Break",
            onPress: () =>
              transitionToPhase(isLong ? "long_break" : "short_break", nextIdx),
          },
        ],
      );
    }
  }, [
    completedFocusSessions,
    sessionIndex,
    settings,
    taskId,
    taskTitle,
    taskPriority,
    getRecord,
    recordCompletedSession,
    updateTask,
    transitionToPhase,
    router,
  ]);

  const onBreakComplete = useCallback(() => {
    Vibration.vibrate([0, 200]);
    Alert.alert("Break Over!", "Ready to focus again?", [
      {
        text: "Start Focus",
        onPress: () => transitionToPhase("focus", sessionIndex),
      },
    ]);
  }, [sessionIndex, transitionToPhase]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          const next = prev - 1;
          setProgress(
            totalSeconds.current > 0 ? next / totalSeconds.current : 1,
          );
          if (next <= 0) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            if (phase === "focus") onFocusSessionComplete();
            else onBreakComplete();
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, phase, onFocusSessionComplete, onBreakComplete]);

  useEffect(() => {
    if (!isRunning) {
      const dur = durationForPhase(phase);
      totalSeconds.current = dur;
      setSecondsLeft(dur);
      setProgress(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handlePlayPause = useCallback(() => setIsRunning((r) => !r), []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    const dur = durationForPhase(phase);
    totalSeconds.current = dur;
    setSecondsLeft(dur);
    setProgress(1);
  }, [phase, durationForPhase]);

  const handleStop = useCallback(() => {
    Alert.alert("Stop Session?", "This will end the current session.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Stop",
        style: "destructive",
        onPress: () => {
          setIsRunning(false);
          router.back();
        },
      },
    ]);
  }, [router]);

  const handleSaveSettings = useCallback(async () => {
    // Focus duration editable by user
    const focus = Math.max(1, Math.min(90, parseInt(editFocus) || 5));
    // Short and long breaks are static per new rule
    const short = 2;
    const long = 5;
    // Required sessions (to complete a task)
    const required = Math.max(
      1,
      Math.min(12, parseInt(editRequiredSessions) || 2),
    );
    await updateSettings({
      focusDuration: focus,
      // enforce static break durations
      shortBreakDuration: short,
      longBreakDuration: long,
      requiredSessions: required,
    });
    // Reflect saved values in local edit state
    setEditFocus(String(focus));
    setEditRequiredSessions(String(required));
    setSettingsOpen(false);
  }, [editFocus, editRequiredSessions, updateSettings]);

  // Derived display values
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const record = getRecord(taskId, taskPriority);
  const required =
    record?.requiredSessions ?? getRequiredSessions(taskPriority);

  const phaseColor = isDarkMode
    ? phase === "focus"
      ? Palette.dark.textPrimary
      : phase === "short_break"
        ? Brand.successLight
        : accentColor
    : phase === "focus"
      ? "#111318"
      : phase === "short_break"
        ? "#0A8F5A"
        : "#3B7BF2";

  const trackColor = isDarkMode ? "#2E333A" : "#E8EAED";

  // Two-half arc: progress 1=full, 0=empty
  // Right half reveals 0→180°, left half reveals 180→360°
  const rightDeg = progress > 0.5 ? (progress - 0.5) * 360 : 0;
  const leftDeg = progress >= 0.5 ? 180 : progress * 360;

  const insets = useSafeAreaInsets();

  return (
    <ThemedView
      style={styles.root}
      lightColor={Palette.light.pageBg}
      darkColor={Palette.dark.pageBg}
    >
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safe}>
        {/* Nav */}
        <View style={[styles.navBar, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            onPress={() => {
              if (isRunning) {
                Alert.alert(
                  "Timer Running",
                  "Pause the timer before leaving.",
                  [{ text: "OK" }],
                );
                return;
              }
              router.back();
            }}
            style={[styles.navBtn, { zIndex: 1000, elevation: 8 }]}
            hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
            activeOpacity={0.6}
          >
            <MaterialIcons name="arrow-back" size={22} color={t.textPrimary} />
          </TouchableOpacity>

          <ThemedText
            style={styles.navTitle}
            lightColor={Palette.light.textSubtle}
            darkColor={Palette.dark.textSubtle}
          >
            FOCUS MODE
          </ThemedText>

          <TouchableOpacity
            onPress={() => {
              if (isRunning) {
                Alert.alert(
                  "Timer Running",
                  "Pause the timer to change settings.",
                  [{ text: "OK" }],
                );
                return;
              }
              setEditFocus(String(settings.focusDuration));
              setEditRequiredSessions(String(settings.requiredSessions ?? 2));
              setSettingsOpen(true);
            }}
            style={[styles.navBtn, { zIndex: 1000, elevation: 8 }]}
            hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
            activeOpacity={0.6}
          >
            <MaterialIcons name="settings" size={22} color={t.textSubtle} />
          </TouchableOpacity>
        </View>

        {/* Body — flex column, no ScrollView so nothing can be cut off */}
        <View style={styles.body}>
          {/* ── Ring timer ── */}
          <View style={styles.ringWrap}>
            {/* Track */}
            <View style={[styles.ringTrack, { borderColor: trackColor }]} />

            {/* Right-half arc (reveals first 0→180°) */}
            <View style={[styles.halfClip, { left: HALF }]}>
              <View
                style={[
                  styles.halfCircle,
                  {
                    left: -HALF,
                    borderColor: phaseColor,
                    borderWidth: RING_BORDER,
                    transform: [{ rotate: `${rightDeg - 180}deg` }],
                  },
                ]}
              />
            </View>

            {/* Left-half arc (reveals next 180→360°) */}
            <View style={[styles.halfClip, { left: 0 }]}>
              <View
                style={[
                  styles.halfCircle,
                  {
                    left: 0,
                    borderColor: phaseColor,
                    borderWidth: RING_BORDER,
                    transform: [{ rotate: `${leftDeg - 180}deg` }],
                  },
                ]}
              />
            </View>

            {/* Time — absolutely centered inside ring */}
            <View style={styles.ringCenter}>
              <ThemedText
                style={[styles.timeDisplay, { color: phaseColor }]}
                lightColor={phaseColor}
                darkColor={phaseColor}
              >
                {timeStr}
              </ThemedText>
              <ThemedText
                style={styles.timeLabel}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                MINUTES REMAINING
              </ThemedText>
            </View>
          </View>

          {/* ── Current task card ── */}
          <View
            style={[
              styles.taskCard,
              { backgroundColor: t.cardBg },
              shadow.card,
            ]}
          >
            <View
              style={[styles.taskIconWrap, { backgroundColor: t.taskIconBg }]}
            >
              <MaterialIcons
                name="format-list-bulleted"
                size={18}
                color={t.taskIconColor}
              />
            </View>
            <View style={styles.taskTextWrap}>
              <ThemedText
                style={styles.taskLabel}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                CURRENT TASK
              </ThemedText>
              <ThemedText
                style={styles.taskTitle}
                lightColor={Palette.light.textPrimary}
                darkColor={Palette.dark.textPrimary}
                numberOfLines={1}
              >
                {taskTitle}
              </ThemedText>
            </View>
          </View>

          {/* ── Controls ── */}
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={handleReset}
              style={[
                styles.ctrlSmall,
                { backgroundColor: isDarkMode ? "#252930" : "#F0F2F4" },
              ]}
              activeOpacity={0.6}
            >
              <MaterialIcons name="replay" size={22} color={t.textSubtle} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePlayPause}
              style={[styles.ctrlMain, { backgroundColor: phaseColor }]}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={isRunning ? "pause" : "play-arrow"}
                size={32}
                color={isDarkMode ? "#252930" : "#FFFFFF"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStop}
              style={[
                styles.ctrlSmall,
                { backgroundColor: isDarkMode ? "#252930" : "#F0F2F4" },
              ]}
              activeOpacity={0.6}
            >
              <MaterialIcons name="stop" size={20} color={t.textSubtle} />
            </TouchableOpacity>
          </View>

          {/* ── Session row ── */}
          <View style={styles.sessionRow}>
            <ThemedText
              style={styles.sessionText}
              lightColor={Palette.light.textSubtle}
              darkColor={Palette.dark.textSubtle}
            >
              Session {completedFocusSessions + (phase === "focus" ? 1 : 0)} of{" "}
              {required}
            </ThemedText>
            <ThemedText style={[styles.sessionPhase, { color: phaseColor }]}>
              {PHASE_LABEL[phase]}
            </ThemedText>
          </View>

          {/* ── Dots ── */}
          <View style={styles.dotsRow}>
            {Array.from({ length: required }).map((_, i) => {
              const done = i < completedFocusSessions;
              const active =
                phase === "focus" && i === completedFocusSessions && isRunning;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      flex: 1,
                      backgroundColor: done
                        ? phaseColor
                        : active
                          ? phaseColor + "80"
                          : isDarkMode
                            ? "#2E333A"
                            : "#E0E2E6",
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* ── Hint ── */}
          <ThemedText
            style={styles.hint}
            lightColor={Palette.light.textSubtle}
            darkColor={Palette.dark.textSubtle}
          >
            {completedFocusSessions >= required
              ? "All sessions done! You can mark this task complete."
              : phase === "focus"
                ? isRunning
                  ? "Stay focused. You've got this!"
                  : "Press play to start your focus session."
                : "Rest your eyes. You've earned it."}
          </ThemedText>
        </View>

        {/* Settings Modal */}
        <Modal
          visible={settingsOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setSettingsOpen(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalFrame, { backgroundColor: t.cardBg }]}>
                <TScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    marginBottom="$5"
                  >
                    <Text fontSize={20} fontWeight="700">
                      Timer Settings
                    </Text>
                    <Button
                      unstyled
                      onPress={() => setSettingsOpen(false)}
                      padding="$1"
                    >
                      <MaterialIcons
                        name="close"
                        size={24}
                        color={t.textSubtle}
                      />
                    </Button>
                  </XStack>

                  {[
                    {
                      label: "Focus Duration (min)",
                      value: editFocus,
                      setter: setEditFocus,
                    },
                    {
                      label: "Required Sessions (to complete task)",
                      value: editRequiredSessions,
                      setter: setEditRequiredSessions,
                    },
                  ].map((field) => (
                    <YStack key={field.label} marginBottom="$4">
                      <Text
                        fontSize={12}
                        letterSpacing={1}
                        textTransform="uppercase"
                        color="$colorSubtle"
                        marginBottom="$2"
                      >
                        {field.label}
                      </Text>
                      <Input
                        value={field.value}
                        onChangeText={field.setter}
                        keyboardType="number-pad"
                        borderRadius={14}
                        height={48}
                        fontSize={15}
                      />
                    </YStack>
                  ))}

                  <Button
                    backgroundColor={accentColor}
                    color={accentOnColor}
                    borderRadius={16}
                    height={52}
                    pressStyle={{ opacity: 0.85 }}
                    marginTop="$2"
                    onPress={handleSaveSettings}
                  >
                    <Text color={accentOnColor} fontSize={15} fontWeight="700">
                      Save Settings
                    </Text>
                  </Button>
                </TScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  // Nav bar
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: "600",
  },
  // Body: vertical flex column, distributes space evenly
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  // Ring
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
  },
  ringTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: HALF,
    borderWidth: RING_BORDER,
    backgroundColor: "transparent",
  },
  halfClip: {
    position: "absolute",
    top: 0,
    width: HALF,
    height: RING_SIZE,
    overflow: "hidden",
  },
  halfCircle: {
    position: "absolute",
    top: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: HALF,
    backgroundColor: "transparent",
  },
  // Key fix: absolute center inside the ring
  ringCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  timeDisplay: {
    fontSize: 52,
    fontWeight: "700",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
    textAlignVertical: "center",
    lineHeight: 60,
  },
  timeLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "500",
  },
  // Task card
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    width: "100%",
  },
  taskIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTextWrap: {
    flex: 1,
    gap: 2,
  },
  taskLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Controls
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  ctrlMain: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlSmall: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  // Session info
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  sessionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  sessionPhase: {
    fontSize: 13,
    fontWeight: "700",
  },
  // Dots
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    width: "100%",
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  // Hint
  hint: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalFrame: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    // backgroundColor set inline in JSX to respect theme (t.cardBg)
  },
  // fabSettings removed — settings FAB eliminated; settings only accessible from nav when session not running
});
