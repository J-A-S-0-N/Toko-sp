import FirstRankingUserCard from "@/components/HomeFeedComponents/FirstRankingUserCard";
import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type SwingAnalyzerHeroProps = {
  onPress?: () => void;
};

export default function SwingAnalyzerHero({ onPress }: SwingAnalyzerHeroProps) {
  return (
    <View style={styles.stack}>
      <FirstRankingUserCard onPress={onPress} />

      <LinearGradient
        colors={["#03251D", "#032016", "#071814"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.legacyContainer}
      >
        <View style={styles.legacyGlowOne} />
        <View style={styles.legacyGlowTwo} />

        <View style={styles.legacyBadge}>
          <View style={styles.legacyBadgeDot} />
          <Text type="barlowHard" style={styles.legacyBadgeText}>
            AI 분석 준비 완료
          </Text>
        </View>

        <Text type="barlowHard" style={styles.legacyTitle}>
          내 스윙을 찍으면{"\n"}AI가 바로 분석해드려요
        </Text>

        <Text type="barlowLight" style={styles.legacySubtitle}>
          자세, 템포, 밸런스를 점수로 확인하고 가장 먼저 고칠 한 가지를 알려드립니다.
        </Text>

        <Pressable style={styles.legacyCtaButton} onPress={onPress}>
          <Text type="barlowHard" style={styles.legacyCtaText}>
            스윙 분석 시작하기
          </Text>
          <Feather name="arrow-right" size={moderateScale(18)} color="#02130F" />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: moderateScale(12),
  },
  legacyContainer: {
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#135243",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    overflow: "hidden",
    backgroundColor: "#06211A",
  },
  legacyGlowOne: {
    position: "absolute",
    right: moderateScale(-90),
    bottom: moderateScale(-120),
    width: moderateScale(280),
    height: moderateScale(280),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "rgba(19,217,160,0.2)",
  },
  legacyGlowTwo: {
    position: "absolute",
    right: moderateScale(-20),
    bottom: moderateScale(-70),
    width: moderateScale(190),
    height: moderateScale(190),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "rgba(19,217,160,0.2)",
  },
  legacyBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "#18846D",
    backgroundColor: "rgba(4,49,39,0.76)",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    marginBottom: moderateScale(12),
    gap: moderateScale(7),
  },
  legacyBadgeDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(10),
    backgroundColor: "#8CF4D3",
  },
  legacyBadgeText: {
    color: "#9BF6D7",
    fontSize: moderateScale(FONT.xxs),
  },
  legacyTitle: {
    color: "#F1F8F4",
    fontSize: moderateScale(FONT.xl),
    lineHeight: moderateScale(34),
  },
  legacySubtitle: {
    marginTop: moderateScale(6),
    marginBottom: moderateScale(12),
    color: "#AABBB6",
    fontSize: moderateScale(FONT.xxs),
    lineHeight: moderateScale(22),
    fontFamily: "Pretendard-Regular",
  },
  legacyCtaButton: {
    minHeight: moderateScale(50),
    borderRadius: moderateScale(16),
    backgroundColor: "#12E2A0",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: moderateScale(8),
  },
  legacyCtaText: {
    color: "#02130F",
    fontSize: moderateScale(FONT.sm),
  },
});
