import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { RankingSwingItem } from "@/services/swingVideoService";
import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type WeeklyRankingListCardProps = {
  items: RankingSwingItem[];
  onPressItem?: (swingId: string) => void;
};

export default function WeeklyRankingListCard({ items, onPressItem }: WeeklyRankingListCardProps) {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.headingRow}>
        <View>
          <Text type="barlowLight" style={styles.headingKicker}>
            스윙별 주인공
          </Text>
          <Text type="barlowHard" style={styles.headingTitle}>
            각 스타일의 최고 스윙
          </Text>
        </View>
      </View>

      <View style={styles.container}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Pressable
              key={`${item.id}-${item.metricLabel}`}
              style={[styles.row, !isLast && styles.rowDivider]}
              onPress={() => onPressItem?.(item.id)}
            >
              <View style={styles.thumb}>
                {item.thumbnailUrl ? (
                  <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
                ) : (
                  <Text type="barlowHard" style={styles.playIcon}>
                    ▶
                  </Text>
                )}
              </View>

              <View style={styles.mainTextWrap}>
                <Text type="barlowHard" style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text type="barlowLight" style={styles.rowMeta} numberOfLines={1}>
                  {item.userName} 님 · {item.userLocation}
                </Text>
              </View>

              <View style={styles.scoreWrap}>
                <Text type="barlowHard" style={styles.scoreText}>
                  {item.metricScore}점
                </Text>
                <Text type="barlowLight" style={styles.scoreLabel}>
                  {item.metricLabel}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginTop: moderateScale(12),
    gap: moderateScale(10),
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(2),
  },
  headingKicker: {
    color: "#00EEB7",
    fontSize: moderateScale(FONT.xs),
  },
  headingTitle: {
    color: "white",
    fontSize: moderateScale(FONT.lg),
  },
  viewAllText: {
    color: "#1F7E5F",
    fontSize: moderateScale(FONT.xxs),
  },
  container: {
    borderRadius: moderateScale(30),
    borderWidth: 1,
    borderColor: "#313A37",
    backgroundColor: "#1B2120",
    overflow: "hidden",
  },
  row: {
    minHeight: moderateScale(112),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#2D3533",
  },
  thumb: {
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#39514A",
    backgroundColor: "#243732",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  playIcon: {
    color: "#F2F4F3",
    fontSize: moderateScale(18),
    marginLeft: moderateScale(2),
  },
  mainTextWrap: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  rowTitle: {
    color: "#F1F3F1",
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(8),
  },
  rowMeta: {
    color: "#98A29F",
    fontSize: moderateScale(FONT.xxs),
    fontFamily: "Pretendard-Regular",
  },
  scoreWrap: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: moderateScale(66),
  },
  scoreText: {
    color: "#16E4B0",
    fontSize: moderateScale(FONT.md),
    marginBottom: moderateScale(6),
  },
  scoreLabel: {
    color: "#98A29F",
    fontSize: moderateScale(FONT.xxxs - 1),
    fontFamily: "Pretendard-Regular",
  },
});
