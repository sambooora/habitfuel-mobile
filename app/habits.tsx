// @ts-nocheck
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Brand, Palette, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAccentColor } from "@/hooks/use-accent-color";
import {
  HABIT_CATEGORIES,
  HABIT_COLOR_OPTIONS,
  HABIT_ICON_OPTIONS,
  useHabitStorage,
  type HabitCategory,
  type Habit,
} from "@/hooks/use-habit-storage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_FILTER = "all" as const;
type FilterKey = typeof ALL_FILTER | HabitCategory;

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: ALL_FILTER, label: "All" },
  ...HABIT_CATEGORIES,
];

function resolveHabitColors(
  habit: Habit,
  isDarkMode: boolean,
): { bg: string; icon: string } {
  const match = HABIT_COLOR_OPTIONS.find((c) => c.bg === habit.background);
  if (match && isDarkMode) {
    return { bg: match.bgDark, icon: match.iconDark };
  }
  if (match) {
    return { bg: match.bg, icon: match.icon };
  }
  return { bg: habit.background, icon: habit.iconColor };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HabitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const t = isDarkMode ? Palette.dark : Palette.light;
  const shadow = isDarkMode ? Shadows.dark : Shadows.light;
  const { accentColor } = useAccentColor();

  const {
    habits,

    isLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    getWeekProgress,
    getStreak,
  } = useHabitStorage();

  // -- Filter state -----------------------------------------------------------

  const [activeFilter, setActiveFilter] = useState<FilterKey>(ALL_FILTER);

  const filteredHabits = useMemo(() => {
    if (activeFilter === ALL_FILTER) return habits;
    return habits.filter((h) => h.category === activeFilter);
  }, [habits, activeFilter]);

  // -- Modal state ------------------------------------------------------------

  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<HabitCategory>("health");
  const [formIconIndex, setFormIconIndex] = useState(0);
  const [formColorIndex, setFormColorIndex] = useState(0);

  // -- Modal helpers ----------------------------------------------------------

  const openAddModal = useCallback(() => {
    setEditingHabit(null);
    setFormName("");
    setFormCategory("health");
    setFormIconIndex(0);
    setFormColorIndex(0);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setFormName(habit.label);
    setFormCategory(habit.category);

    const iconIdx = HABIT_ICON_OPTIONS.findIndex((o) => o.icon === habit.icon);
    setFormIconIndex(iconIdx >= 0 ? iconIdx : 0);

    const colorIdx = HABIT_COLOR_OPTIONS.findIndex(
      (c) => c.bg === habit.background,
    );
    setFormColorIndex(colorIdx >= 0 ? colorIdx : 0);

    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = formName.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter a habit name.");
      return;
    }

    const selectedIcon = HABIT_ICON_OPTIONS[formIconIndex];
    const selectedColor = HABIT_COLOR_OPTIONS[formColorIndex];

    const payload = {
      label: trimmed,
      icon: selectedIcon.icon,
      iconColor: selectedColor.icon,
      background: selectedColor.bg,
      category: formCategory,
    };

    if (editingHabit) {
      await updateHabit(editingHabit.id, payload);
    } else {
      await addHabit(payload);
    }

    setModalVisible(false);
  }, [
    formName,
    formIconIndex,
    formColorIndex,
    formCategory,
    editingHabit,
    addHabit,
    updateHabit,
  ]);

  // -- Delete flow ------------------------------------------------------------

  const confirmDelete = useCallback(
    (habit: Habit) => {
      Alert.alert(
        "Delete Habit",
        `Are you sure you want to delete "${habit.label}"? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteHabit(habit.id),
          },
        ],
      );
    },
    [deleteHabit],
  );

  const showHabitMenu = useCallback(
    (habit: Habit) => {
      Alert.alert(habit.label, undefined, [
        {
          text: "Edit",
          onPress: () => openEditModal(habit),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(habit),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [openEditModal, confirmDelete],
  );

  // -- Render helpers ---------------------------------------------------------

  const renderFilterTabs = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {FILTER_OPTIONS.map((opt) => {
          const isActive = activeFilter === opt.key;
          const count =
            opt.key === ALL_FILTER
              ? habits.length
              : habits.filter((h) => h.category === opt.key).length;
          return (
            <TouchableOpacity
              key={opt.key}
              activeOpacity={0.7}
              onPress={() => setActiveFilter(opt.key)}
              style={[
                styles.tab,
                isActive && { backgroundColor: accentColor },
                !isActive && { backgroundColor: t.cardBg },
              ]}
            >
              <ThemedText
                style={[styles.tabText, isActive && styles.tabTextActive]}
                lightColor={isActive ? "#FFFFFF" : Palette.light.textSubtle}
                darkColor={isActive ? "#FFFFFF" : Palette.dark.textSubtle}
              >
                {opt.label}
              </ThemedText>
              <View
                style={[
                  styles.tabBadge,
                  isActive && styles.tabBadgeActive,
                  !isActive && { backgroundColor: t.chipBg },
                ]}
              >
                <ThemedText
                  style={[
                    styles.tabBadgeText,
                    isActive && styles.tabBadgeTextActive,
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
                  {count}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderWeekDots = (habitId: string) => {
    const progress = getWeekProgress(habitId);
    const completedCount = progress.filter(Boolean).length;
    const filledColor = isDarkMode ? "#E8EAED" : "#111318";
    const emptyColor = isDarkMode ? "#2E333A" : "#E0E2E6";

    return (
      <View style={styles.weekRow}>
        <View style={styles.dotsContainer}>
          {progress.map((done, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: done ? filledColor : emptyColor,
                },
              ]}
            />
          ))}
        </View>
        <ThemedText style={[styles.weekCounter, { color: t.textSubtle }]}>
          {completedCount}/7
        </ThemedText>
      </View>
    );
  };

  const renderHabitCard = (habit: Habit) => {
    const colors = resolveHabitColors(habit, isDarkMode);
    const streak = getStreak(habit.id);

    return (
      <View
        key={habit.id}
        style={[styles.card, { backgroundColor: t.cardBg }, shadow.card]}
      >
        <View style={styles.cardTop}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: colors.bg }]}>
            <MaterialIcons
              name={habit.icon as any}
              size={22}
              color={colors.icon}
            />
          </View>

          {/* Center text */}
          <View style={styles.cardTextWrap}>
            <ThemedText
              style={[styles.habitName, { color: t.textPrimary }]}
              numberOfLines={1}
            >
              {habit.label}
            </ThemedText>
            <ThemedText style={[styles.streakText, { color: t.textSecondary }]}>
              {streak} Day Streak
            </ThemedText>
          </View>

          {/* Menu button */}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => showHabitMenu(habit)}
            style={styles.menuBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="more-horiz" size={24} color={t.textSubtle} />
          </TouchableOpacity>
        </View>

        {/* Week dots */}
        {renderWeekDots(habit.id)}
      </View>
    );
  };

  // -- Modal ------------------------------------------------------------------

  const renderModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContent, { backgroundColor: t.cardBg }]}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: t.textPrimary }]}>
                {editingHabit ? "Edit Habit" : "New Habit"}
              </ThemedText>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color={t.textSubtle} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name */}
              <ThemedText
                style={[styles.fieldLabel, { color: t.textSecondary }]}
              >
                Name
              </ThemedText>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Drink Water"
                placeholderTextColor={t.inputPlaceholder}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: t.inputBg,
                    color: t.inputText,
                    borderColor: t.border,
                  },
                ]}
                maxLength={32}
              />

              {/* Category */}
              <ThemedText
                style={[
                  styles.fieldLabel,
                  { color: t.textSecondary, marginTop: 20 },
                ]}
              >
                Category
              </ThemedText>
              <View style={styles.categoryRow}>
                {HABIT_CATEGORIES.map((cat) => {
                  const active = formCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      activeOpacity={0.7}
                      onPress={() => setFormCategory(cat.key)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? t.chipBgActive : t.chipBg,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.chipText,
                          {
                            color: active ? t.chipTextActive : t.textSecondary,
                          },
                        ]}
                      >
                        {cat.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Icon */}
              <ThemedText
                style={[
                  styles.fieldLabel,
                  { color: t.textSecondary, marginTop: 20 },
                ]}
              >
                Icon
              </ThemedText>
              <View style={styles.iconGrid}>
                {HABIT_ICON_OPTIONS.map((opt, idx) => {
                  const active = formIconIndex === idx;
                  return (
                    <TouchableOpacity
                      key={opt.icon}
                      activeOpacity={0.7}
                      onPress={() => setFormIconIndex(idx)}
                      style={[
                        styles.iconOption,
                        {
                          backgroundColor: active
                            ? isDarkMode
                              ? Brand.primaryMuted
                              : Brand.infoBg
                            : t.chipBg,
                          borderColor: active ? accentColor : "transparent",
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={opt.icon as any}
                        size={22}
                        color={active ? accentColor : t.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Color */}
              <ThemedText
                style={[
                  styles.fieldLabel,
                  { color: t.textSecondary, marginTop: 20 },
                ]}
              >
                Color
              </ThemedText>
              <View style={styles.colorGrid}>
                {HABIT_COLOR_OPTIONS.map((color, idx) => {
                  const active = formColorIndex === idx;
                  const displayBg = isDarkMode ? color.bgDark : color.bg;
                  const displayIcon = isDarkMode ? color.iconDark : color.icon;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.7}
                      onPress={() => setFormColorIndex(idx)}
                      style={[
                        styles.colorOption,
                        {
                          backgroundColor: displayBg,
                          borderColor: active ? displayIcon : "transparent",
                          borderWidth: 3,
                        },
                      ]}
                    >
                      {active && (
                        <MaterialIcons
                          name="check"
                          size={18}
                          color={displayIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Save button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: accentColor }]}
            >
              <ThemedText style={styles.saveBtnText}>
                {editingHabit ? "Save Changes" : "Create Habit"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // -- Main render ------------------------------------------------------------

  return (
    <ThemedView style={[styles.root, { backgroundColor: t.pageBg }]}>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        {/* Navigation bar */}
        <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => router.back()}
            style={styles.navBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={t.textPrimary} />
          </TouchableOpacity>

          <ThemedText style={[styles.navTitle, { color: t.textPrimary }]}>
            My Habits
          </ThemedText>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={openAddModal}
            style={styles.navBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="add" size={26} color={t.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterWrap}>{renderFilterTabs()}</View>

        {/* Habit list */}
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredHabits.length === 0 && !isLoading && (
            <View style={styles.emptyWrap}>
              <MaterialIcons
                name="emoji-nature"
                size={48}
                color={t.emptyIcon}
              />
              <ThemedText style={[styles.emptyText, { color: t.textSubtle }]}>
                No habits yet. Tap + to create one!
              </ThemedText>
            </View>
          )}

          {filteredHabits.map((habit) => renderHabitCard(habit))}
        </ScrollView>

        {/* FAB */}
        {/*<TouchableOpacity
          activeOpacity={0.8}
          onPress={openAddModal}
          style={[styles.fab, { backgroundColor: t.fabBg }, shadow.fab]}
        >
          <MaterialIcons name="add" size={28} color={t.fabIcon} />
        </TouchableOpacity>*/}
      </SafeAreaView>

      {/* Add / Edit modal */}
      {renderModal()}
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },

  // -- Nav bar ----------------------------------------------------------------
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    // paddingTop is set inline via insets.top + 8
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // -- Filter chips -----------------------------------------------------------
  filterWrap: {
    flexShrink: 0,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
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
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  tabBadgeTextActive: {
    color: "#FFFFFF",
  },

  // -- List -------------------------------------------------------------------
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
    gap: 12,
  },

  // -- Card -------------------------------------------------------------------
  card: {
    borderRadius: 16,
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTextWrap: {
    flex: 1,
    gap: 2,
  },
  habitName: {
    fontSize: 16,
    fontWeight: "700",
  },
  streakText: {
    fontSize: 13,
    fontWeight: "500",
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // -- Week dots --------------------------------------------------------------
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    justifyContent: "space-between",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  weekCounter: {
    fontSize: 13,
    fontWeight: "600",
  },

  // -- Empty state ------------------------------------------------------------
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },

  // -- FAB --------------------------------------------------------------------
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  // -- Modal ------------------------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalScroll: {
    paddingBottom: 16,
  },

  // -- Form fields ------------------------------------------------------------
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  // -- Save button ------------------------------------------------------------
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
