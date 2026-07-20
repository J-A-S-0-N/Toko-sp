import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type FirstRankingUserCardProps = {
  onPress?: () => void;
};

export default function FirstRankingUserCard({ onPress }: FirstRankingUserCardProps) {
  return (
    <LinearGradient
      colors={["#242113", "#1C1D1A", "#161D1A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View style={styles.rankSection}>
          <View style={styles.crownBadge}>
            <Text style={styles.crownText}>👑</Text>
          </View>
          <View>
            <Text type="barlowHard" style={styles.rankLabel}>
              현재 1위
            </Text>
            <Text type="barlowHard" style={styles.title}>
              이번 주 최고 스윙
            </Text>
          </View>
        </View>

        <View style={styles.scoreBadge}>
          <Text type="barlowHard" style={styles.scoreBadgeText}>
            92점
          </Text>
        </View>
      </View>

      <View style={styles.mediaPlaceholder}>
        <View style={styles.mediaShine} />
        <View style={styles.mediaLabel}>
          <View style={styles.mediaLabelDot} />
          <Text type="barlowHard" style={styles.mediaLabelText}>
            AI 자세교정표시
          </Text>
        </View>
      </View>

      <View style={styles.profileRow}>
        <View style={styles.avatarCircle}>
          <Text type="barlowHard" style={styles.avatarText}>
            김
          </Text>
        </View>

        <View style={styles.profileTextWrap}>
          <Text type="barlowHard" style={styles.nameText}>
            김성호
          </Text>
          <Text type="barlowLight" style={styles.metaText}>
            경기 평택 · 구력 5년
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text type="barlowLight" style={styles.metricLabel}>
            자세
          </Text>
          <Text type="barlowHard" style={styles.metricValue}>
            94
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text type="barlowLight" style={styles.metricLabel}>
            템포
          </Text>
          <Text type="barlowHard" style={styles.metricValue}>
            91
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text type="barlowLight" style={styles.metricLabel}>
            밸런스
          </Text>
          <Text type="barlowHard" style={styles.metricValue}>
            93
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text type="barlowLight" style={styles.metricLabel}>
            피니시
          </Text>
          <Text type="barlowHard" style={styles.metricValue}>
            90
          </Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <Text type="barlowHard" style={styles.summaryLabel}>
          AI 분석 요약
        </Text>
        <Text type="barlowLight" style={styles.summaryText}>
          백스윙과 다운스윙의 속도 차이가 안정적이며, 임팩트 이후 피니시 자세까지 중심이 잘 유지됩니다.
        </Text>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(34),
    borderWidth: 1,
    borderColor: "#6D642A",
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(12),
    overflow: "hidden",
    backgroundColor: "#1E1F1C",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(10),
  },
  rankSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    flexShrink: 1,
  },
  crownBadge: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(14),
    backgroundColor: "#3D3518",
    alignItems: "center",
    justifyContent: "center",
  },
  crownText: {
    fontSize: moderateScale(20),
  },
  rankLabel: {
    color: "#F2C33D",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(2),
  },
  title: {
    color: "#F4F4F1",
    fontSize: moderateScale(FONT.xs),
  },
  scoreBadge: {
    minWidth: moderateScale(66),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#7B6D2B",
    backgroundColor: "rgba(43, 40, 23, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadgeText: {
    color: "#FFD247",
    fontSize: moderateScale(FONT.xs),
  },
  mediaPlaceholder: {
    height: moderateScale(155),
    borderRadius: moderateScale(26),
    borderWidth: 1,
    borderColor: "rgba(94, 109, 96, 0.72)",
    backgroundColor: "#1D2622",
    marginBottom: moderateScale(14),
    overflow: "hidden",
  },
  mediaShine: {
    position: "absolute",
    top: moderateScale(-30),
    left: moderateScale(-40),
    width: "120%",
    height: moderateScale(90),
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ rotate: "-22deg" }],
  },
  mediaLabel: {
    position: "absolute",
    top: moderateScale(12),
    left: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "rgba(223, 231, 226, 0.24)",
    backgroundColor: "rgba(30, 33, 31, 0.7)",
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(6),
    gap: moderateScale(5),
  },
  mediaLabelDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(10),
    backgroundColor: "#E9EEEC",
  },
  mediaLabelText: {
    color: "#EBF0EE",
    fontSize: moderateScale(FONT.xxs),
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  avatarCircle: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(32),
    borderWidth: 2,
    borderColor: "#F2C339",
    backgroundColor: "#86A9AD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(10),
  },
  avatarText: {
    color: "#163437",
    fontSize: moderateScale(20),
    //lineHeight: moderateScale(26),
  },
  profileTextWrap: {
    flex: 1,
  },
  nameText: {
    color: "#F5F6F4",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(28),
    marginBottom: moderateScale(2),
  },
  metaText: {
    color: "#A1AAA7",
    fontSize: moderateScale(FONT.xxxs),
  },
  followButton: {
    height: moderateScale(42),
    minWidth: moderateScale(86),
    borderRadius: moderateScale(21),
    borderWidth: 1,
    borderColor: "#00E3A8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(14),
  },
  followButtonText: {
    color: "#00E3A8",
    fontSize: moderateScale(FONT.xs),
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: moderateScale(7),
    marginBottom: moderateScale(12),
  },
  metricCard: {
    flex: 1,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "rgba(100, 112, 106, 0.4)",
    backgroundColor: "rgba(34, 38, 35, 0.62)",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    minHeight: moderateScale(72),
    justifyContent: "space-between",
  },
  metricLabel: {
    color: "#858F8B",
    fontSize: moderateScale(FONT.xxxs),
  },
  metricValue: {
    color: "#F1F4F2",
    fontSize: moderateScale(24),
    lineHeight: moderateScale(28),
  },
  summaryBox: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "rgba(68, 98, 84, 0.65)",
    backgroundColor: "#12271F",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginBottom: moderateScale(12),
  },
  summaryLabel: {
    color: "#00D79C",
    fontSize: moderateScale(FONT.xs),
    marginBottom: moderateScale(8),
  },
  summaryText: {
    color: "#DCE5E2",
    fontSize: moderateScale(FONT.xxs),
    lineHeight: moderateScale(21),
  },
  ctaButton: {
    minHeight: moderateScale(46),
    borderRadius: moderateScale(14),
    backgroundColor: "#12E2A0",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: moderateScale(7),
  },
  ctaText: {
    color: "#02130F",
    fontSize: moderateScale(FONT.xxs),
  },
});
