import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabTwoScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const tabs = [
    { label: 'To Do', count: 4, active: true },
    { label: 'In Progress', count: 2, active: false },
    { label: 'Done', count: 1, active: false },
  ];

  const tasks = [
    {
      tag: 'Urgent',
      title: 'Design System Update',
      description: 'Revise color tokens and typography scale.',
      progress: '0/4',
      action: 'Start',
    },
    {
      tag: 'Development',
      title: 'Refactor API Endpoints',
      description: 'Optimize user data fetching logic.',
      progress: '1/4',
      action: 'Continue',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container} lightColor="#F6F6F6" darkColor="#0E0F10">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.headerLabel} lightColor="#8F98A1" darkColor="#8F98A1">
                PRODUCTIVITY
              </ThemedText>
              <ThemedText style={styles.headerTitle} lightColor="#14171B" darkColor="#F2F3F5">
                My Tasks
              </ThemedText>
            </View>
            <View style={styles.headerAction}>
              <MaterialIcons name="add" size={20} color="#111318" />
            </View>
          </View>

          <View style={styles.search}>
            <MaterialIcons name="search" size={18} color="#8F98A1" />
            <ThemedText style={styles.searchText} lightColor="#8F98A1" darkColor="#8F98A1">
              Search tasks...
            </ThemedText>
          </View>

          <View style={styles.tabRow}>
            {tabs.map((tab) => (
              <View key={tab.label} style={[styles.tab, tab.active ? styles.tabActive : null]}>
                <ThemedText
                  style={[styles.tabText, tab.active ? styles.tabTextActive : null]}
                  lightColor={tab.active ? '#FFFFFF' : '#8F98A1'}
                  darkColor={tab.active ? '#FFFFFF' : '#8F98A1'}>
                  {tab.label}
                </ThemedText>
                <View style={[styles.tabBadge, tab.active ? styles.tabBadgeActive : null]}>
                  <ThemedText
                    style={[styles.tabBadgeText, tab.active ? styles.tabBadgeTextActive : null]}
                    lightColor={tab.active ? '#111318' : '#8F98A1'}
                    darkColor={tab.active ? '#111318' : '#8F98A1'}>
                    {tab.count}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <ThemedText style={styles.sectionLabel} lightColor="#8F98A1" darkColor="#8F98A1">
            Today
          </ThemedText>

          <View style={styles.taskList}>
            {tasks.map((task) => (
              <View key={task.title} style={[styles.taskCard, isDarkMode ? styles.cardDark : null]}>
                <View style={styles.taskTag}>
                  <ThemedText style={styles.taskTagText} lightColor="#111318" darkColor="#111318">
                    {task.tag}
                  </ThemedText>
                </View>
                <ThemedText style={styles.taskTitle} lightColor="#111318" darkColor="#F2F3F5">
                  {task.title}
                </ThemedText>
                <ThemedText style={styles.taskDescription} lightColor="#8F98A1" darkColor="#AAB1B8">
                  {task.description}
                </ThemedText>
                <View style={styles.taskFooter}>
                  <View style={styles.taskProgress}>
                    <MaterialIcons name="check-circle" size={16} color="#111318" />
                    <ThemedText style={styles.taskProgressText} lightColor="#111318" darkColor="#F2F3F5">
                      {task.progress}
                    </ThemedText>
                  </View>
                  <View style={styles.taskAction}>
                    <ThemedText style={styles.taskActionText} lightColor="#FFFFFF" darkColor="#FFFFFF">
                      {task.action}
                    </ThemedText>
                  </View>
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
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  searchText: {
    fontSize: 14,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  tabActive: {
    backgroundColor: '#111318',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  tabBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F4',
  },
  tabBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBadgeTextActive: {
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  taskList: {
    gap: 14,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  cardDark: {
    backgroundColor: '#14171B',
  },
  taskTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F2F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  taskTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  taskDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  taskProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskProgressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskAction: {
    backgroundColor: '#111318',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  taskActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
