import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [nickname, setNickname] = useState('Alex');
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    let isActive = true;
    const loadNickname = async () => {
      const saved = await AsyncStorage.getItem('nickname');
      if (isActive && saved) {
        setNickname(saved);
      }
    };
    loadNickname();
    return () => {
      isActive = false;
    };
  }, []);

  const habits = [
    { label: 'Water', icon: 'water-drop', background: '#E8F3FF' },
    { label: 'Mind', icon: 'self-improvement', background: '#F1EDFF' },
    { label: 'Read', icon: 'menu-book', background: '#FFF1E7' },
    { label: 'Gym', icon: 'fitness-center', background: '#EAF8F1' },
  ];

  const focusTasks = [
    { title: 'Design System Audit', meta: '4 pomos', icon: 'palette' },
    { title: 'Client Report', meta: '2 pomos', icon: 'insert-drive-file' },
    { title: 'Refactor Auth', meta: '3 pomos', icon: 'lock' },
  ];

  const weekDays = [
    { label: 'Sun', date: '23', active: false },
    { label: 'Mon', date: '24', active: true },
    { label: 'Tue', date: '25', active: false },
    { label: 'Wed', date: '26', active: false },
    { label: 'Thu', date: '27', active: false },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container} lightColor="#F6F6F6" darkColor="#0E0F10">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.dateLabel} lightColor="#9AA0A6" darkColor="#9AA0A6">
                MONDAY, OCT 24
              </ThemedText>
              <ThemedText style={styles.greeting} lightColor="#121417" darkColor="#F2F3F5">
                Hello, {nickname || 'Alex'}
              </ThemedText>
            </View>
            <View style={styles.avatar} />
          </View>

          <View style={[styles.card, isDarkMode ? styles.cardDark : null]}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle} lightColor="#7E8791" darkColor="#AAB1B8">
                CONSISTENCY SCORE
              </ThemedText>
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText} lightColor="#111318" darkColor="#111318">
                  +12%
                </ThemedText>
              </View>
            </View>
            <View style={styles.scoreRow}>
              <ThemedText style={styles.scoreValue} lightColor="#111318" darkColor="#F2F3F5">
                85%
              </ThemedText>
              <View style={styles.chart}>
                <View style={[styles.chartBar, { height: 16 }]} />
                <View style={[styles.chartBar, { height: 22 }]} />
                <View style={[styles.chartBar, { height: 28 }]} />
                <View style={[styles.chartBar, { height: 20 }]} />
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <ThemedText style={styles.subtleText} lightColor="#8F98A1" darkColor="#9AA0A6">
              5-day streak. Excellent work.
            </ThemedText>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((day) => (
              <View
                key={day.label}
                style={[styles.weekDay, day.active ? styles.weekDayActive : null]}>
                <ThemedText
                  style={[styles.weekLabel, day.active ? styles.weekLabelActive : null]}
                  lightColor={day.active ? '#FFFFFF' : '#8F98A1'}
                  darkColor={day.active ? '#FFFFFF' : '#8F98A1'}>
                  {day.label}
                </ThemedText>
                <ThemedText
                  style={[styles.weekDate, day.active ? styles.weekDateActive : null]}
                  lightColor={day.active ? '#FFFFFF' : '#1C1F23'}
                  darkColor={day.active ? '#FFFFFF' : '#E4E6E8'}>
                  {day.date}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle} lightColor="#1C1F23" darkColor="#F2F3F5">
              Daily Habits
            </ThemedText>
            <ThemedText style={styles.sectionLink} lightColor="#8F98A1" darkColor="#AAB1B8">
              View All
            </ThemedText>
          </View>

          <View style={[styles.card, isDarkMode ? styles.cardDark : null]}>
            <View style={styles.habitRow}>
              {habits.map((habit) => (
                <View key={habit.label} style={styles.habitItem}>
                  <View style={[styles.habitIcon, { backgroundColor: habit.background }]}>
                    <MaterialIcons name={habit.icon as any} size={18} color="#111318" />
                  </View>
                  <ThemedText style={styles.habitLabel} lightColor="#6E7680" darkColor="#AAB1B8">
                    {habit.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle} lightColor="#1C1F23" darkColor="#F2F3F5">
              Focus Tasks
            </ThemedText>
            <View style={styles.durationBadge}>
              <ThemedText style={styles.durationText} lightColor="#1C1F23" darkColor="#1C1F23">
                2h 15m
              </ThemedText>
            </View>
          </View>

          <View style={styles.taskList}>
            {focusTasks.map((task) => (
              <View key={task.title} style={[styles.taskCard, isDarkMode ? styles.cardDark : null]}>
                <View style={styles.taskIconWrap}>
                  <MaterialIcons name={task.icon as any} size={18} color="#111318" />
                </View>
                <View style={styles.taskInfo}>
                  <ThemedText style={styles.taskTitle} lightColor="#1C1F23" darkColor="#F2F3F5">
                    {task.title}
                  </ThemedText>
                  <ThemedText style={styles.taskMeta} lightColor="#8F98A1" darkColor="#AAB1B8">
                    {task.meta}
                  </ThemedText>
                </View>
                <View style={styles.playButton}>
                  <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
                </View>
              </View>
            ))}
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
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D9DBDE',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: Fonts.rounded,
  },
  badge: {
    backgroundColor: '#EEF0F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  chartBar: {
    width: 6,
    borderRadius: 99,
    backgroundColor: '#111318',
  },
  progressTrack: {
    height: 6,
    borderRadius: 99,
    backgroundColor: '#ECEFF1',
  },
  progressFill: {
    width: '70%',
    height: 6,
    borderRadius: 99,
    backgroundColor: '#111318',
  },
  subtleText: {
    fontSize: 12,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    width: 58,
  },
  weekDayActive: {
    backgroundColor: '#111318',
  },
  weekLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  weekLabelActive: {
    fontWeight: '600',
  },
  weekDate: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  weekDateActive: {
    fontWeight: '700',
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
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',

  },
  habitItem: {
    alignItems: 'center',
    gap: 3,
  },
  habitIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitLabel: {
    fontSize: 12,
  },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF0F2',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskList: {
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardDark: {
    backgroundColor: '#14171B',
  },
  taskIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F0F2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  taskMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#111318',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
