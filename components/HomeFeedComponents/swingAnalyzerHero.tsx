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
    <LinearGradient
      colors={["#03251D", "#032016", "#071814"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text type="barlowHard" style={styles.badgeText}>
          AI 분석 준비 완료
        </Text>
      </View>

      <Text type="barlowHard" style={styles.title}>
        내 스윙을 찍으면{"\n"}AI가 바로 분석해드려요
      </Text>

      <Text type="barlowLight" style={styles.subtitle}>
        자세, 템포, 밸런스를 점수로 확인하고 가장 먼저 고칠 한 가지를 알려드립니다.
      </Text>

      <Pressable style={styles.ctaButton} onPress={onPress}>
        <Text type="barlowHard" style={styles.ctaText}>
          스윙 분석 시작하기
        </Text>
        <Feather name="arrow-right" size={moderateScale(18)} color="#02130F" />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#135243",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    overflow: "hidden",
    backgroundColor: "#06211A",
  },
  glowOne: {
    position: "absolute",
    right: moderateScale(-90),
    bottom: moderateScale(-120),
    width: moderateScale(280),
    height: moderateScale(280),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "rgba(19,217,160,0.2)",
  },
  glowTwo: {
    position: "absolute",
    right: moderateScale(-20),
    bottom: moderateScale(-70),
    width: moderateScale(190),
    height: moderateScale(190),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "rgba(19,217,160,0.2)",
  },
  badge: {
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
  badgeDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(10),
    backgroundColor: "#8CF4D3",
  },
  badgeText: {
    color: "#9BF6D7",
    fontSize: moderateScale(FONT.xxs),
  },
  title: {
    color: "#F1F8F4",
    fontSize: moderateScale(FONT.xl),
    lineHeight: moderateScale(34),
  },
  subtitle: {
    marginTop: moderateScale(6),
    marginBottom: moderateScale(12),
    color: "#AABBB6",
    fontSize: moderateScale(FONT.xxs),
    lineHeight: moderateScale(22),
    fontFamily: "Pretendard-Regular",
  },
  ctaButton: {
    minHeight: moderateScale(50),
    borderRadius: moderateScale(16),
    backgroundColor: "#12E2A0",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: moderateScale(8),
  },
  ctaText: {
    color: "#02130F",
    fontSize: moderateScale(FONT.sm),
  },
});
