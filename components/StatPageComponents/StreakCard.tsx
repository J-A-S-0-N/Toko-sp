import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import React from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const STREAK_SEGMENTS = [
  true,
  true,
  true,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  false,
];

export default function StreakCard() {
  return (
    <View style={styles.streakCard}>
      <View style={styles.streakTopRow}>
        <View>
          <Text type="barlowLight" style={styles.streakHeading}>현제 연속</Text>
          <Text type="barlowHard" style={[styles.streakValue, styles.currentStreakValue]}>
            3
          </Text>
        </View>

        <View style={styles.streakRightBlock}>
          <Text type="barlowLight" style={styles.streakHeading}>최고 기록</Text>
          <Text type="barlowHard" style={styles.streakValue}>
            6
          </Text>
        </View>
      </View>

      <View style={styles.segmentRow}>
        {STREAK_SEGMENTS.map((isActive, index) => (
          <View
            key={`segment-${index}`}
            style={[styles.segmentPill, isActive ? styles.segmentPillActive : styles.segmentPillInactive]}
          />
        ))}
      </View>

      <Text style={styles.lastRoundsText}>지난 12 라운드</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  streakCard: {
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#2B3230",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  streakTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  streakRightBlock: {
    alignItems: "flex-end",
  },
  streakHeading: {
    color: "#ffffff",
    fontSize: moderateScale(FONT.sm),
    letterSpacing: 1.6,
  },
  streakValue: {
    color: "#45D07F",
    fontSize: moderateScale(FONT.h1),
    marginTop: moderateScale(10),
  },
  currentStreakValue: {
    color: "#FF4F5F",
  },
  streakSubText: {
    color: "#8A9491",
    fontSize: moderateScale(FONT.sm),
    marginTop: moderateScale(8),
  },
  segmentRow: {
    marginTop: moderateScale(18),
    flexDirection: "row",
    gap: moderateScale(5),
  },
  segmentPill: {
    flex: 1,
    height: moderateScale(8),
    borderRadius: 999,
  },
  segmentPillActive: {
    backgroundColor: "#4DBF92",
  },
  segmentPillInactive: {
    backgroundColor: "#313735",
  },
  lastRoundsText: {
    color: "#7A8482",
    fontSize: moderateScale(FONT.xs),
    marginTop: moderateScale(5),
  },
});
