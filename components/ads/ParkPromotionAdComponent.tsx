import { ThemedText } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const descriptionLines = [
  "5만조회수 확보까지 1조회수 단돈 25원꼴",
  "라이브방송 1회 [토코 파크골프 2만6천명]",
  "라이브 방송 편집 1회 [파크 프로TV]",
  "기타 세로 영상 합산 5만조회수 나올때까지",
  "문의 010 2701 4512",
];

export default function ParkPromotionAdComponent() {
  const handlePress = async () => {
    try {
      await Linking.openURL("https://youtube.com/live/S-tzimrIBtI?feature=share");
    } catch (error) {
      console.error("Failed to open park promotion link:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.textSection}>
          <ThemedText type="barlowLight" style={styles.sponsoredLabel}>
            광고
          </ThemedText>
          <ThemedText type="barlowHard" style={styles.title}>
            파크 구장 흥보가 필요하신곳 [프로파크 4인 출연]
          </ThemedText>
          <View style={styles.descriptionWrap}>
            {descriptionLines.map((line) => (
              <ThemedText key={line} type="barlowLight" style={styles.description}>
                {line}
              </ThemedText>
            ))}
          </View>
        </View>

        <View style={styles.imageContainer}>
          <Image source={require("@/assets/images/4personAdImage.png")} style={styles.productImage} resizeMode="cover" />
        </View>
      </View>

      <TouchableOpacity style={styles.ctaButton} onPress={() => void handlePress()}>
        <ThemedText type="barlowHard" style={styles.ctaText}>
          보기
        </ThemedText>
        <Ionicons name="arrow-forward" size={moderateScale(16)} color="#4CAE82" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: "#292E31",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(16),
  },
  textSection: {
    flex: 1,
    paddingRight: moderateScale(12),
    gap: moderateScale(4),
  },
  sponsoredLabel: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.xxs),
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.md),
    lineHeight: moderateScale(22),
  },
  descriptionWrap: {
    marginTop: moderateScale(2),
    gap: moderateScale(2),
  },
  description: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(18),
  },
  imageContainer: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(12),
    overflow: "hidden",
    backgroundColor: "#2D3A2D",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  ctaButton: {
    borderWidth: moderateScale(0.5),
    borderColor: "#4CAE82",
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    backgroundColor: "#163429",
  },
  ctaText: {
    color: "#4CAE82",
    fontSize: moderateScale(FONT.sm),
  },
});
