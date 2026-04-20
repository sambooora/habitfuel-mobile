// @ts-nocheck
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useMemo, useState } from "react";
import { Button, Sheet, Text, XStack, YStack } from "tamagui";

import { Brand, Palette } from "@/constants/theme";
import { useAccentColor } from "@/hooks/use-accent-color";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDisplayDate(date: Date | null): string {
  if (!date) return "";
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  isDarkMode?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  isDarkMode = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const t = isDarkMode ? Palette.dark : Palette.light;
  const { accentColor } = useAccentColor();

  const today = useMemo(() => new Date(), []);
  const initialDate = value ?? today;

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const handleOpen = useCallback(() => {
    const d = value ?? new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(true);
  }, [value]);

  const handlePrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleSelectDay = useCallback(
    (day: number) => {
      const selected = new Date(viewYear, viewMonth, day);
      onChange(selected);
      setOpen(false);
    },
    [viewYear, viewMonth, onChange],
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setOpen(false);
  }, [onChange]);

  const handleToday = useCallback(() => {
    const now = new Date();
    onChange(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setOpen(false);
  }, [onChange]);

  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [viewYear, viewMonth]);

  return (
    <>
      {/* Trigger Button */}
      <Button
        onPress={handleOpen}
        borderRadius={14}
        height={48}
        marginBottom="$4"
        backgroundColor={t.inputBg}
        borderWidth={1}
        borderColor={t.border}
        justifyContent="space-between"
        paddingHorizontal="$4"
        pressStyle={{ opacity: 0.8 }}
      >
        <XStack
          flex={1}
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <Text fontSize={15} color={value ? t.textPrimary : t.textSubtle}>
            {value ? formatDisplayDate(value) : placeholder}
          </Text>
          <MaterialIcons name="calendar-today" size={18} color={t.textSubtle} />
        </XStack>
      </Button>

      {/* Calendar Sheet */}
      <Sheet
        open={open}
        onOpenChange={setOpen}
        dismissOnSnapToBottom
        snapPointsMode="fit"
        modal
        animation="medium"
        zIndex={200_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Handle />
        <Sheet.Frame
          borderTopLeftRadius={28}
          borderTopRightRadius={28}
          paddingHorizontal="$5"
          paddingTop="$4"
          paddingBottom="$6"
        >
          <YStack gap="$3">
            {/* Header with month/year navigation */}
            <XStack alignItems="center" justifyContent="space-between">
              <Button
                size="$3"
                circular
                chromeless
                onPress={handlePrevMonth}
                pressStyle={{ opacity: 0.6 }}
              >
                <MaterialIcons
                  name="chevron-left"
                  size={24}
                  color={t.textPrimary}
                />
              </Button>
              <Text fontSize={17} fontWeight="700" color="$color">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <Button
                size="$3"
                circular
                chromeless
                onPress={handleNextMonth}
                pressStyle={{ opacity: 0.6 }}
              >
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={t.textPrimary}
                />
              </Button>
            </XStack>

            {/* Day of week headers */}
            <XStack justifyContent="space-around">
              {DAYS_OF_WEEK.map((day) => (
                <YStack
                  key={day}
                  width={40}
                  height={32}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    fontSize={12}
                    fontWeight="600"
                    color={t.textSubtle}
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    {day}
                  </Text>
                </YStack>
              ))}
            </XStack>

            {/* Calendar grid */}
            <YStack gap="$1">
              {calendarGrid.map((week, weekIndex) => (
                <XStack key={weekIndex} justifyContent="space-around">
                  {week.map((day, dayIndex) => {
                    if (day === null) {
                      return (
                        <YStack
                          key={`empty-${dayIndex}`}
                          width={40}
                          height={40}
                        />
                      );
                    }

                    const cellDate = new Date(viewYear, viewMonth, day);
                    const isSelected = value
                      ? isSameDay(cellDate, value)
                      : false;
                    const isToday = isSameDay(cellDate, today);

                    return (
                      <Button
                        key={day}
                        width={40}
                        height={40}
                        borderRadius={20}
                        chromeless={!isSelected}
                        backgroundColor={
                          isSelected
                            ? accentColor
                            : isToday
                              ? t.chipBg
                              : "transparent"
                        }
                        onPress={() => handleSelectDay(day)}
                        pressStyle={{ opacity: 0.7 }}
                        padding={0}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text
                          fontSize={15}
                          fontWeight={isSelected || isToday ? "700" : "400"}
                          color={
                            isSelected
                              ? "#FFFFFF"
                              : isToday
                                ? accentColor
                                : "$color"
                          }
                        >
                          {day}
                        </Text>
                      </Button>
                    );
                  })}
                </XStack>
              ))}
            </YStack>

            {/* Action buttons */}
            <XStack gap="$3" justifyContent="center" marginTop="$2">
              <Button
                flex={1}
                size="$4"
                borderRadius={14}
                chromeless
                borderWidth={1}
                borderColor={t.border}
                onPress={handleClear}
                pressStyle={{ opacity: 0.7 }}
              >
                <Text fontSize={14} fontWeight="600" color="$color">
                  Clear
                </Text>
              </Button>
              <Button
                flex={1}
                size="$4"
                borderRadius={14}
                backgroundColor={accentColor}
                onPress={handleToday}
                pressStyle={{ opacity: 0.7 }}
              >
                <Text fontSize={14} fontWeight="600" color="#FFFFFF">
                  Today
                </Text>
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
}

export { formatDisplayDate };
