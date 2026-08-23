import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

import type { LatestSwingCoachData } from "@/services/swingVideoService";

type AiCoachCardProps = {
  coach: LatestSwingCoachData | null;
};

export default function AiCoachCard({ coach }: AiCoachCardProps) {
  if (!coach) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text type="barlowHard" style={styles.kicker}>
          AI COACH
        </Text>
        <Text type="barlowLight" style={styles.headerMeta}>
          다음 스윙에서
        </Text>
      </View>

      <Text type="barlowHard" style={styles.title}>
        {coach.title}
      </Text>
      <Text type="barlowLight" style={styles.description}>
        {coach.reason}
      </Text>

      <View style={styles.cueCard}>
        <View style={styles.cueHeaderRow}>
          <Feather name="arrow-up-right" size={moderateScale(20)} color="#73FFD4" />
          <Text type="barlowHard" style={styles.cueLabel}>
            오늘의 한 가지 큐
          </Text>
        </View>
        <Text type="barlowLight" style={styles.cueText}>
          {coach.oneLineCue}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(30),
    borderWidth: 1,
    borderColor: "#2A4A3E",
    backgroundColor: "#0F1B17",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(6),
  },
  kicker: {
    color: "#70FFD6",
    fontSize: moderateScale(FONT.xs),
    letterSpacing: moderateScale(1),
  },
  headerMeta: {
    color: "#8C9A95",
    fontSize: moderateScale(FONT.xxs),
    fontFamily: "Pretendard-Regular",
  },
  title: {
    color: "#F1F5F3",
    fontSize: moderateScale(FONT.lg + 1),
    lineHeight: moderateScale(31),
    marginBottom: moderateScale(8),
  },
  description: {
    color: "#B7C4BF",
    fontSize: moderateScale(FONT.xs),
    lineHeight: moderateScale(24),
    fontFamily: "Pretendard-Regular",
    marginBottom: moderateScale(12),
  },
  cueCard: {
    borderRadius: moderateScale(20),
    backgroundColor: "#20302B",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
  },
  cueHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(6),
  },
  cueLabel: {
    color: "#EFF6F2",
    fontSize: moderateScale(FONT.sm),
  },
  cueText: {
    color: "#C1CBC6",
    fontSize: moderateScale(FONT.xs),
    lineHeight: moderateScale(22),
    fontFamily: "Pretendard-Regular",
  },
});
