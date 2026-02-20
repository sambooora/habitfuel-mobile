import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function FinanceScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const stats = [
    {
      label: 'Income',
      amount: '$4,250',
      change: '+12% vs last week',
      icon: 'north-east',
      active: true,
    },
    {
      label: 'Expense',
      amount: '$1,890',
      change: '-5% vs last week',
      icon: 'south-east',
      active: false,
    },
  ];

  const chart = [
    { day: 'M', in: 52, out: 32 },
    { day: 'T', in: 36, out: 24 },
    { day: 'W', in: 64, out: 38 },
    { day: 'T', in: 44, out: 28 },
    { day: 'F', in: 58, out: 34 },
    { day: 'S', in: 28, out: 18 },
    { day: 'S', in: 40, out: 26 },
  ];

  const transactions = [
    { title: 'Grocery Store', time: 'Today, 10:24 AM', amount: '-$84.50', icon: 'shopping-bag' },
    { title: 'Freelance Project', time: 'Yesterday, 4:00 PM', amount: '+$450.00', icon: 'work' },
    { title: 'Morning Coffee', time: 'Yesterday, 8:15 AM', amount: '-$5.25', icon: 'local-cafe' },
    { title: 'Gym Membership', time: 'Oct 23, 2023', amount: '-$45.00', icon: 'fitness-center' },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container} lightColor="#F6F6F6" darkColor="#0E0F10">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.headerLabel} lightColor="#8F98A1" darkColor="#8F98A1">
                FINANCE
              </ThemedText>
              <ThemedText style={styles.headerTitle} lightColor="#14171B" darkColor="#F2F3F5">
                Statistics
              </ThemedText>
            </View>
            <View style={styles.headerAction}>
              <MaterialIcons name="tune" size={18} color="#111318" />
            </View>
          </View>

          <View style={styles.statRow}>
            {stats.map((stat) => (
              <View
                key={stat.label}
                style={[
                  styles.statCard,
                  stat.active ? styles.statCardActive : null,
                  isDarkMode ? styles.cardDark : null,
                ]}>
                <View style={styles.statIcon}>
                  <MaterialIcons name={stat.icon as any} size={18} color="#111318" />
                </View>
                <ThemedText
                  style={styles.statLabel}
                  lightColor={stat.active ? '#111318' : '#8F98A1'}
                  darkColor={stat.active ? '#111318' : '#AAB1B8'}>
                  {stat.label}
                </ThemedText>
                <ThemedText style={styles.statAmount} lightColor="#111318" darkColor="#F2F3F5">
                  {stat.amount}
                </ThemedText>
                <ThemedText
                  style={styles.statChange}
                  lightColor={stat.active ? '#111318' : '#8F98A1'}
                  darkColor={stat.active ? '#111318' : '#AAB1B8'}>
                  {stat.change}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle} lightColor="#14171B" darkColor="#F2F3F5">
              Overview
            </ThemedText>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#111318' }]} />
                <ThemedText style={styles.legendText} lightColor="#8F98A1" darkColor="#AAB1B8">
                  In
                </ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#C8CDD3' }]} />
                <ThemedText style={styles.legendText} lightColor="#8F98A1" darkColor="#AAB1B8">
                  Out
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.chart, isDarkMode ? styles.cardDark : null]}>
            {chart.map((entry) => (
              <View key={entry.day} style={styles.chartColumn}>
                <View style={styles.chartBars}>
                  <View style={[styles.chartBar, { height: entry.in }]} />
                  <View style={[styles.chartBarMuted, { height: entry.out }]} />
                </View>
                <ThemedText style={styles.chartLabel} lightColor="#8F98A1" darkColor="#AAB1B8">
                  {entry.day}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle} lightColor="#14171B" darkColor="#F2F3F5">
              Recent Transactions
            </ThemedText>
            <ThemedText style={styles.sectionLink} lightColor="#8F98A1" darkColor="#AAB1B8">
              View All
            </ThemedText>
          </View>

          <View style={styles.transactionList}>
            {transactions.map((item) => (
              <View
                key={item.title}
                style={[styles.transactionRow, isDarkMode ? styles.cardDark : null]}>
                <View style={styles.transactionIcon}>
                  <MaterialIcons name={item.icon as any} size={18} color="#111318" />
                </View>
                <View style={styles.transactionInfo}>
                  <ThemedText
                    style={styles.transactionTitle}
                    lightColor="#14171B"
                    darkColor="#F2F3F5">
                    {item.title}
                  </ThemedText>
                  <ThemedText
                    style={styles.transactionTime}
                    lightColor="#8F98A1"
                    darkColor="#AAB1B8">
                    {item.time}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[
                    styles.transactionAmount,
                    item.amount.startsWith('+') ? styles.amountPositive : null,
                  ]}
                  lightColor="#111318"
                  darkColor="#F2F3F5">
                  {item.amount}
                </ThemedText>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.fab}>
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
        </View>
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
    paddingBottom: 120,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  statCardActive: {
    backgroundColor: '#F8F9FB',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#EEF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  statChange: {
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLink: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  chartColumn: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 80,
  },
  chartBar: {
    width: 6,
    borderRadius: 99,
    backgroundColor: '#111318',
  },
  chartBarMuted: {
    width: 6,
    borderRadius: 99,
    backgroundColor: '#CDD2D8',
  },
  chartLabel: {
    fontSize: 12,
  },
  transactionList: {
    gap: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardDark: {
    backgroundColor: '#14171B',
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F0F2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionTime: {
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountPositive: {
    color: '#0A8F5A',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111318',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
