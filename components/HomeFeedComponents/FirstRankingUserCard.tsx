import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { RankingSwingItem } from "@/services/swingVideoService";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type FirstRankingUserCardProps = {
  item: RankingSwingItem | null;
  onPress?: (swingId: string) => void;
};

export default function FirstRankingUserCard({ item, onPress }: FirstRankingUserCardProps) {
  if (!item) return null;

  return (
    <Pressable onPress={() => onPress?.(item.id)} style={styles.pressable}>
      <LinearGradient
        colors={["#222114", "#1A1E1B", "#151A18"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.topRow}>
          <View style={styles.mainBadge}>
            <Text type="barlowLight" style={styles.mainBadgeText}>
              👑 {item.periodLabel} 1위
            </Text>
          </View>
          <Text type="barlowHard" style={styles.weekText}>
            {item.periodLabel}
          </Text>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.mediaCard}>
            {item.thumbnailUrl ? (
              <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
            ) : (
              <View style={styles.mediaShine} />
            )}
          </View>

          <View style={styles.infoBlock}>
            <Text type="barlowHard" style={styles.titleText}>
              {item.title}
            </Text>
            <Text type="barlowHard" style={styles.nameText}>
              {item.userName} 님
            </Text>
            <Text type="barlowLight" style={styles.metaText}>
              {item.userLocation} · {item.metricLabel} 최고점
            </Text>
            <View style={styles.scoreWrap}>
              <Text type="barlowLight" style={styles.scoreLabel}>
                {item.metricLabel} 점수
              </Text>
              <Text type="barlowHard" style={styles.scoreValue}>
                {item.metricScore}점
              </Text>
            </View>
          </View>
        </View>

      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
  },
  container: {
    borderRadius: moderateScale(30),
    borderWidth: 1,
    borderColor: "#6B602B",
    paddingHorizontal: moderateScale(10),
    paddingTop: moderateScale(11),
    paddingBottom: moderateScale(11),
    overflow: "hidden",
    backgroundColor: "#1A1F1C",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  mainBadge: {
    borderWidth: 1,
    borderColor: "#8A7834",
    backgroundColor: "rgba(74, 62, 24, 0.45)",
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
  },
  mainBadgeText: {
    color: "#F1C84F",
    fontSize: moderateScale(FONT.xxxs),
  },
  weekText: {
    color: "#8F9892",
    fontSize: moderateScale(FONT.xs),
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  mediaCard: {
    width: moderateScale(116),
    height: moderateScale(116),
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "rgba(121, 145, 134, 0.48)",
    backgroundColor: "#264137",
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  mediaShine: {
    position: "absolute",
    top: moderateScale(-8),
    left: moderateScale(-18),
    width: moderateScale(150),
    height: moderateScale(48),
    backgroundColor: "rgba(255,255,255,0.13)",
    transform: [{ rotate: "-32deg" }],
  },
  playButton: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [
      { translateX: -moderateScale(22) },
      { translateY: -moderateScale(22) },
    ],
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(999),
    backgroundColor: "#00DFA6",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    color: "#053529",
    fontSize: moderateScale(18),
    marginLeft: moderateScale(2),
  },
  durationBadge: {
    position: "absolute",
    right: moderateScale(8),
    bottom: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: "rgba(8, 11, 10, 0.82)",
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(4),
  },
  durationText: {
    color: "#F4F6F5",
    fontSize: moderateScale(FONT.xxs),
  },
  infoBlock: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: moderateScale(116),
  },
  titleText: {
    color: "#F2F3F0",
    fontSize: moderateScale(FONT.md),
  },
  nameText: {
    color: "#ECEEEB",
    fontSize: moderateScale(FONT.sm),
  },
  metaText: {
    color: "#8F9892",
    fontSize: moderateScale(FONT.xxxs),
  },
  scoreLabel: {
    color: "#8F9892",
    fontSize: moderateScale(FONT.xxs),
  },
  scoreWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: moderateScale(8),
  },
  scoreValue: {
    color: "#FFD247",
    fontSize: moderateScale(FONT.xl),
  },
});
