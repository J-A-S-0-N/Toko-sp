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
    <>
      <Text type="barlowLight" style={styles.headerTitle}>
        {headerTitle}
      </Text>
      {roundStats.map((stat) => {
        const progress = Math.max(0, Math.min(1, stat.value / stat.max));

        return (
          <View
            key={stat.label}
            style={styles.metricCard}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>{stat.label}</Text>
              <Text type="barlowHard" style={[styles.metricValue, { color: stat.color }]}>
                {stat.value.toFixed(1)}
              </Text>
            </View>
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
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.sm),
    letterSpacing: 1.2,
    marginBottom: moderateScale(10),
  },
  metricCard: {
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#2B3230",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  metricLabel: {
    color: "#8A9290",
    fontSize: moderateScale(FONT.sm),
  },
  metricValue: {
    fontSize: moderateScale(FONT.lg),
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
});
