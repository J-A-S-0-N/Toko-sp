import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

import AnimatedNumber from "../AnimatedNumber";

type RecentSwingSnapshotData = {
  score: number;
  points: number;
  label: string;
  subtitle: string;
};

type RecentSwingSnapshotCardProps = {
  onPressHistory?: () => void;
  snapshot?: RecentSwingSnapshotData | null;
};

export default function RecentSwingSnapshotCard({
  onPressHistory,
  snapshot,
}: RecentSwingSnapshotCardProps) {
  const scoreValue = snapshot?.score ?? 78;
  const labelValue = snapshot?.label ?? "안정적인 리듬형";
  const subtitleValue = snapshot?.subtitle ?? "밸런스가 가장 좋아요 · 7월 16일";
  const pointsValue = snapshot?.points ?? 6;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text type="barlowHard" style={styles.headerTitle}>
          최근 내 스윙
        </Text>

        <Pressable onPress={onPressHistory} hitSlop={8}>
          <Text type="barlowHard" style={styles.headerAction}>
            전체 기록 →
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.scoreRingWrap}>
          <View style={styles.scoreRingOuter}>
            <View style={styles.scoreRingInner}>
              <AnimatedNumber
                value={scoreValue}
                trigger={scoreValue}
                duration={600}
                style={styles.scoreText}
              />
            </View>
          </View>
        </View>

        <View style={styles.bodyTextWrap}>
          <Text type="barlowHard" style={styles.bodyTitle}>
            {labelValue}
          </Text>
          <Text type="barlowLight" style={styles.bodySubtitle}>
            {subtitleValue}
          </Text>
        </View>

        <View style={styles.deltaBadge}>
          <View style={styles.deltaBadgeTextRow}>
            <Text type="barlowLight" style={styles.deltaBadgeText}>
              +
            </Text>
            <AnimatedNumber
              value={pointsValue}
              trigger={pointsValue}
              duration={600}
              style={styles.deltaBadgeText}
            />
            <Text type="barlowLight" style={styles.deltaBadgeText}>
              점
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  headerTitle: {
    color: "#F2F6F4",
    fontSize: moderateScale(FONT.lg + 1),
  },
  headerAction: {
    color: "#11E0AE",
    fontSize: moderateScale(FONT.xs),
  },
  card: {
    borderRadius: moderateScale(28),
    borderWidth: 1,
    borderColor: "#2A3835",
    backgroundColor: "#171E1D",
    minHeight: moderateScale(128),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    flexDirection: "row",
    alignItems: "center",
  },
  scoreRingWrap: {
    marginRight: moderateScale(16),
  },
  scoreRingOuter: {
    width: moderateScale(92),
    height: moderateScale(92),
    borderRadius: moderateScale(999),
    borderWidth: moderateScale(8),
    borderColor: "#14E1AF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#20352F",
  },
  scoreRingInner: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(999),
    backgroundColor: "#171E1D",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    color: "#F2F6F4",
    fontSize: moderateScale(FONT.xl + 3),
  },
  bodyTextWrap: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  bodyTitle: {
    color: "#EDF3F0",
    fontSize: moderateScale(FONT.lg),
    marginBottom: moderateScale(6),
  },
  bodySubtitle: {
    color: "#8D9A95",
    fontSize: moderateScale(FONT.xs),
    fontFamily: "Pretendard-Regular",
  },
  deltaBadge: {
    minWidth: moderateScale(76),
    minHeight: moderateScale(52),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "#126E57",
    backgroundColor: "#0B3C31",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(14),
  },
  deltaBadgeText: {
    color: "#16E4B0",
    fontSize: moderateScale(FONT.md),
  },
  deltaBadgeTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(1),
  },
});
