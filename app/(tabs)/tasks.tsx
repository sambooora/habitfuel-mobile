// @ts-nocheck
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Dialog,
  Input,
  ScrollView as TScrollView,
  Separator,
  Text,
  TextArea,
  Unspaced,
  VisuallyHidden,
  XStack,
  YStack,
} from "tamagui";

import { DatePicker } from "@/components/date-picker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Brand, Fonts, Palette, Shadows } from "@/constants/theme";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { isFocusTask, usePomodoroStorage } from "@/hooks/use-pomodoro-storage";
import {
  formatTaskDate,
  getSubtaskProgress,
  isOverdue,
  isDueToday,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TAG_CONFIG,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type TaskTag,
  useTaskStorage,
} from "@/hooks/use-task-storage";

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const ALL_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const ALL_TAGS: TaskTag[] = Object.keys(TAG_CONFIG) as TaskTag[];
const SORT_OPTIONS: {
  value: "newest" | "oldest" | "priority" | "dueDate";
  label: string;
}[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "priority", label: "Priority" },
  { value: "dueDate", label: "Due Date" },
];

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const t = isDarkMode ? Palette.dark : Palette.light;
  const shadow = isDarkMode ? Shadows.dark : Shadows.light;
  const { accentColor, accentOnColor } = useAccentColor();
  const router = useRouter();
  const {
    getRecord,
    hasCompletedRequiredSessions,
    reload: reloadPomodoro,
  } = usePomodoroStorage();

  // Reload pomodoro data when tab gains focus
  useFocusEffect(
    useCallback(() => {
      reloadPomodoro();
    }, [reloadPomodoro]),
  );
  const {
    filteredTasks,
    stats,
    statusCounts,
    isLoading,
    filters,
    hasActiveFilters,
    addTask,
    updateTask,
    deleteTask,
    cycleStatus,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setTagFilter,
    setSortBy,
    resetFilters,
  } = useTaskStorage();

  // Dialog states
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<TaskStatus>("todo");
  const [formPriority, setFormPriority] = useState<TaskPriority>("medium");
  const [formTag, setFormTag] = useState<TaskTag>("other");
  const [formNote, setFormNote] = useState("");
  const [formDueDate, setFormDueDate] = useState<Date | null>(new Date());

  // Subtask input in detail sheet
  const [subtaskInput, setSubtaskInput] = useState("");

  const themedSubText = t.textSubtle;
  const themedCardBg = t.cardBg;
  const themedBorder = t.border;
  const themedInputText = t.inputText;

  // ─── Form helpers ─────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormTitle("");
    setFormDescription("");
    setFormStatus("todo");
    setFormPriority("medium");
    setFormTag("other");
    setFormNote("");
    setFormDueDate(new Date());
    setEditingTask(null);
  }, []);

  const openAddSheet = useCallback(() => {
    resetForm();
    setFormSheetOpen(true);
  }, [resetForm]);

  // Listen for the standalone "add" button in the floating tab bar
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("tabbar:add:tasks", () => {
      openAddSheet();
    });
    return () => sub.remove();
  }, [openAddSheet]);

  const openEditSheet = useCallback((task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormTag(task.tag);
    setFormNote(task.note ?? "");
    setFormDueDate(task.dueDate ? new Date(task.dueDate) : new Date());
    setDetailSheetOpen(false);
    setTimeout(() => setFormSheetOpen(true), 300);
  }, []);

  const openDetailSheet = useCallback((task: Task) => {
    setDetailTask(task);
    setSubtaskInput("");
    setDetailSheetOpen(true);
  }, []);

  // Refresh detail task when tasks data changes
  const refreshedDetailTask = useMemo(() => {
    if (!detailTask) return null;
    return filteredTasks.find((t) => t.id === detailTask.id) ?? detailTask;
  }, [detailTask, filteredTasks]);

  const handleSave = useCallback(async () => {
    if (!formTitle.trim()) {
      Alert.alert("Validation", "Please enter a task title.");
      return;
    }

    let parsedDueDate: string | undefined;
    if (formDueDate) {
      parsedDueDate = formDueDate.toISOString();
    }

    if (editingTask) {
      await updateTask(editingTask.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        status: formStatus,
        priority: formPriority,
        tag: formTag,
        note: formNote.trim() || undefined,
        dueDate: parsedDueDate,
      });
    } else {
      await addTask({
        title: formTitle.trim(),
        description: formDescription.trim(),
        status: formStatus,
        priority: formPriority,
        tag: formTag,
        note: formNote.trim() || undefined,
        dueDate: parsedDueDate,
      });
    }

    setFormSheetOpen(false);
    resetForm();
  }, [
    formTitle,
    formDescription,
    formStatus,
    formPriority,
    formTag,
    formNote,
    formDueDate,
    editingTask,
    addTask,
    updateTask,
    resetForm,
  ]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTask(id);
            setDetailSheetOpen(false);
          },
        },
      ]);
    },
    [deleteTask],
  );

  const handleAddSubtask = useCallback(
    async (taskId: string) => {
      if (!subtaskInput.trim()) return;
      await addSubtask(taskId, subtaskInput.trim());
      setSubtaskInput("");
      setDetailTask((prev) => (prev ? { ...prev } : null));
    },
    [subtaskInput, addSubtask],
  );

  const handleToggleSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      await toggleSubtask(taskId, subtaskId);
      setDetailTask((prev) => (prev ? { ...prev } : null));
    },
    [toggleSubtask],
  );

  const handleDeleteSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      await deleteSubtask(taskId, subtaskId);
      setDetailTask((prev) => (prev ? { ...prev } : null));
    },
    [deleteSubtask],
  );

  const handleCycleStatus = useCallback(
    async (id: string) => {
      const task = filteredTasks.find((t) => t.id === id);
      if (!task) {
        await cycleStatus(id);
        return;
      }

      // Guard: focus tasks (urgent/high) cannot be moved to "done"
      // unless they have completed the required pomodoro sessions.
      const movingToDone = task.status === "in_progress";
      if (movingToDone && isFocusTask(task.priority)) {
        const ok = hasCompletedRequiredSessions(id, task.priority);
        if (!ok) {
          const record = getRecord(id, task.priority);
          const required = record.requiredSessions;
          const remaining = required - record.completedSessions;
          Alert.alert(
            "Pomodoro Required 🍅",
            `This task requires ${required} focus session${required > 1 ? "s" : ""} to complete.\n\nYou still need ${remaining} more session${remaining > 1 ? "s" : ""}.\n\nStart a focus session from the Home tab.`,
            [{ text: "OK" }],
          );
          return;
        }
      }

      await cycleStatus(id);
    },
    [cycleStatus, filteredTasks, hasCompletedRequiredSessions, getRecord],
  );

  // ─── Status tabs with counts ─────────────────────────────────
  const statusTabs = useMemo(
    () => [
      { key: "all" as const, label: "All", count: statusCounts.all },
      { key: "todo" as const, label: "To Do", count: statusCounts.todo },
      {
        key: "in_progress" as const,
        label: "In Progress",
        count: statusCounts.in_progress,
      },
      { key: "done" as const, label: "Done", count: statusCounts.done },
    ],
    [statusCounts],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priority !== "all") count++;
    if (filters.tag !== "all") count++;
    if (filters.sortBy !== "newest") count++;
    return count;
  }, [filters]);

  // ─── Loading ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
        <ThemedView
          style={[styles.container, styles.center]}
          lightColor="#F6F6F6"
          darkColor="#0E0F10"
        >
          <ThemedText lightColor="#8F98A1" darkColor="#AAB1B8">
            Loading...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // ─── Render ──────────────────────────────────────────────────
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText
                style={styles.headerLabel}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                PRODUCTIVITY
              </ThemedText>
              <ThemedText
                style={styles.headerTitle}
                lightColor={Palette.light.textPrimary}
                darkColor={Palette.dark.textPrimary}
              >
                My Tasks
              </ThemedText>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statMini,
                { backgroundColor: themedCardBg },
                shadow.cardSubtle,
              ]}
            >
              <ThemedText
                style={styles.statMiniValue}
                lightColor={Palette.light.textPrimary}
                darkColor={Palette.dark.textPrimary}
              >
                {stats.total}
              </ThemedText>
              <ThemedText
                style={styles.statMiniLabel}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                Total
              </ThemedText>
            </View>
            <View
              style={[
                styles.statMini,
                { backgroundColor: themedCardBg },
                shadow.cardSubtle,
              ]}
            >
              <ThemedText
                style={[styles.statMiniValue, { color: Brand.success }]}
              >
                {stats.completionRate}%
              </ThemedText>
              <ThemedText
                style={styles.statMiniLabel}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                Done
              </ThemedText>
            </View>
            {stats.overdue > 0 && (
              <View
                style={[
                  styles.statMini,
                  { backgroundColor: themedCardBg },
                  shadow.cardSubtle,
                ]}
              >
                <ThemedText
                  style={[styles.statMiniValue, { color: Brand.danger }]}
                >
                  {stats.overdue}
                </ThemedText>
                <ThemedText
                  style={styles.statMiniLabel}
                  lightColor={Palette.light.textSubtle}
                  darkColor={Palette.dark.textSubtle}
                >
                  Overdue
                </ThemedText>
              </View>
            )}
            {stats.urgentCount > 0 && (
              <View
                style={[
                  styles.statMini,
                  { backgroundColor: themedCardBg },
                  shadow.cardSubtle,
                ]}
              >
                <ThemedText
                  style={[styles.statMiniValue, { color: Brand.danger }]}
                >
                  {stats.urgentCount}
                </ThemedText>
                <ThemedText
                  style={styles.statMiniLabel}
                  lightColor={Palette.light.textSubtle}
                  darkColor={Palette.dark.textSubtle}
                >
                  Urgent
                </ThemedText>
              </View>
            )}
            {stats.dueToday > 0 && (
              <View
                style={[
                  styles.statMini,
                  { backgroundColor: themedCardBg },
                  shadow.cardSubtle,
                ]}
              >
                <ThemedText
                  style={[styles.statMiniValue, { color: Brand.warning }]}
                >
                  {stats.dueToday}
                </ThemedText>
                <ThemedText
                  style={styles.statMiniLabel}
                  lightColor={Palette.light.textSubtle}
                  darkColor={Palette.dark.textSubtle}
                >
                  Due Today
                </ThemedText>
              </View>
            )}
          </View>

          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchInput,
                { backgroundColor: themedCardBg, borderColor: themedBorder },
              ]}
            >
              <MaterialIcons name="search" size={18} color={themedSubText} />
              <TextInput
                style={[styles.searchTextInput, { color: themedInputText }]}
                placeholder="Search tasks..."
                placeholderTextColor={themedSubText}
                value={filters.searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {filters.searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <MaterialIcons name="close" size={18} color={themedSubText} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                { backgroundColor: themedCardBg, borderColor: themedBorder },
                activeFilterCount > 0 && { borderColor: accentColor },
              ]}
              onPress={() => setFilterSheetOpen(true)}
            >
              <MaterialIcons
                name="tune"
                size={18}
                color={activeFilterCount > 0 ? t.textPrimary : themedSubText}
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <ThemedText style={styles.filterBadgeText}>
                    {activeFilterCount}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Status Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            {statusTabs.map((tab) => {
              const isActive = filters.status === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tab,
                    isActive ? { backgroundColor: accentColor } : null,
                    !isActive && { backgroundColor: t.cardBg },
                  ]}
                  onPress={() => setStatusFilter(tab.key)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      isActive ? styles.tabTextActive : null,
                    ]}
                    lightColor={isActive ? "#FFFFFF" : Palette.light.textSubtle}
                    darkColor={isActive ? "#FFFFFF" : Palette.dark.textSubtle}
                  >
                    {tab.label}
                  </ThemedText>
                  <View
                    style={[
                      styles.tabBadge,
                      isActive ? styles.tabBadgeActive : null,
                      !isActive && { backgroundColor: t.chipBg },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.tabBadgeText,
                        isActive ? styles.tabBadgeTextActive : null,
                      ]}
                      lightColor={
                        isActive
                          ? Palette.light.textPrimary
                          : Palette.light.textSubtle
                      }
                      darkColor={
                        isActive
                          ? Palette.dark.textPrimary
                          : Palette.dark.textSubtle
                      }
                    >
                      {tab.count}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <View style={styles.activeFiltersRow}>
              {filters.priority !== "all" && (
                <View
                  style={[
                    styles.activeFilterChip,
                    {
                      backgroundColor:
                        PRIORITY_CONFIG[filters.priority].bgColor,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.activeFilterChipText,
                      { color: PRIORITY_CONFIG[filters.priority].color },
                    ]}
                  >
                    {PRIORITY_CONFIG[filters.priority].label}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setPriorityFilter("all")}>
                    <MaterialIcons
                      name="close"
                      size={14}
                      color={PRIORITY_CONFIG[filters.priority].color}
                    />
                  </TouchableOpacity>
                </View>
              )}
              {filters.tag !== "all" && (
                <View
                  style={[
                    styles.activeFilterChip,
                    { backgroundColor: TAG_CONFIG[filters.tag].bgColor },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.activeFilterChipText,
                      { color: TAG_CONFIG[filters.tag].color },
                    ]}
                  >
                    {TAG_CONFIG[filters.tag].label}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setTagFilter("all")}>
                    <MaterialIcons
                      name="close"
                      size={14}
                      color={TAG_CONFIG[filters.tag].color}
                    />
                  </TouchableOpacity>
                </View>
              )}
              {filters.sortBy !== "newest" && (
                <View
                  style={[
                    styles.activeFilterChip,
                    { backgroundColor: t.chipBg },
                  ]}
                >
                  <ThemedText
                    style={styles.activeFilterChipText}
                    lightColor={Palette.light.textPrimary}
                    darkColor={Palette.dark.textPrimary}
                  >
                    Sort:{" "}
                    {
                      SORT_OPTIONS.find((s) => s.value === filters.sortBy)
                        ?.label
                    }
                  </ThemedText>
                  <TouchableOpacity onPress={() => setSortBy("newest")}>
                    <MaterialIcons
                      name="close"
                      size={14}
                      color={themedSubText}
                    />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={resetFilters}>
                <ThemedText
                  style={styles.clearAllText}
                  lightColor={Brand.danger}
                  darkColor={Brand.dangerLight}
                >
                  Clear All
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <View
              style={[styles.emptyState, { backgroundColor: themedCardBg }]}
            >
              <MaterialIcons name="assignment" size={40} color={t.emptyIcon} />
              <ThemedText
                style={styles.emptyText}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                {hasActiveFilters
                  ? "No tasks match your filters.\nTry adjusting your search or filters."
                  : "No tasks yet.\nTap + to create your first task!"}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.taskList}>
              {filteredTasks.map((task) => {
                const tagConfig = TAG_CONFIG[task.tag];
                const priorityConfig = PRIORITY_CONFIG[task.priority];
                const statusConfig = STATUS_CONFIG[task.status];
                const progress = getSubtaskProgress(task);
                const overdue = isOverdue(task);
                const dueToday = isDueToday(task);
                const isFocus = isFocusTask(task.priority);
                const pomRecord = isFocus
                  ? getRecord(task.id, task.priority)
                  : null;
                const pomRequired = isFocus ? pomRecord!.requiredSessions : 0;
                const pomDone = isFocus
                  ? pomRecord!.completedSessions >= pomRequired
                  : true;

                return (
                  <TouchableOpacity
                    key={task.id}
                    activeOpacity={0.7}
                    onPress={() => openDetailSheet(task)}
                  >
                    <View
                      style={[
                        styles.taskCard,
                        { backgroundColor: t.cardBg },
                        shadow.card,
                        overdue && styles.taskCardOverdue,
                      ]}
                    >
                      {/* Content row: icon left + text right */}
                      <View style={styles.taskContentRow}>
                        <View style={styles.taskContentText}>
                          <ThemedText
                            style={[
                              styles.taskTitle,
                              task.status === "done" && styles.taskTitleDone,
                            ]}
                            lightColor={Palette.light.textPrimary}
                            darkColor={Palette.dark.textPrimary}
                            numberOfLines={2}
                          >
                            {task.title}
                          </ThemedText>
                          {task.description ? (
                            <ThemedText
                              style={styles.taskDescription}
                              lightColor={Palette.light.textSecondary}
                              darkColor={Palette.dark.textSecondary}
                              numberOfLines={2}
                            >
                              {task.description}
                            </ThemedText>
                          ) : null}
                        </View>
                      </View>

                      {/* Footer */}
                      <View style={styles.taskFooter}>
                        <View style={styles.taskFooterLeft}>
                          <TouchableOpacity
                            style={[
                              styles.statusBtn,
                              { backgroundColor: t.statusBtnBg },
                            ]}
                            onPress={() => handleCycleStatus(task.id)}
                            activeOpacity={0.6}
                          >
                            <MaterialIcons
                              name={statusConfig.icon as any}
                              size={16}
                              color={statusConfig.color}
                            />
                            <ThemedText
                              style={[
                                styles.statusBtnText,
                                { color: statusConfig.color },
                              ]}
                            >
                              {statusConfig.label}
                            </ThemedText>
                          </TouchableOpacity>

                          {progress.total > 0 && (
                            <View style={styles.taskProgressRow}>
                              <MaterialIcons
                                name="check-circle"
                                size={14}
                                color={
                                  progress.completed === progress.total
                                    ? "#0A8F5A"
                                    : themedSubText
                                }
                              />
                              <ThemedText
                                style={styles.taskProgressText}
                                lightColor={Palette.light.textSubtle}
                                darkColor={Palette.dark.textSubtle}
                              >
                                {progress.completed}/{progress.total}
                              </ThemedText>
                            </View>
                          )}
                        </View>

                        {/*{isFocus && task.status !== "done" && (
                          <TouchableOpacity
                            style={[
                              styles.pomStartBtn,
                              { backgroundColor: t.playBg },
                            ]}
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
                              size={14}
                              color={t.playIcon}
                            />
                          </TouchableOpacity>
                        )}*/}
                        {task.dueDate && (
                          <View
                            style={[
                              styles.dueDateBadge,
                              overdue && styles.dueDateOverdue,
                              dueToday && styles.dueDateToday,
                            ]}
                          >
                            <MaterialIcons
                              name="event"
                              size={12}
                              color={
                                overdue
                                  ? Brand.danger
                                  : dueToday
                                    ? Brand.warning
                                    : themedSubText
                              }
                            />
                            <ThemedText
                              style={[
                                styles.dueDateText,
                                overdue && { color: Brand.danger },
                                dueToday && { color: Brand.warning },
                              ]}
                              lightColor={Palette.light.textSubtle}
                              darkColor={Palette.dark.textSubtle}
                            >
                              {formatTaskDate(task.dueDate)}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* DETAIL DIALOG                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        <Dialog open={detailSheetOpen} onOpenChange={setDetailSheetOpen} modal>
          <Dialog.Portal>
            <Dialog.Overlay
              bg="$background"
              opacity={0.5}
              animateOnly={["transform", "opacity"]}
              transition={[
                "quicker",
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <Dialog.FocusScope focusOnIdle>
              <Dialog.Content
                transition={[
                  "quicker",
                  {
                    opacity: {
                      overshootClamping: true,
                    },
                  },
                ]}
                enterStyle={{ x: 0, y: 20, opacity: 0 }}
                exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                width="92%"
                maxHeight="85%"
                borderRadius={28}
                paddingHorizontal="$5"
                paddingTop="$4"
                paddingBottom="$6"
              >
                <VisuallyHidden>
                  <Dialog.Title>Task Detail</Dialog.Title>
                  <Dialog.Description>View task details</Dialog.Description>
                </VisuallyHidden>
                {refreshedDetailTask && (
                  <TScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Header */}
                    <YStack alignItems="center" marginBottom="$4" gap="$2">
                      <YStack
                        width={56}
                        height={56}
                        borderRadius={20}
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor={
                          TAG_CONFIG[refreshedDetailTask.tag]?.bgColor ||
                          "#F0F2F4"
                        }
                        marginBottom="$2"
                      >
                        <MaterialIcons
                          name={
                            (TAG_CONFIG[refreshedDetailTask.tag]?.icon ||
                              "label") as any
                          }
                          size={28}
                          color={
                            TAG_CONFIG[refreshedDetailTask.tag]?.color ||
                            "#8F98A1"
                          }
                        />
                      </YStack>
                      <Text fontSize={20} fontWeight="700" textAlign="center">
                        {refreshedDetailTask.title}
                      </Text>
                      {refreshedDetailTask.description ? (
                        <Text
                          fontSize={14}
                          color="$colorSubtle"
                          textAlign="center"
                          lineHeight={20}
                        >
                          {refreshedDetailTask.description}
                        </Text>
                      ) : null}
                    </YStack>

                    <Separator marginBottom="$4" />

                    {/* Info Rows */}
                    <YStack gap="$3" marginBottom="$4">
                      {/* Status */}
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text fontSize={13} color="$colorSubtle">
                          Status
                        </Text>
                        <Button
                          unstyled
                          flexDirection="row"
                          alignItems="center"
                          gap={5}
                          paddingHorizontal={12}
                          paddingVertical={6}
                          borderRadius={999}
                          backgroundColor={
                            STATUS_CONFIG[refreshedDetailTask.status].color +
                            "18"
                          }
                          pressStyle={{ opacity: 0.7 }}
                          onPress={() =>
                            handleCycleStatus(refreshedDetailTask.id)
                          }
                        >
                          <MaterialIcons
                            name={
                              STATUS_CONFIG[refreshedDetailTask.status]
                                .icon as any
                            }
                            size={16}
                            color={
                              STATUS_CONFIG[refreshedDetailTask.status].color
                            }
                          />
                          <Text
                            fontSize={13}
                            fontWeight="700"
                            color={
                              STATUS_CONFIG[refreshedDetailTask.status].color
                            }
                          >
                            {STATUS_CONFIG[refreshedDetailTask.status].label}
                          </Text>
                        </Button>
                      </XStack>

                      {/* Pomodoro progress row (focus tasks only) */}
                      {isFocusTask(refreshedDetailTask.priority) &&
                        refreshedDetailTask.status !== "done" &&
                        (() => {
                          const rec = getRecord(
                            refreshedDetailTask.id,
                            refreshedDetailTask.priority,
                          );
                          const req = rec.requiredSessions;
                          const done = rec.completedSessions >= req;
                          return (
                            <XStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text fontSize={13} color="$colorSubtle">
                                Focus Sessions
                              </Text>
                              <XStack alignItems="center" gap="$2">
                                <XStack alignItems="center" gap={4}>
                                  {Array.from({ length: req }).map((_, i) => (
                                    <View
                                      key={i}
                                      style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor:
                                          i < rec.completedSessions
                                            ? "#0A8F5A"
                                            : isDarkMode
                                              ? "#252930"
                                              : "#E0E2E6",
                                      }}
                                    />
                                  ))}
                                </XStack>
                                <Text
                                  fontSize={13}
                                  fontWeight="700"
                                  color={done ? "#0A8F5A" : "$colorSubtle"}
                                >
                                  {rec.completedSessions}/{req}
                                  {done ? " ✓" : ""}
                                </Text>
                              </XStack>
                            </XStack>
                          );
                        })()}

                      {/* Priority */}
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text fontSize={13} color="$colorSubtle">
                          Priority
                        </Text>
                        <YStack
                          paddingHorizontal={12}
                          paddingVertical={5}
                          borderRadius={999}
                          backgroundColor={
                            PRIORITY_CONFIG[refreshedDetailTask.priority]
                              .bgColor
                          }
                        >
                          <Text
                            fontSize={12}
                            fontWeight="700"
                            color={
                              PRIORITY_CONFIG[refreshedDetailTask.priority]
                                .color
                            }
                          >
                            {
                              PRIORITY_CONFIG[refreshedDetailTask.priority]
                                .label
                            }
                          </Text>
                        </YStack>
                      </XStack>

                      {/* Tag */}
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text fontSize={13} color="$colorSubtle">
                          Tag
                        </Text>
                        <XStack
                          alignItems="center"
                          gap={5}
                          paddingHorizontal={12}
                          paddingVertical={5}
                          borderRadius={999}
                          backgroundColor={
                            TAG_CONFIG[refreshedDetailTask.tag]?.bgColor ||
                            "#F0F2F4"
                          }
                        >
                          <MaterialIcons
                            name={
                              (TAG_CONFIG[refreshedDetailTask.tag]?.icon ||
                                "label") as any
                            }
                            size={14}
                            color={
                              TAG_CONFIG[refreshedDetailTask.tag]?.color ||
                              "#8F98A1"
                            }
                          />
                          <Text
                            fontSize={12}
                            fontWeight="600"
                            color={
                              TAG_CONFIG[refreshedDetailTask.tag]?.color ||
                              "#8F98A1"
                            }
                          >
                            {TAG_CONFIG[refreshedDetailTask.tag]?.label ||
                              "Other"}
                          </Text>
                        </XStack>
                      </XStack>

                      {/* Due Date */}
                      {refreshedDetailTask.dueDate && (
                        <XStack
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text fontSize={13} color="$colorSubtle">
                            Due Date
                          </Text>
                          <Text
                            fontSize={14}
                            fontWeight="600"
                            color={
                              isOverdue(refreshedDetailTask)
                                ? Brand.danger
                                : undefined
                            }
                          >
                            {formatTaskDate(refreshedDetailTask.dueDate)}
                            {isOverdue(refreshedDetailTask) ? " (Overdue)" : ""}
                          </Text>
                        </XStack>
                      )}

                      {/* Created */}
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text fontSize={13} color="$colorSubtle">
                          Created
                        </Text>
                        <Text fontSize={14} fontWeight="600">
                          {formatTaskDate(refreshedDetailTask.createdAt)}
                        </Text>
                      </XStack>

                      {/* Note */}
                      {refreshedDetailTask.note ? (
                        <XStack
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Text fontSize={13} color="$colorSubtle">
                            Note
                          </Text>
                          <Text
                            fontSize={14}
                            fontWeight="600"
                            flex={1}
                            textAlign="right"
                            marginLeft="$4"
                          >
                            {refreshedDetailTask.note}
                          </Text>
                        </XStack>
                      ) : null}
                    </YStack>

                    <Separator marginBottom="$4" />

                    {/* Subtasks */}
                    <YStack marginBottom="$4">
                      <Text fontSize={15} fontWeight="700" marginBottom="$3">
                        Subtasks (
                        {
                          refreshedDetailTask.subtasks.filter(
                            (s) => s.completed,
                          ).length
                        }
                        /{refreshedDetailTask.subtasks.length})
                      </Text>

                      {refreshedDetailTask.subtasks.map((sub) => (
                        <XStack
                          key={sub.id}
                          alignItems="center"
                          paddingVertical="$2"
                          borderBottomWidth={1}
                          borderBottomColor="$borderColor"
                          gap="$2"
                        >
                          <Button
                            unstyled
                            padding="$0.5"
                            onPress={() =>
                              handleToggleSubtask(
                                refreshedDetailTask.id,
                                sub.id,
                              )
                            }
                          >
                            <MaterialIcons
                              name={
                                sub.completed
                                  ? "check-box"
                                  : "check-box-outline-blank"
                              }
                              size={22}
                              color={sub.completed ? "#0A8F5A" : themedSubText}
                            />
                          </Button>
                          <Text
                            flex={1}
                            fontSize={14}
                            textDecorationLine={
                              sub.completed ? "line-through" : "none"
                            }
                            opacity={sub.completed ? 0.5 : 1}
                            numberOfLines={2}
                          >
                            {sub.title}
                          </Text>
                          <Button
                            unstyled
                            onPress={() =>
                              handleDeleteSubtask(
                                refreshedDetailTask.id,
                                sub.id,
                              )
                            }
                          >
                            <MaterialIcons
                              name="close"
                              size={18}
                              color={themedSubText}
                            />
                          </Button>
                        </XStack>
                      ))}

                      {/* Add subtask */}
                      <XStack
                        alignItems="center"
                        gap="$2"
                        marginTop="$2"
                        backgroundColor="$backgroundFocus"
                        borderRadius={12}
                        borderWidth={1}
                        borderColor="$borderColor"
                        paddingHorizontal="$3"
                        paddingVertical="$2"
                      >
                        <Input
                          unstyled
                          flex={1}
                          fontSize={14}
                          placeholder="Add a subtask..."
                          value={subtaskInput}
                          onChangeText={setSubtaskInput}
                          onSubmitEditing={() =>
                            handleAddSubtask(refreshedDetailTask.id)
                          }
                          returnKeyType="done"
                        />
                        <Button
                          unstyled
                          onPress={() =>
                            handleAddSubtask(refreshedDetailTask.id)
                          }
                          disabled={!subtaskInput.trim()}
                          opacity={subtaskInput.trim() ? 1 : 0.4}
                        >
                          <MaterialIcons
                            name="add-circle"
                            size={24}
                            color={
                              subtaskInput.trim() ? "#0A8F5A" : themedSubText
                            }
                          />
                        </Button>
                      </XStack>
                    </YStack>

                    {/* Actions */}
                    {isFocusTask(refreshedDetailTask.priority) &&
                      refreshedDetailTask.status !== "done" && (
                        <Button
                          backgroundColor={isDarkMode ? "#252930" : "#F0F2F4"}
                          borderRadius={14}
                          height={48}
                          pressStyle={{ opacity: 0.85 }}
                          marginBottom="$3"
                          icon={
                            <MaterialIcons
                              name="play-arrow"
                              size={18}
                              color={t.textPrimary}
                            />
                          }
                          onPress={() => {
                            setDetailSheetOpen(false);
                            setTimeout(
                              () =>
                                router.push({
                                  pathname: "/pomodoro",
                                  params: {
                                    taskId: refreshedDetailTask.id,
                                    taskTitle: refreshedDetailTask.title,
                                    taskPriority: refreshedDetailTask.priority,
                                  },
                                }),
                              300,
                            );
                          }}
                        >
                          <Text
                            fontSize={14}
                            fontWeight="600"
                            color={t.textPrimary}
                          >
                            Start Focus Session
                          </Text>
                        </Button>
                      )}
                    <XStack gap="$3" marginBottom="$3">
                      <Button
                        flex={1}
                        backgroundColor={accentColor}
                        color={accentOnColor}
                        borderRadius={14}
                        height={48}
                        pressStyle={{ opacity: 0.85 }}
                        icon={
                          <MaterialIcons
                            name="edit"
                            size={18}
                            color={accentOnColor}
                          />
                        }
                        onPress={() => openEditSheet(refreshedDetailTask)}
                      >
                        Edit
                      </Button>
                      <Button
                        flex={1}
                        backgroundColor={Brand.danger}
                        color="#FFFFFF"
                        borderRadius={14}
                        height={48}
                        pressStyle={{ opacity: 0.85 }}
                        icon={
                          <MaterialIcons
                            name="delete"
                            size={18}
                            color="#FFFFFF"
                          />
                        }
                        onPress={() => handleDelete(refreshedDetailTask.id)}
                      >
                        Delete
                      </Button>
                    </XStack>
                  </TScrollView>
                )}
                <Unspaced>
                  <Dialog.Close asChild>
                    <Button
                      unstyled
                      position="absolute"
                      right="$3"
                      top="$3"
                      width={32}
                      height={32}
                      borderRadius={16}
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor={themedCardBg}
                      pressStyle={{ opacity: 0.7 }}
                    >
                      <MaterialIcons
                        name="close"
                        size={18}
                        color={themedSubText}
                      />
                    </Button>
                  </Dialog.Close>
                </Unspaced>
              </Dialog.Content>
            </Dialog.FocusScope>
          </Dialog.Portal>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ADD / EDIT DIALOG                                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        <Dialog
          open={formSheetOpen}
          onOpenChange={(open: boolean) => {
            setFormSheetOpen(open);
            if (!open) resetForm();
          }}
          modal
        >
          <Dialog.Portal>
            <Dialog.Overlay
              bg="$background"
              opacity={0.5}
              animateOnly={["transform", "opacity"]}
              transition={[
                "quicker",
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <Dialog.FocusScope focusOnIdle>
              <Dialog.Content
                transition={[
                  "quicker",
                  {
                    opacity: {
                      overshootClamping: true,
                    },
                  },
                ]}
                enterStyle={{ x: 0, y: 20, opacity: 0 }}
                exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                width="92%"
                maxHeight="90%"
                borderRadius={28}
                paddingHorizontal="$5"
                paddingTop="$4"
                paddingBottom="$6"
                gap="$4"
              >
                <Dialog.Title fontSize={20} fontWeight="700">
                  {editingTask ? "Edit Task" : "New Task"}
                </Dialog.Title>
                <VisuallyHidden>
                  <Dialog.Description>Create or edit a task</Dialog.Description>
                </VisuallyHidden>
                <TScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  automaticallyAdjustKeyboardInsets
                  contentContainerStyle={{ paddingBottom: 32 }}
                >
                  {/* Title */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Title
                  </Text>
                  <Input
                    value={formTitle}
                    onChangeText={setFormTitle}
                    placeholder="What needs to be done?"
                    borderRadius={14}
                    height={48}
                    marginBottom="$4"
                    fontSize={15}
                  />

                  {/* Description */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Description
                  </Text>
                  <TextArea
                    value={formDescription}
                    onChangeText={setFormDescription}
                    placeholder="Add more details..."
                    borderRadius={14}
                    marginBottom="$4"
                    numberOfLines={3}
                    minHeight={80}
                    fontSize={15}
                    textAlignVertical="top"
                  />

                  {/* Status */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Status
                  </Text>
                  <XStack flexWrap="wrap" gap="$2" marginBottom="$4">
                    {ALL_STATUSES.map((s) => {
                      const config = STATUS_CONFIG[s];
                      const isSelected = formStatus === s;
                      return (
                        <Button
                          key={s}
                          size="$3"
                          borderRadius={12}
                          borderWidth={1}
                          borderColor={
                            isSelected ? config.color : "$borderColor"
                          }
                          backgroundColor={
                            isSelected
                              ? config.color + "20"
                              : "$backgroundFocus"
                          }
                          pressStyle={{ opacity: 0.8 }}
                          onPress={() => setFormStatus(s)}
                          icon={
                            <MaterialIcons
                              name={config.icon as any}
                              size={14}
                              color={isSelected ? config.color : themedSubText}
                            />
                          }
                        >
                          <Text
                            fontSize={13}
                            fontWeight="500"
                            color={isSelected ? config.color : "$color"}
                          >
                            {config.label}
                          </Text>
                        </Button>
                      );
                    })}
                  </XStack>

                  {/* Priority */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Priority
                  </Text>
                  <XStack flexWrap="wrap" gap="$2" marginBottom="$4">
                    {ALL_PRIORITIES.map((p) => {
                      const config = PRIORITY_CONFIG[p];
                      const isSelected = formPriority === p;
                      return (
                        <Button
                          key={p}
                          size="$3"
                          borderRadius={12}
                          borderWidth={1}
                          borderColor={
                            isSelected ? config.color : "$borderColor"
                          }
                          backgroundColor={
                            isSelected ? config.bgColor : "$backgroundFocus"
                          }
                          pressStyle={{ opacity: 0.8 }}
                          onPress={() => setFormPriority(p)}
                          icon={
                            <View
                              style={[
                                styles.priorityDot,
                                { backgroundColor: config.color },
                              ]}
                            />
                          }
                        >
                          <Text
                            fontSize={13}
                            fontWeight="500"
                            color={isSelected ? config.color : "$color"}
                          >
                            {config.label}
                          </Text>
                        </Button>
                      );
                    })}
                  </XStack>

                  {/* Tag */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Tag
                  </Text>
                  <XStack flexWrap="wrap" gap="$2" marginBottom="$4">
                    {ALL_TAGS.map((t) => {
                      const config = TAG_CONFIG[t];
                      const isSelected = formTag === t;
                      return (
                        <Button
                          key={t}
                          size="$3"
                          borderRadius={12}
                          borderWidth={1}
                          borderColor={
                            isSelected ? config.color : "$borderColor"
                          }
                          backgroundColor={
                            isSelected ? config.bgColor : "$backgroundFocus"
                          }
                          pressStyle={{ opacity: 0.8 }}
                          onPress={() => setFormTag(t)}
                          icon={
                            <MaterialIcons
                              name={config.icon as any}
                              size={13}
                              color={isSelected ? config.color : themedSubText}
                            />
                          }
                        >
                          <Text
                            fontSize={12}
                            fontWeight="500"
                            color={isSelected ? config.color : "$color"}
                          >
                            {config.label}
                          </Text>
                        </Button>
                      );
                    })}
                  </XStack>

                  {/* Due Date */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Due Date
                  </Text>
                  <DatePicker
                    value={formDueDate}
                    onChange={setFormDueDate}
                    placeholder="Select due date"
                    isDarkMode={isDarkMode}
                  />

                  {/* Note */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Note (optional)
                  </Text>
                  <TextArea
                    value={formNote}
                    onChangeText={setFormNote}
                    placeholder="Additional notes..."
                    borderRadius={14}
                    marginBottom="$4"
                    numberOfLines={3}
                    minHeight={80}
                    fontSize={15}
                    textAlignVertical="top"
                  />

                  {/* Save */}
                  <Button
                    backgroundColor={accentColor}
                    color={accentOnColor}
                    borderRadius={16}
                    height={52}
                    pressStyle={{ opacity: 0.85 }}
                    marginTop="$2"
                    marginBottom="$2"
                    onPress={handleSave}
                  >
                    <Text color={accentOnColor} fontSize={15} fontWeight="700">
                      {editingTask ? "Update Task" : "Create Task"}
                    </Text>
                  </Button>
                </TScrollView>
                <Unspaced>
                  <Dialog.Close asChild>
                    <Button
                      unstyled
                      position="absolute"
                      right="$3"
                      top="$3"
                      width={32}
                      height={32}
                      borderRadius={16}
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor={themedCardBg}
                      pressStyle={{ opacity: 0.7 }}
                      onPress={() => {
                        setFormSheetOpen(false);
                        resetForm();
                      }}
                    >
                      <MaterialIcons
                        name="close"
                        size={18}
                        color={themedSubText}
                      />
                    </Button>
                  </Dialog.Close>
                </Unspaced>
              </Dialog.Content>
            </Dialog.FocusScope>
          </Dialog.Portal>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FILTER / SORT DIALOG                                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <Dialog open={filterSheetOpen} onOpenChange={setFilterSheetOpen} modal>
          <Dialog.Portal>
            <Dialog.Overlay
              bg="$background"
              opacity={0.5}
              animateOnly={["transform", "opacity"]}
              transition={[
                "quicker",
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <Dialog.FocusScope focusOnIdle>
              <Dialog.Content
                transition={[
                  "quicker",
                  {
                    opacity: {
                      overshootClamping: true,
                    },
                  },
                ]}
                enterStyle={{ x: 0, y: 20, opacity: 0 }}
                exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                width="92%"
                maxHeight="85%"
                borderRadius={28}
                paddingHorizontal="$5"
                paddingTop="$4"
                paddingBottom="$6"
                gap="$4"
              >
                <Dialog.Title fontSize={20} fontWeight="700">
                  Filters & Sort
                </Dialog.Title>
                <VisuallyHidden>
                  <Dialog.Description>Filter and sort tasks</Dialog.Description>
                </VisuallyHidden>
                <TScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {/* Sort By */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Sort By
                  </Text>
                  <XStack flexWrap="wrap" gap="$2" marginBottom="$4">
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = filters.sortBy === opt.value;
                      return (
                        <Button
                          key={opt.value}
                          size="$3"
                          borderRadius={12}
                          borderWidth={1}
                          borderColor={
                            isSelected ? accentColor : "$borderColor"
                          }
                          backgroundColor={
                            isSelected ? accentColor : "$backgroundFocus"
                          }
                          pressStyle={{ opacity: 0.8 }}
                          onPress={() => setSortBy(opt.value)}
                        >
                          <Text
                            fontSize={13}
                            fontWeight={isSelected ? "700" : "500"}
                            color={isSelected ? accentOnColor : "$color"}
                          >
                            {opt.label}
                          </Text>
                        </Button>
                      );
                    })}
                  </XStack>

                  {/* Priority Filter */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Priority
                  </Text>
                  <XStack flexWrap="wrap" gap="$2" marginBottom="$4">
                    <Button
                      size="$3"
                      borderRadius={12}
                      borderWidth={1}
                      borderColor={
                        filters.priority === "all"
                          ? accentColor
                          : "$borderColor"
                      }
                      backgroundColor={
                        filters.priority === "all"
                          ? accentColor
                          : "$backgroundFocus"
                      }
                      pressStyle={{ opacity: 0.8 }}
                      onPress={() => setPriorityFilter("all")}
                    >
                      <Text
                        fontSize={13}
                        fontWeight="500"
                        color={
                          filters.priority === "all" ? accentOnColor : "$color"
                        }
                      >
                        All
                      </Text>
                    </Button>
                    {ALL_PRIORITIES.map((p) => {
                      const config = PRIORITY_CONFIG[p];
                      const isSelected = filters.priority === p;
                      return (
                        <Button
                          key={p}
                          size="$3"
                          borderRadius={12}
                          borderWidth={1}
                          borderColor={
                            isSelected ? config.color : "$borderColor"
                          }
                          backgroundColor={
                            isSelected ? config.bgColor : "$backgroundFocus"
                          }
                          pressStyle={{ opacity: 0.8 }}
                          onPress={() => setPriorityFilter(p)}
                          icon={
                            <View
                              style={[
                                styles.priorityDot,
                                { backgroundColor: config.color },
                              ]}
                            />
                          }
                        >
                          <Text
                            fontSize={13}
                            fontWeight="500"
                            color={isSelected ? config.color : "$color"}
                          >
                            {config.label}
                          </Text>
                        </Button>
                      );
                    })}
                  </XStack>

                  {/* Tag Filter */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Tag
                  </Text>
                  <XStack flexWrap="wrap" gap="$2" marginBottom="$4">
                    <Button
                      size="$3"
                      borderRadius={12}
                      borderWidth={1}
                      borderColor={
                        filters.tag === "all" ? accentColor : "$borderColor"
                      }
                      backgroundColor={
                        filters.tag === "all" ? accentColor : "$backgroundFocus"
                      }
                      pressStyle={{ opacity: 0.8 }}
                      onPress={() => setTagFilter("all")}
                    >
                      <Text
                        fontSize={13}
                        fontWeight="500"
                        color={filters.tag === "all" ? accentOnColor : "$color"}
                      >
                        All
                      </Text>
                    </Button>
                    {ALL_TAGS.map((t) => {
                      const config = TAG_CONFIG[t];
                      const isSelected = filters.tag === t;
                      return (
                        <Button
                          key={t}
                          size="$3"
                          borderRadius={12}
                          borderWidth={1}
                          borderColor={
                            isSelected ? config.color : "$borderColor"
                          }
                          backgroundColor={
                            isSelected ? config.bgColor : "$backgroundFocus"
                          }
                          pressStyle={{ opacity: 0.8 }}
                          onPress={() => setTagFilter(t)}
                          icon={
                            <MaterialIcons
                              name={config.icon as any}
                              size={13}
                              color={isSelected ? config.color : themedSubText}
                            />
                          }
                        >
                          <Text
                            fontSize={12}
                            fontWeight="500"
                            color={isSelected ? config.color : "$color"}
                          >
                            {config.label}
                          </Text>
                        </Button>
                      );
                    })}
                  </XStack>

                  {/* Actions */}
                  <XStack gap="$3" marginTop="$4">
                    <Button
                      flex={1}
                      height={48}
                      borderRadius={14}
                      borderWidth={1}
                      borderColor="$borderColor"
                      backgroundColor="$backgroundFocus"
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => {
                        resetFilters();
                        setFilterSheetOpen(false);
                      }}
                    >
                      <Text fontSize={14} fontWeight="600">
                        Reset All
                      </Text>
                    </Button>
                    <Button
                      flex={1}
                      height={48}
                      borderRadius={14}
                      backgroundColor={accentColor}
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => setFilterSheetOpen(false)}
                    >
                      <Text
                        fontSize={14}
                        fontWeight="700"
                        color={accentOnColor}
                      >
                        Apply
                      </Text>
                    </Button>
                  </XStack>
                </TScrollView>
                <Unspaced>
                  <Dialog.Close asChild>
                    <Button
                      unstyled
                      position="absolute"
                      right="$3"
                      top="$3"
                      width={32}
                      height={32}
                      borderRadius={16}
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor={themedCardBg}
                      pressStyle={{ opacity: 0.7 }}
                      onPress={() => setFilterSheetOpen(false)}
                    >
                      <MaterialIcons
                        name="close"
                        size={18}
                        color={themedSubText}
                      />
                    </Button>
                  </Dialog.Close>
                </Unspaced>
              </Dialog.Content>
            </Dialog.FocusScope>
          </Dialog.Portal>
        </Dialog>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLabel: {
    fontSize: 12,
    letterSpacing: 1.4,
    fontFamily: Fonts.rounded,
  },
  headerTitle: {
    fontSize: 26,
    marginTop: 4,
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Stats Row ───────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statMini: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 14,
  },
  statMiniValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statMiniLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },

  // ── Search ──────────────────────────────────────────────────
  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#D94141",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  // ── Tabs ────────────────────────────────────────────────────
  tabRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 20,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  tabActive: {},
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    fontWeight: "700",
  },
  tabBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: "#FFFFFF",
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabBadgeTextActive: {
    fontWeight: "700",
  },

  // ── Active Filter Chips ─────────────────────────────────────
  activeFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activeFilterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  // ── Task List ───────────────────────────────────────────────
  taskList: {
    gap: 14,
  },
  taskCard: {
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  taskCardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: Brand.danger,
  },
  taskContentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  taskTagIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  taskContentText: {
    flex: 1,
    gap: 4,
  },
  taskTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  taskTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  taskDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  taskFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  taskFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  taskProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskProgressText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dueDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dueDateOverdue: {},
  dueDateToday: {},
  dueDateText: {
    fontSize: 11,
    fontWeight: "500",
  },

  // ── Empty State ─────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    borderRadius: 20,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // ── FAB ─────────────────────────────────────────────────────
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Shared ──────────────────────────────────────────────────
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pomBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pomBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  pomStartBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
