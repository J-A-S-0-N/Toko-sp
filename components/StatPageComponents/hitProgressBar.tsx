import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import React from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type RoundStat = {
  label: string;
  value: number;
  max: number;
  color: string;
};

type HitProgressBarProps = {
  roundStats: RoundStat[];
  headerTitle?: string;
};

export default function HitProgressBar({ roundStats, headerTitle = "타수 통계" }: HitProgressBarProps) {
  return (
    <View style={styles.wrapper}>
      <Text type="barlowLight" style={styles.headerTitle}>
        {headerTitle}
      </Text>
      <View style={styles.card}>
      {roundStats.map((stat, index) => {
        const progress = Math.max(0, Math.min(1, stat.value / stat.max));
        const isLast = index === roundStats.length - 1;

        return (
          <View
            key={stat.label}
            style={[styles.row, !isLast && styles.rowDivider]}
          >
            <Text style={styles.metricLabel}>{stat.label}</Text>
            <View style={styles.trackWrap}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: stat.color,
                    },
                  ]}
                />
              </View>
            </View>
            <Text type="barlowHard" style={[styles.metricValue, { color: stat.color }]}>
              {stat.value.toFixed(1)}
            </Text>
          </View>
        );
      })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: moderateScale(8),
  },
  headerTitle: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.sm),
    letterSpacing: 1.2,
    marginBottom: moderateScale(0),
  },
  card: {
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#2B3230",
    overflow: "hidden",
  },
  row: {
    paddingVertical: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#2B3230",
  },
  metricLabel: {
    flex: 1.45,
    color: "#8A9290",
    fontSize: moderateScale(FONT.xs),
  },
  trackWrap: {
    flex: 1,
    paddingHorizontal: moderateScale(8),
  },
  track: {
    height: moderateScale(3),
    borderRadius: 99,
    backgroundColor: "#313735",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 99,
  },
  metricValue: {
    flex: 0.55,
    textAlign: "right",
    fontSize: moderateScale(FONT.xl),
  },
});
