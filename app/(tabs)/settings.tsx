import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeSetting } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const [nickname, setNickname] = useState('Alex');
  const { schemeSetting, setSchemeSetting, colorScheme } = useThemeSetting();
  const isDark = schemeSetting === 'dark';
  const isLight = schemeSetting === 'light';
  const isDarkMode = colorScheme === 'dark';

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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container} lightColor="#F6F6F6" darkColor="#0E0F10">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText style={styles.headerLabel} lightColor="#8F98A1" darkColor="#8F98A1">
              SETTINGS
            </ThemedText>
            <ThemedText style={styles.headerTitle} lightColor="#14171B" darkColor="#F2F3F5">
              Preferensi
            </ThemedText>
          </View>

          <View style={[styles.card, isDarkMode ? styles.cardDark : null]}>
            <ThemedText style={styles.cardLabel} lightColor="#8F98A1" darkColor="#AAB1B8">
              Nama Panggilan
            </ThemedText>
            <TextInput
              value={nickname}
              onChangeText={(value) => {
                setNickname(value);
                AsyncStorage.setItem('nickname', value);
              }}
              placeholder="Masukkan nama panggilan"
              placeholderTextColor="#A0A6AD"
              style={[styles.input, isDarkMode ? styles.inputDark : null]}
            />
            <ThemedText style={styles.helperText} lightColor="#8F98A1" darkColor="#AAB1B8">
              Nama ini akan tampil di halaman beranda.
            </ThemedText>
          </View>

          <View style={[styles.card, isDarkMode ? styles.cardDark : null]}>
            <View style={styles.row}>
              <View>
                <ThemedText style={styles.cardTitle} lightColor="#14171B" darkColor="#F2F3F5">
                  Tema Gelap
                </ThemedText>
                <ThemedText style={styles.cardSubtitle} lightColor="#8F98A1" darkColor="#AAB1B8">
                  Pilih mode gelap atau terang
                </ThemedText>
              </View>
            </View>
            <View style={styles.themeRow}>
              <Pressable
                onPress={() => setSchemeSetting('light')}
                style={[
                  styles.themeChip,
                  isLight ? styles.themeChipActive : null,
                  isDarkMode ? styles.themeChipDark : null,
                ]}>
                <ThemedText
                  style={styles.themeChipText}
                  lightColor={isLight ? '#FFFFFF' : '#8F98A1'}
                  darkColor={isLight ? '#FFFFFF' : '#AAB1B8'}>
                  Light
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setSchemeSetting('dark')}
                style={[
                  styles.themeChip,
                  isDark ? styles.themeChipActive : null,
                  isDarkMode ? styles.themeChipDark : null,
                ]}>
                <ThemedText
                  style={styles.themeChipText}
                  lightColor={isDark ? '#FFFFFF' : '#8F98A1'}
                  darkColor={isDark ? '#FFFFFF' : '#AAB1B8'}>
                  Dark
                </ThemedText>
              </Pressable>
            </View>
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
    gap: 4,
  },
  headerLabel: {
    fontSize: 12,
    letterSpacing: 1.4,
    fontFamily: Fonts.rounded,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: Fonts.rounded,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: '#F0F2F4',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#14171B',
  },
  inputDark: {
    backgroundColor: '#1B1E22',
    color: '#F2F3F5',
  },
  helperText: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F0F2F4',
  },
  themeChipActive: {
    backgroundColor: '#111318',
  },
  themeChipDark: {
    backgroundColor: '#1B1E22',
  },
  themeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDark: {
    backgroundColor: '#14171B',
  },
});
