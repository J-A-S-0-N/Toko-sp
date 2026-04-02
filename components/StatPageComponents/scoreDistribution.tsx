import { ThemedText as Text } from "@/components/themed-text";
import React from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type DistributionItem = {
  label: string;
  count: number;
  barColor: string;
};

type ScoreDistributionProps = {
  title?: string;
  items?: DistributionItem[];
};

const DEFAULT_ITEMS: DistributionItem[] = [
  { label: "<75", count: 1, barColor: "#4B5452" },
  { label: "75-79", count: 4, barColor: "#44BE74" },
  { label: "80-84", count: 11, barColor: "#54B387" },
  { label: "85-89", count: 6, barColor: "#4A5050" },
  { label: "90+", count: 2, barColor: "#404746" },
];

const MAX_BAR_HEIGHT = moderateScale(78);
const MIN_BAR_HEIGHT = moderateScale(10);

export default function ScoreDistribution({
  title = "스코어 분포",
  items = DEFAULT_ITEMS,
}: ScoreDistributionProps) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <View style={styles.wrapper}>
      <Text type="barlowLight" style={styles.sectionTitle}>
        {title}
      </Text>

      <View style={styles.card}>
        <View style={styles.chartRow}>
          {items.map((item) => {
            const normalizedHeight = (item.count / maxCount) * MAX_BAR_HEIGHT;
            const barHeight = Math.max(MIN_BAR_HEIGHT, normalizedHeight);

            return (
              <View key={item.label} style={styles.column}>
                <Text type="barlowHard" style={styles.scoreValue}>
                  {item.count}
                </Text>
                <View style={[styles.bar, { height: barHeight, backgroundColor: item.barColor }]} />
                <Text type="barlowLight" style={styles.labelText}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  sectionTitle: {
    color: "#6F7775",
    fontSize: moderateScale(17),
    letterSpacing: 1,
    marginBottom: moderateScale(12),
  },
  card: {
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#2B3230",
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(14),
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: moderateScale(8),
  },
  column: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  scoreValue: {
    color: "#ffffff",
    fontSize: moderateScale(28),
    marginBottom: moderateScale(8),
  },
  bar: {
    width: "100%",
    borderRadius: moderateScale(8),
    minHeight: MIN_BAR_HEIGHT,
  },
  labelText: {
    color: "#6E7775",
    fontSize: moderateScale(15),
    marginTop: moderateScale(10),
  },
});
