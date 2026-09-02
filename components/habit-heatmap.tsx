import { StyleSheet, Text, View } from "react-native";

import type { HeatmapCell, HeatmapLevel } from "@/hooks/use-habit-storage";

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/** Opacity applied to the accent color for each intensity level. */
const LEVEL_ALPHA: Record<HeatmapLevel, number> = {
  0: 0,
  1: 0.3,
  2: 0.52,
  3: 0.76,
  4: 1,
};

function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith("#")) return color;

  let hex = color.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6) return color;

  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${hex}${a}`;
}

function chunkWeeks(cells: HeatmapCell[]): HeatmapCell[][] {
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HabitHeatmapProps {
  cells: HeatmapCell[];
  /** Base color for filled squares — intensity is applied as opacity. */
  accent: string;
  /** Color of a tracked-but-not-completed day. */
  emptyColor: string;
  /** Color for month / weekday labels. */
  labelColor: string;
  /** Outline drawn around today's square. */
  todayRingColor: string;
  /**
   * `columns` renders GitHub-style (one column per week, one row per weekday).
   * `calendar` renders one row per week, like a month view.
   */
  variant?: "columns" | "calendar";
  /**
   * Square size. Required for `columns`; on `calendar` it is optional and the
   * grid stretches to fill the available width when omitted.
   */
  cellSize?: number;
  gap?: number;
  showDayLabels?: boolean;
  showMonthLabels?: boolean;
}

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
const CALENDAR_DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_LABEL_HEIGHT = 14;
const DEFAULT_CELL_SIZE = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HabitHeatmap({
  cells,
  accent,
  emptyColor,
  labelColor,
  todayRingColor,
  variant = "columns",
  cellSize,
  gap = 3,
  showDayLabels = false,
  showMonthLabels = false,
}: HabitHeatmapProps) {
  if (cells.length === 0) return null;

  const weeks = chunkWeeks(cells);

  const cellColor = (cell: HeatmapCell): string => {
    // Days outside the habit's lifetime (and days yet to come) stay blank so
    // the grid keeps its shape without implying a missed day.
    if (!cell.inRange || cell.isFuture) return "transparent";
    if (cell.level === 0) return emptyColor;
    return withAlpha(accent, LEVEL_ALPHA[cell.level]);
  };

  if (variant === "calendar") {
    // Fixed squares stay centered; without a size the grid fills its parent.
    const fixed = cellSize !== undefined;
    const rowStyle = [
      styles.calendarRow,
      { gap },
      fixed && styles.calendarRowCentered,
    ];
    const sizing = fixed
      ? { width: cellSize, height: cellSize }
      : styles.calendarCellFlex;
    const labelSizing = fixed ? { width: cellSize } : styles.calendarCellFlex;

    return (
      <View style={{ gap }}>
        <View style={rowStyle}>
          {CALENDAR_DAY_LABELS.map((label, i) => (
            <Text
              key={i}
              style={[
                styles.calendarDayLabel,
                labelSizing,
                { color: labelColor },
              ]}
            >
              {label}
            </Text>
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={rowStyle}>
            {week.map((cell) => (
              <View
                key={cell.dateKey}
                style={[
                  styles.calendarCell,
                  sizing,
                  { backgroundColor: cellColor(cell) },
                  cell.isToday && {
                    borderWidth: 1.5,
                    borderColor: todayRingColor,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    );
  }

  const size = cellSize ?? DEFAULT_CELL_SIZE;
  const columnStride = size + gap;
  const gridWidth = weeks.length * columnStride - gap;

  // Label a column when its month differs from the last labelled one, keeping
  // enough distance between labels (and from the right edge) to avoid overlap.
  const monthLabels: { text: string; left: number }[] = [];
  if (showMonthLabels) {
    let lastMonth = -1;
    let lastLabelledColumn = -Infinity;
    weeks.forEach((week, index) => {
      const month = week[0].date.getMonth();
      if (month === lastMonth) return;
      lastMonth = month;
      if (index - lastLabelledColumn < 3) return;
      if (index > weeks.length - 2) return;
      monthLabels.push({
        text: MONTH_LABELS[month],
        left: index * columnStride,
      });
      lastLabelledColumn = index;
    });
  }

  return (
    <View style={styles.columnsRoot}>
      {showDayLabels && (
        <View
          style={[
            styles.dayLabelColumn,
            { gap, paddingTop: showMonthLabels ? MONTH_LABEL_HEIGHT : 0 },
          ]}
        >
          {DAY_LABELS.map((label, i) => (
            <View key={i} style={[styles.dayLabelSlot, { height: size }]}>
              <Text style={[styles.dayLabel, { color: labelColor }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View>
        {showMonthLabels && (
          <View style={{ height: MONTH_LABEL_HEIGHT, width: gridWidth }}>
            {monthLabels.map((label) => (
              <Text
                key={label.text + label.left}
                style={[
                  styles.monthLabel,
                  { color: labelColor, left: label.left },
                ]}
              >
                {label.text}
              </Text>
            ))}
          </View>
        )}

        <View style={[styles.grid, { gap }]}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={{ gap }}>
              {week.map((cell) => (
                <View
                  key={cell.dateKey}
                  style={[
                    styles.cell,
                    {
                      width: size,
                      height: size,
                      backgroundColor: cellColor(cell),
                    },
                    cell.isToday && {
                      borderWidth: 1,
                      borderColor: todayRingColor,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

export interface HeatmapLegendProps {
  accent: string;
  emptyColor: string;
  labelColor: string;
  cellSize?: number;
}

export function HeatmapLegend({
  accent,
  emptyColor,
  labelColor,
  cellSize = 9,
}: HeatmapLegendProps) {
  const levels: HeatmapLevel[] = [0, 1, 2, 3, 4];

  return (
    <View style={styles.legend}>
      <Text style={[styles.legendLabel, { color: labelColor }]}>Less</Text>
      {levels.map((level) => (
        <View
          key={level}
          style={[
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
              backgroundColor:
                level === 0
                  ? emptyColor
                  : withAlpha(accent, LEVEL_ALPHA[level]),
            },
          ]}
        />
      ))}
      <Text style={[styles.legendLabel, { color: labelColor }]}>More</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  columnsRoot: {
    flexDirection: "row",
  },
  grid: {
    flexDirection: "row",
  },
  cell: {
    borderRadius: 2.5,
  },

  dayLabelColumn: {
    marginRight: 6,
  },
  dayLabelSlot: {
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "600",
  },
  monthLabel: {
    position: "absolute",
    top: 0,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
  },

  calendarRow: {
    flexDirection: "row",
  },
  calendarRowCentered: {
    justifyContent: "center",
  },
  calendarCell: {
    borderRadius: 4,
  },
  calendarCellFlex: {
    flex: 1,
    aspectRatio: 1,
  },
  calendarDayLabel: {
    textAlign: "center",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
  },

  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendLabel: {
    fontSize: 9,
    fontWeight: "600",
  },
});
