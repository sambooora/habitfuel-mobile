// @ts-nocheck
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, DeviceEventEmitter, StyleSheet, View } from "react-native";
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

import { TABBAR_SCROLL_PADDING } from "@/components/floating-tab-bar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, Palette, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  CATEGORY_CONFIG,
  computeStats,
  formatCurrency,
  formatTransactionDate,
  getWeekLabel,
  type Transaction,
  type TransactionCategory,
  type TransactionType,
  useFinanceStorage,
} from "@/hooks/use-finance-storage";

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as TransactionCategory[];

export default function FinanceScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const t = isDarkMode ? Palette.dark : Palette.light;
  const shadow = isDarkMode ? Shadows.dark : Shadows.light;
  const {
    transactions,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinanceStorage();

  // Week navigation: 0 = this week, -1 = last week, etc.
  const [weekOffset, setWeekOffset] = useState(0);

  // Recompute stats for the viewed week whenever offset or transactions change
  const stats = useMemo(
    () => computeStats(transactions, weekOffset),
    [transactions, weekOffset],
  );

  const weekLabel = useMemo(() => getWeekLabel(weekOffset), [weekOffset]);

  const goToPrevWeek = useCallback(() => setWeekOffset((o) => o - 1), []);
  const goToNextWeek = useCallback(() => setWeekOffset((o) => o + 1), []);
  const isCurrentWeek = weekOffset === 0;

  // Dialog states
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [detailTransaction, setDetailTransaction] =
    useState<Transaction | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [formCategory, setFormCategory] =
    useState<TransactionCategory>("other");
  const [formNote, setFormNote] = useState("");

  const resetForm = useCallback(() => {
    setFormTitle("");
    setFormAmount("");
    setFormType("expense");
    setFormCategory("other");
    setFormNote("");
    setEditingTransaction(null);
  }, []);

  const openAddSheet = useCallback(() => {
    resetForm();
    setFormSheetOpen(true);
  }, [resetForm]);

  // Listen for the standalone "add" button in the floating tab bar
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("tabbar:add:finances", () => {
      openAddSheet();
    });
    return () => sub.remove();
  }, [openAddSheet]);

  const openEditSheet = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormTitle(transaction.title);
    setFormAmount(transaction.amount.toString());
    setFormType(transaction.type);
    setFormCategory(transaction.category);
    setFormNote(transaction.note ?? "");
    setDetailSheetOpen(false);
    setTimeout(() => setFormSheetOpen(true), 300);
  }, []);

  const openDetailSheet = useCallback((transaction: Transaction) => {
    setDetailTransaction(transaction);
    setDetailSheetOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formTitle.trim()) {
      Alert.alert("Validation", "Please enter a title.");
      return;
    }
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Validation", "Please enter a valid amount.");
      return;
    }

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        title: formTitle.trim(),
        amount,
        type: formType,
        category: formCategory,
        note: formNote.trim() || undefined,
      });
    } else {
      await addTransaction({
        title: formTitle.trim(),
        amount,
        type: formType,
        category: formCategory,
        date: new Date().toISOString(),
        note: formNote.trim() || undefined,
      });
    }

    setFormSheetOpen(false);
    resetForm();
  }, [
    formTitle,
    formAmount,
    formType,
    formCategory,
    formNote,
    editingTransaction,
    addTransaction,
    updateTransaction,
    resetForm,
  ]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        "Delete Transaction",
        "Are you sure you want to delete this transaction?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteTransaction(id);
              setDetailSheetOpen(false);
            },
          },
        ],
      );
    },
    [deleteTransaction],
  );

  // Stats cards — income/expense totals reflect the viewed week
  const statCards = useMemo(
    () => [
      {
        label: "Income",
        amount: formatCurrency(stats.totalIncome),
        change:
          stats.incomeChange >= 0
            ? `+${stats.incomeChange}% vs prev week`
            : `${stats.incomeChange}% vs prev week`,
        icon: "north-east" as const,
        active: true,
      },
      {
        label: "Expense",
        amount: formatCurrency(stats.totalExpense),
        change:
          stats.expenseChange >= 0
            ? `+${stats.expenseChange}% vs prev week`
            : `${stats.expenseChange}% vs prev week`,
        icon: "south-east" as const,
        active: false,
      },
    ],
    [stats],
  );

  // Chart data
  const chartData = useMemo(() => {
    const maxVal = Math.max(
      ...stats.weeklyData.map((d) => Math.max(d.income, d.expense)),
      1,
    );
    return stats.weeklyData.map((entry) => ({
      day: entry.day,
      inHeight: Math.max(
        (entry.income / maxVal) * 70,
        entry.income > 0 ? 6 : 0,
      ),
      outHeight: Math.max(
        (entry.expense / maxVal) * 70,
        entry.expense > 0 ? 6 : 0,
      ),
    }));
  }, [stats.weeklyData]);

  const recentTransactions = useMemo(
    () => transactions.slice(0, 10),
    [transactions],
  );

  const themedBg = t.cardBg;

  if (isLoading) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1, backgroundColor: t.pageBg }}
      >
        <ThemedView
          style={[styles.container, styles.center]}
          lightColor={Palette.light.pageBg}
          darkColor={Palette.dark.pageBg}
        >
          <ThemedText
            lightColor={Palette.light.textSubtle}
            darkColor={Palette.dark.textSubtle}
          >
            Loading...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

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
        <TScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText
                style={styles.headerLabel}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                FINANCE
              </ThemedText>
              <ThemedText
                style={styles.headerTitle}
                lightColor={Palette.light.textPrimary}
                darkColor={Palette.dark.textPrimary}
              >
                Statistics
              </ThemedText>
            </View>
            <View style={styles.headerRight}>
              <ThemedText
                style={styles.balanceLabel}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                Balance
              </ThemedText>
              <ThemedText
                style={styles.balanceAmount}
                lightColor={Palette.light.textPrimary}
                darkColor={Palette.dark.textPrimary}
              >
                {stats.balance >= 0 ? "+" : "-"}
                {formatCurrency(Math.abs(stats.balance))}
              </ThemedText>
            </View>
          </View>

          {/* Stat Cards */}
          <View style={styles.statRow}>
            {statCards.map((stat) => (
              <View
                key={stat.label}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: stat.active
                      ? t.statCardActiveBg
                      : t.statCardBg,
                  },
                  shadow.card,
                ]}
              >
                <View
                  style={[styles.statIcon, { backgroundColor: t.statIconBg }]}
                >
                  <MaterialIcons
                    name={stat.icon}
                    size={18}
                    color={stat.active ? t.textPrimary : t.taskIconColor}
                  />
                </View>
                <ThemedText
                  style={styles.statLabel}
                  lightColor={Palette.light.textSubtle}
                  darkColor={Palette.dark.textSubtle}
                >
                  {stat.label}
                </ThemedText>
                <ThemedText
                  style={styles.statAmount}
                  lightColor={Palette.light.textPrimary}
                  darkColor={Palette.dark.textPrimary}
                >
                  {stat.amount}
                </ThemedText>
                <ThemedText
                  style={styles.statChange}
                  lightColor={Palette.light.textSecondary}
                  darkColor={Palette.dark.textSecondary}
                >
                  {stat.change}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Overview Chart */}
          <View style={styles.sectionHeader}>
            <ThemedText
              style={styles.sectionTitle}
              lightColor={Palette.light.textPrimary}
              darkColor={Palette.dark.textPrimary}
            >
              {weekLabel}
            </ThemedText>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: t.chartBarPrimary },
                  ]}
                />
                <ThemedText
                  style={styles.legendText}
                  lightColor={Palette.light.textSubtle}
                  darkColor={Palette.dark.textSubtle}
                >
                  In
                </ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: t.chartBarMuted },
                  ]}
                />
                <ThemedText
                  style={styles.legendText}
                  lightColor={Palette.light.textSubtle}
                  darkColor={Palette.dark.textSubtle}
                >
                  Out
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Week navigation */}
          <View style={styles.weekNav}>
            <Button
              unstyled
              pressStyle={{ opacity: 0.6 }}
              onPress={goToPrevWeek}
              style={[
                styles.weekNavBtn,
                { backgroundColor: t.cardBg },
                shadow.cardSubtle,
              ]}
            >
              <MaterialIcons
                name="chevron-left"
                size={20}
                color={t.textSubtle}
              />
              <ThemedText
                style={styles.weekNavText}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                Prev
              </ThemedText>
            </Button>

            <Button
              unstyled
              pressStyle={{ opacity: 0.6 }}
              onPress={goToNextWeek}
              disabled={isCurrentWeek}
              style={[
                styles.weekNavBtn,
                { backgroundColor: t.cardBg },
                shadow.cardSubtle,
                isCurrentWeek && { opacity: 0.35 },
              ]}
            >
              <ThemedText
                style={styles.weekNavText}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                Next
              </ThemedText>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={t.textSubtle}
              />
            </Button>
          </View>

          <View
            style={[styles.chart, { backgroundColor: t.cardBg }, shadow.card]}
          >
            {chartData.map((entry, index) => (
              <View key={`${entry.day}-${index}`} style={styles.chartColumn}>
                <View style={styles.chartBars}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: entry.inHeight || 2,
                        backgroundColor: t.chartBarPrimary,
                      },
                      entry.inHeight === 0 && { opacity: 0.2 },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBarMuted,
                      {
                        height: entry.outHeight || 2,
                        backgroundColor: t.chartBarMuted,
                      },
                      entry.outHeight === 0 && { opacity: 0.2 },
                    ]}
                  />
                </View>
                <ThemedText
                  style={styles.chartLabel}
                  lightColor={Palette.light.textSubtle}
                  darkColor={Palette.dark.textSubtle}
                >
                  {entry.day}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Transactions List */}
          <View style={styles.sectionHeader}>
            <ThemedText
              style={styles.sectionTitle}
              lightColor={Palette.light.textPrimary}
              darkColor={Palette.dark.textPrimary}
            >
              Recent Transactions
            </ThemedText>
            <ThemedText
              style={styles.sectionLink}
              lightColor={Palette.light.textSubtle}
              darkColor={Palette.dark.textSubtle}
            >
              {transactions.length} Total
            </ThemedText>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: themedBg }]}>
              <MaterialIcons
                name="receipt-long"
                size={40}
                color={t.emptyIcon}
              />
              <ThemedText
                style={styles.emptyText}
                lightColor={Palette.light.textSubtle}
                darkColor={Palette.dark.textSubtle}
              >
                No transactions yet.{"\n"}Tap + to add your first one!
              </ThemedText>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {recentTransactions.map((item) => {
                const catConfig =
                  CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
                return (
                  <Button
                    key={item.id}
                    unstyled
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => openDetailSheet(item)}
                  >
                    <View
                      style={[
                        styles.transactionRow,
                        { backgroundColor: t.cardBg },
                        shadow.cardSubtle,
                      ]}
                    >
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor:
                              item.type === "income"
                                ? t.transactionIncomeBg
                                : t.transactionExpenseBg,
                          },
                        ]}
                      >
                        <MaterialIcons
                          name={catConfig.icon as any}
                          size={18}
                          color={
                            item.type === "income"
                              ? t.transactionIncomeIcon
                              : t.transactionExpenseIcon
                          }
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <ThemedText
                          style={styles.transactionTitle}
                          lightColor={Palette.light.textPrimary}
                          darkColor={Palette.dark.textPrimary}
                        >
                          {item.title}
                        </ThemedText>
                        <ThemedText
                          style={styles.transactionTime}
                          lightColor={Palette.light.textSubtle}
                          darkColor={Palette.dark.textSubtle}
                        >
                          {formatTransactionDate(item.date)}
                        </ThemedText>
                      </View>
                      <ThemedText
                        style={styles.transactionAmount}
                        lightColor={Palette.light.textPrimary}
                        darkColor={Palette.dark.textPrimary}
                      >
                        {item.type === "income" ? "+" : "-"}
                        {formatCurrency(item.amount)}
                      </ThemedText>
                    </View>
                  </Button>
                );
              })}
            </View>
          )}
        </TScrollView>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* DETAIL DIALOG                                          */}
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
                  <Dialog.Title>Transaction Detail</Dialog.Title>
                  <Dialog.Description>
                    View transaction details
                  </Dialog.Description>
                </VisuallyHidden>
                {detailTransaction && (
                  <TScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    {/* Header */}
                    <YStack alignItems="center" marginBottom="$5" gap="$2">
                      <YStack
                        width={56}
                        height={56}
                        borderRadius={20}
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor={
                          detailTransaction.type === "income"
                            ? t.transactionIncomeBg
                            : t.transactionExpenseBg
                        }
                        marginBottom="$2"
                      >
                        <MaterialIcons
                          name={
                            (CATEGORY_CONFIG[detailTransaction.category]
                              ?.icon || "more-horiz") as any
                          }
                          size={28}
                          color={
                            detailTransaction.type === "income"
                              ? t.transactionIncomeIcon
                              : t.transactionExpenseIcon
                          }
                        />
                      </YStack>
                      <Text fontSize={20} fontWeight="700" textAlign="center">
                        {detailTransaction.title}
                      </Text>
                      <Text
                        fontSize={28}
                        fontWeight="800"
                        color="$color"
                      >
                        {detailTransaction.type === "income" ? "+" : "-"}
                        {formatCurrency(detailTransaction.amount)}
                      </Text>
                    </YStack>

                    <Separator marginBottom="$4" />

                    {/* Info Rows */}
                    <YStack gap="$3" marginBottom="$5">
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text fontSize={13} color="$colorSubtle">
                          Type
                        </Text>
                        <Text fontSize={14} fontWeight="600">
                          {detailTransaction.type === "income"
                            ? "Income"
                            : "Expense"}
                        </Text>
                      </XStack>
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text fontSize={13} color="$colorSubtle">
                          Category
                        </Text>
                        <Text fontSize={14} fontWeight="600">
                          {CATEGORY_CONFIG[detailTransaction.category]?.label ||
                            "Other"}
                        </Text>
                      </XStack>
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text fontSize={13} color="$colorSubtle">
                          Date
                        </Text>
                        <Text fontSize={14} fontWeight="600">
                          {formatTransactionDate(detailTransaction.date)}
                        </Text>
                      </XStack>
                      {detailTransaction.note ? (
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
                            {detailTransaction.note}
                          </Text>
                        </XStack>
                      ) : null}
                    </YStack>

                    {/* Actions */}
                    <XStack gap="$3" marginBottom="$3">
                      <Button
                        flex={1}
                        backgroundColor={t.textPrimary}
                        color={t.textInverse}
                        borderRadius={14}
                        height={48}
                        pressStyle={{ opacity: 0.85 }}
                        icon={
                          <MaterialIcons
                            name="edit"
                            size={18}
                            color={t.textInverse}
                          />
                        }
                        onPress={() => openEditSheet(detailTransaction)}
                      >
                        Edit
                      </Button>
                      <Button
                        flex={1}
                        backgroundColor={t.chipBg}
                        color={t.textSecondary}
                        borderRadius={14}
                        height={48}
                        pressStyle={{ opacity: 0.85 }}
                        icon={
                          <MaterialIcons
                            name="delete"
                            size={18}
                            color={t.textSecondary}
                          />
                        }
                        onPress={() => handleDelete(detailTransaction.id)}
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
                      backgroundColor={themedBg}
                      pressStyle={{ opacity: 0.7 }}
                    >
                      <MaterialIcons
                        name="close"
                        size={18}
                        color={t.textSubtle}
                      />
                    </Button>
                  </Dialog.Close>
                </Unspaced>
              </Dialog.Content>
            </Dialog.FocusScope>
          </Dialog.Portal>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ADD / EDIT DIALOG                                      */}
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
                  {editingTransaction ? "Edit Transaction" : "Add Transaction"}
                </Dialog.Title>
                <VisuallyHidden>
                  <Dialog.Description>
                    Create or edit a transaction
                  </Dialog.Description>
                </VisuallyHidden>
                <TScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  automaticallyAdjustKeyboardInsets
                  contentContainerStyle={{ paddingBottom: 32 }}
                >
                  {/* Type Selector */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Type
                  </Text>
                  <XStack gap="$3" marginBottom="$4">
                    <Button
                      flex={1}
                      height={48}
                      borderRadius={14}
                      borderWidth={1}
                      borderColor={
                        formType === "income" ? t.textPrimary : "$borderColor"
                      }
                      backgroundColor={
                        formType === "income" ? t.textPrimary : "transparent"
                      }
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => setFormType("income")}
                      icon={
                        <MaterialIcons
                          name="north-east"
                          size={16}
                          color={
                            formType === "income" ? t.textInverse : t.textSubtle
                          }
                        />
                      }
                    >
                      <Text
                        fontWeight="600"
                        fontSize={14}
                        color={formType === "income" ? t.textInverse : "$color"}
                      >
                        Income
                      </Text>
                    </Button>
                    <Button
                      flex={1}
                      height={48}
                      borderRadius={14}
                      borderWidth={1}
                      borderColor={
                        formType === "expense" ? t.textPrimary : "$borderColor"
                      }
                      backgroundColor={
                        formType === "expense" ? t.textPrimary : "transparent"
                      }
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => setFormType("expense")}
                      icon={
                        <MaterialIcons
                          name="south-east"
                          size={16}
                          color={
                            formType === "expense" ? t.textInverse : t.textSubtle
                          }
                        />
                      }
                    >
                      <Text
                        fontWeight="600"
                        fontSize={14}
                        color={formType === "expense" ? t.textInverse : "$color"}
                      >
                        Expense
                      </Text>
                    </Button>
                  </XStack>

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
                    placeholder="e.g. Grocery Store"
                    borderRadius={14}
                    height={48}
                    marginBottom="$4"
                    fontSize={15}
                  />

                  {/* Amount */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Amount
                  </Text>
                  <Input
                    value={formAmount}
                    onChangeText={setFormAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    borderRadius={14}
                    height={48}
                    marginBottom="$4"
                    fontSize={15}
                  />

                  {/* Category */}
                  <Text
                    fontSize={12}
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$colorSubtle"
                    marginBottom="$2"
                  >
                    Category
                  </Text>
                  <XStack flexWrap="wrap" gap="$2" marginBottom="$4">
                    {CATEGORIES.map((cat) => {
                      const isSelected = formCategory === cat;
                      const config = CATEGORY_CONFIG[cat];
                      return (
                        <Button
                          key={cat}
                          size="$3"
                          borderRadius={12}
                          borderWidth={1}
                          borderColor={
                            isSelected ? t.textPrimary : "$borderColor"
                          }
                          backgroundColor={
                            isSelected ? t.textPrimary : "$backgroundFocus"
                          }
                          pressStyle={{ opacity: 0.8 }}
                          onPress={() => setFormCategory(cat)}
                          icon={
                            <MaterialIcons
                              name={config.icon as any}
                              size={14}
                              color={isSelected ? "#FFFFFF" : t.textSubtle}
                            />
                          }
                        >
                          <Text
                            fontSize={12}
                            fontWeight="500"
                            color={isSelected ? "#FFFFFF" : "$color"}
                          >
                            {config.label}
                          </Text>
                        </Button>
                      );
                    })}
                  </XStack>

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
                    placeholder="Add a note..."
                    borderRadius={14}
                    marginBottom="$4"
                    numberOfLines={3}
                    minHeight={80}
                    fontSize={15}
                    textAlignVertical="top"
                  />

                  {/* Save Button */}
                  <Button
                    backgroundColor={t.textPrimary}
                    color={t.textInverse}
                    borderRadius={16}
                    height={52}
                    pressStyle={{ opacity: 0.85 }}
                    marginTop="$2"
                    marginBottom="$2"
                    onPress={handleSave}
                  >
                    <Text color="#FFFFFF" fontSize={15} fontWeight="700">
                      {editingTransaction
                        ? "Update Transaction"
                        : "Add Transaction"}
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
                      backgroundColor={themedBg}
                      pressStyle={{ opacity: 0.7 }}
                      onPress={() => {
                        setFormSheetOpen(false);
                        resetForm();
                      }}
                    >
                      <MaterialIcons
                        name="close"
                        size={18}
                        color={t.textSubtle}
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
  weekNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  weekNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  weekNavText: {
    fontSize: 13,
    fontWeight: "500",
  },
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
    paddingBottom: TABBAR_SCROLL_PADDING,
    gap: 18,
  },
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
  headerRight: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  statChange: {
    fontSize: 12,
  },
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
  legend: {
    flexDirection: "row",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  chartColumn: {
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 80,
  },
  chartBar: {
    width: 6,
    borderRadius: 99,
  },
  chartBarMuted: {
    width: 6,
    borderRadius: 99,
  },
  chartLabel: {
    fontSize: 12,
  },
  transactionList: {
    gap: 12,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  transactionTime: {
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  amountPositive: {},
  amountNegative: {},
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderRadius: 20,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
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
});
