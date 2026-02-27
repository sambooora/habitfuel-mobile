import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  CATEGORY_CONFIG,
  formatCurrency,
  formatTransactionDate,
  type Transaction,
  type TransactionCategory,
  type TransactionType,
  useFinanceStorage,
} from "@/hooks/use-finance-storage";

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as TransactionCategory[];

export default function FinanceScreen() {
  const isDarkMode = useColorScheme() === "dark";
  const {
    transactions,
    stats,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinanceStorage();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [detailTransaction, setDetailTransaction] =
    useState<Transaction | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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

  const openAddModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEditModal = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormTitle(transaction.title);
    setFormAmount(transaction.amount.toString());
    setFormType(transaction.type);
    setFormCategory(transaction.category);
    setFormNote(transaction.note ?? "");
    setDetailModalVisible(false);
    setModalVisible(true);
  }, []);

  const openDetailModal = useCallback((transaction: Transaction) => {
    setDetailTransaction(transaction);
    setDetailModalVisible(true);
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

    setModalVisible(false);
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
              setDetailModalVisible(false);
            },
          },
        ],
      );
    },
    [deleteTransaction],
  );

  // Stats cards
  const statCards = useMemo(
    () => [
      {
        label: "Income",
        amount: formatCurrency(stats.totalIncome),
        change:
          stats.incomeChange >= 0
            ? `+${stats.incomeChange}% vs last week`
            : `${stats.incomeChange}% vs last week`,
        icon: "north-east" as const,
        active: true,
      },
      {
        label: "Expense",
        amount: formatCurrency(stats.totalExpense),
        change:
          stats.expenseChange >= 0
            ? `+${stats.expenseChange}% vs last week`
            : `${stats.expenseChange}% vs last week`,
        icon: "south-east" as const,
        active: false,
      },
    ],
    [stats],
  );

  // Chart data - normalize to max 80px height
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

  const themedBg = isDarkMode ? "#14171B" : "#FFFFFF";
  const themedModalBg = isDarkMode ? "#1C1F24" : "#FFFFFF";
  const themedInputBg = isDarkMode ? "#23272D" : "#F4F5F7";
  const themedInputText = isDarkMode ? "#F2F3F5" : "#14171B";
  const themedBorder = isDarkMode ? "#2A2E35" : "#E8EAED";
  const themedSubText = isDarkMode ? "#AAB1B8" : "#8F98A1";

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView
        style={styles.container}
        lightColor="#F6F6F6"
        darkColor="#0E0F10"
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText
                style={styles.headerLabel}
                lightColor="#8F98A1"
                darkColor="#8F98A1"
              >
                FINANCE
              </ThemedText>
              <ThemedText
                style={styles.headerTitle}
                lightColor="#14171B"
                darkColor="#F2F3F5"
              >
                Statistics
              </ThemedText>
            </View>
            <View style={styles.headerRight}>
              <ThemedText
                style={styles.balanceLabel}
                lightColor="#8F98A1"
                darkColor="#AAB1B8"
              >
                Balance
              </ThemedText>
              <ThemedText
                style={[
                  styles.balanceAmount,
                  stats.balance >= 0
                    ? styles.amountPositive
                    : styles.amountNegative,
                ]}
                lightColor="#14171B"
                darkColor="#F2F3F5"
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
                  stat.active ? styles.statCardActive : null,
                  isDarkMode ? styles.cardDark : null,
                ]}
              >
                <View style={styles.statIcon}>
                  <MaterialIcons name={stat.icon} size={18} color="#111318" />
                </View>
                <ThemedText
                  style={styles.statLabel}
                  lightColor={stat.active ? "#111318" : "#8F98A1"}
                  darkColor={stat.active ? "#111318" : "#AAB1B8"}
                >
                  {stat.label}
                </ThemedText>
                <ThemedText
                  style={styles.statAmount}
                  lightColor="#111318"
                  darkColor="#F2F3F5"
                >
                  {stat.amount}
                </ThemedText>
                <ThemedText
                  style={styles.statChange}
                  lightColor={stat.active ? "#111318" : "#8F98A1"}
                  darkColor={stat.active ? "#111318" : "#AAB1B8"}
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
              lightColor="#14171B"
              darkColor="#F2F3F5"
            >
              This Week
            </ThemedText>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#111318" }]}
                />
                <ThemedText
                  style={styles.legendText}
                  lightColor="#8F98A1"
                  darkColor="#AAB1B8"
                >
                  In
                </ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#C8CDD3" }]}
                />
                <ThemedText
                  style={styles.legendText}
                  lightColor="#8F98A1"
                  darkColor="#AAB1B8"
                >
                  Out
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.chart, isDarkMode ? styles.cardDark : null]}>
            {chartData.map((entry, index) => (
              <View key={`${entry.day}-${index}`} style={styles.chartColumn}>
                <View style={styles.chartBars}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: entry.inHeight || 2 },
                      entry.inHeight === 0 && { opacity: 0.2 },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBarMuted,
                      { height: entry.outHeight || 2 },
                      entry.outHeight === 0 && { opacity: 0.2 },
                    ]}
                  />
                </View>
                <ThemedText
                  style={styles.chartLabel}
                  lightColor="#8F98A1"
                  darkColor="#AAB1B8"
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
              lightColor="#14171B"
              darkColor="#F2F3F5"
            >
              Recent Transactions
            </ThemedText>
            <ThemedText
              style={styles.sectionLink}
              lightColor="#8F98A1"
              darkColor="#AAB1B8"
            >
              {transactions.length} Total
            </ThemedText>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: themedBg }]}>
              <MaterialIcons
                name="receipt-long"
                size={40}
                color={isDarkMode ? "#3A3F47" : "#CDD2D8"}
              />
              <ThemedText
                style={styles.emptyText}
                lightColor="#8F98A1"
                darkColor="#AAB1B8"
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
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => openDetailModal(item)}
                  >
                    <View
                      style={[
                        styles.transactionRow,
                        isDarkMode ? styles.cardDark : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.transactionIcon,
                          item.type === "income"
                            ? { backgroundColor: "#E6F5EE" }
                            : { backgroundColor: "#F0F2F4" },
                        ]}
                      >
                        <MaterialIcons
                          name={catConfig.icon as any}
                          size={18}
                          color={item.type === "income" ? "#0A8F5A" : "#111318"}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <ThemedText
                          style={styles.transactionTitle}
                          lightColor="#14171B"
                          darkColor="#F2F3F5"
                        >
                          {item.title}
                        </ThemedText>
                        <ThemedText
                          style={styles.transactionTime}
                          lightColor="#8F98A1"
                          darkColor="#AAB1B8"
                        >
                          {formatTransactionDate(item.date)}
                        </ThemedText>
                      </View>
                      <ThemedText
                        style={[
                          styles.transactionAmount,
                          item.type === "income" ? styles.amountPositive : null,
                        ]}
                        lightColor="#111318"
                        darkColor="#F2F3F5"
                      >
                        {item.type === "income" ? "+" : "-"}
                        {formatCurrency(item.amount)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Detail Modal */}
        <Modal
          visible={detailModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setDetailModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View
                  style={[
                    styles.detailModal,
                    { backgroundColor: themedModalBg },
                  ]}
                >
                  {detailTransaction && (
                    <>
                      <View style={styles.detailHeader}>
                        <View
                          style={[
                            styles.detailIconLarge,
                            detailTransaction.type === "income"
                              ? { backgroundColor: "#E6F5EE" }
                              : { backgroundColor: "#F0F2F4" },
                          ]}
                        >
                          <MaterialIcons
                            name={
                              (CATEGORY_CONFIG[detailTransaction.category]
                                ?.icon || "more-horiz") as any
                            }
                            size={28}
                            color={
                              detailTransaction.type === "income"
                                ? "#0A8F5A"
                                : "#111318"
                            }
                          />
                        </View>
                        <ThemedText
                          style={styles.detailTitle}
                          lightColor="#14171B"
                          darkColor="#F2F3F5"
                        >
                          {detailTransaction.title}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.detailAmount,
                            detailTransaction.type === "income"
                              ? styles.amountPositive
                              : styles.amountNegative,
                          ]}
                        >
                          {detailTransaction.type === "income" ? "+" : "-"}
                          {formatCurrency(detailTransaction.amount)}
                        </ThemedText>
                      </View>

                      <View style={styles.detailRows}>
                        <View style={styles.detailRow}>
                          <ThemedText
                            style={styles.detailLabel}
                            lightColor="#8F98A1"
                            darkColor="#AAB1B8"
                          >
                            Type
                          </ThemedText>
                          <ThemedText
                            style={styles.detailValue}
                            lightColor="#14171B"
                            darkColor="#F2F3F5"
                          >
                            {detailTransaction.type === "income"
                              ? "Income"
                              : "Expense"}
                          </ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                          <ThemedText
                            style={styles.detailLabel}
                            lightColor="#8F98A1"
                            darkColor="#AAB1B8"
                          >
                            Category
                          </ThemedText>
                          <ThemedText
                            style={styles.detailValue}
                            lightColor="#14171B"
                            darkColor="#F2F3F5"
                          >
                            {CATEGORY_CONFIG[detailTransaction.category]
                              ?.label || "Other"}
                          </ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                          <ThemedText
                            style={styles.detailLabel}
                            lightColor="#8F98A1"
                            darkColor="#AAB1B8"
                          >
                            Date
                          </ThemedText>
                          <ThemedText
                            style={styles.detailValue}
                            lightColor="#14171B"
                            darkColor="#F2F3F5"
                          >
                            {formatTransactionDate(detailTransaction.date)}
                          </ThemedText>
                        </View>
                        {detailTransaction.note ? (
                          <View style={styles.detailRow}>
                            <ThemedText
                              style={styles.detailLabel}
                              lightColor="#8F98A1"
                              darkColor="#AAB1B8"
                            >
                              Note
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.detailValue,
                                { flex: 1, textAlign: "right" },
                              ]}
                              lightColor="#14171B"
                              darkColor="#F2F3F5"
                            >
                              {detailTransaction.note}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.detailActions}>
                        <TouchableOpacity
                          style={[styles.detailBtn, styles.editBtn]}
                          onPress={() => openEditModal(detailTransaction)}
                        >
                          <MaterialIcons
                            name="edit"
                            size={18}
                            color="#FFFFFF"
                          />
                          <ThemedText style={styles.detailBtnText}>
                            Edit
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.detailBtn, styles.deleteBtn]}
                          onPress={() => handleDelete(detailTransaction.id)}
                        >
                          <MaterialIcons
                            name="delete"
                            size={18}
                            color="#FFFFFF"
                          />
                          <ThemedText style={styles.detailBtnText}>
                            Delete
                          </ThemedText>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setDetailModalVisible(false)}
                      >
                        <ThemedText
                          style={styles.closeBtnText}
                          lightColor="#8F98A1"
                          darkColor="#AAB1B8"
                        >
                          Close
                        </ThemedText>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Add / Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setModalVisible(false);
            resetForm();
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: themedModalBg },
                  ]}
                >
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                      <ThemedText
                        style={styles.modalTitle}
                        lightColor="#14171B"
                        darkColor="#F2F3F5"
                      >
                        {editingTransaction
                          ? "Edit Transaction"
                          : "Add Transaction"}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => {
                          setModalVisible(false);
                          resetForm();
                        }}
                      >
                        <MaterialIcons
                          name="close"
                          size={24}
                          color={isDarkMode ? "#AAB1B8" : "#8F98A1"}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Type Selector */}
                    <ThemedText
                      style={styles.inputLabel}
                      lightColor="#8F98A1"
                      darkColor="#AAB1B8"
                    >
                      Type
                    </ThemedText>
                    <View style={styles.typeRow}>
                      <TouchableOpacity
                        style={[
                          styles.typeBtn,
                          { borderColor: themedBorder },
                          formType === "income" && styles.typeBtnActiveIncome,
                        ]}
                        onPress={() => setFormType("income")}
                      >
                        <MaterialIcons
                          name="north-east"
                          size={16}
                          color={
                            formType === "income" ? "#FFFFFF" : themedSubText
                          }
                        />
                        <ThemedText
                          style={[
                            styles.typeBtnText,
                            formType === "income" && { color: "#FFFFFF" },
                          ]}
                          lightColor="#14171B"
                          darkColor="#F2F3F5"
                        >
                          Income
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.typeBtn,
                          { borderColor: themedBorder },
                          formType === "expense" && styles.typeBtnActiveExpense,
                        ]}
                        onPress={() => setFormType("expense")}
                      >
                        <MaterialIcons
                          name="south-east"
                          size={16}
                          color={
                            formType === "expense" ? "#FFFFFF" : themedSubText
                          }
                        />
                        <ThemedText
                          style={[
                            styles.typeBtnText,
                            formType === "expense" && { color: "#FFFFFF" },
                          ]}
                          lightColor="#14171B"
                          darkColor="#F2F3F5"
                        >
                          Expense
                        </ThemedText>
                      </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <ThemedText
                      style={styles.inputLabel}
                      lightColor="#8F98A1"
                      darkColor="#AAB1B8"
                    >
                      Title
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: themedInputBg,
                          color: themedInputText,
                          borderColor: themedBorder,
                        },
                      ]}
                      value={formTitle}
                      onChangeText={setFormTitle}
                      placeholder="e.g. Grocery Store"
                      placeholderTextColor={themedSubText}
                    />

                    {/* Amount */}
                    <ThemedText
                      style={styles.inputLabel}
                      lightColor="#8F98A1"
                      darkColor="#AAB1B8"
                    >
                      Amount ($)
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: themedInputBg,
                          color: themedInputText,
                          borderColor: themedBorder,
                        },
                      ]}
                      value={formAmount}
                      onChangeText={setFormAmount}
                      placeholder="0.00"
                      placeholderTextColor={themedSubText}
                      keyboardType="decimal-pad"
                    />

                    {/* Category */}
                    <ThemedText
                      style={styles.inputLabel}
                      lightColor="#8F98A1"
                      darkColor="#AAB1B8"
                    >
                      Category
                    </ThemedText>
                    <View style={styles.categoryGrid}>
                      {CATEGORIES.map((cat) => {
                        const isSelected = formCategory === cat;
                        const config = CATEGORY_CONFIG[cat];
                        return (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.categoryChip,
                              {
                                borderColor: themedBorder,
                                backgroundColor: isSelected
                                  ? "#111318"
                                  : themedInputBg,
                              },
                            ]}
                            onPress={() => setFormCategory(cat)}
                          >
                            <MaterialIcons
                              name={config.icon as any}
                              size={14}
                              color={isSelected ? "#FFFFFF" : themedSubText}
                            />
                            <ThemedText
                              style={[
                                styles.categoryChipText,
                                isSelected && { color: "#FFFFFF" },
                              ]}
                              lightColor="#14171B"
                              darkColor="#F2F3F5"
                            >
                              {config.label}
                            </ThemedText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Note */}
                    <ThemedText
                      style={styles.inputLabel}
                      lightColor="#8F98A1"
                      darkColor="#AAB1B8"
                    >
                      Note (optional)
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        {
                          backgroundColor: themedInputBg,
                          color: themedInputText,
                          borderColor: themedBorder,
                        },
                      ]}
                      value={formNote}
                      onChangeText={setFormNote}
                      placeholder="Add a note..."
                      placeholderTextColor={themedSubText}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />

                    {/* Save Button */}
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSave}
                    >
                      <ThemedText style={styles.saveBtnText}>
                        {editingTransaction
                          ? "Update Transaction"
                          : "Add Transaction"}
                      </ThemedText>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
    paddingBottom: 120,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  statCardActive: {
    backgroundColor: "#F8F9FB",
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#EEF0F2",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
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
    backgroundColor: "#111318",
  },
  chartBarMuted: {
    width: 6,
    borderRadius: 99,
    backgroundColor: "#CDD2D8",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardDark: {
    backgroundColor: "#14171B",
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
  amountPositive: {
    color: "#0A8F5A",
  },
  amountNegative: {
    color: "#D94141",
  },
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
    backgroundColor: "#111318",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 70,
    paddingTop: 14,
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  typeBtnActiveIncome: {
    backgroundColor: "#0A8F5A",
    borderColor: "#0A8F5A",
  },
  typeBtnActiveExpense: {
    backgroundColor: "#D94141",
    borderColor: "#D94141",
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  saveBtn: {
    backgroundColor: "#111318",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // Detail modal
  detailModal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  detailHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  detailIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  detailAmount: {
    fontSize: 28,
    fontWeight: "800",
  },
  detailRows: {
    gap: 14,
    marginBottom: 28,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  detailBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  editBtn: {
    backgroundColor: "#111318",
  },
  deleteBtn: {
    backgroundColor: "#D94141",
  },
  detailBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  closeBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
