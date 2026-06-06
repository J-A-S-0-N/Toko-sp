import { ThemedText } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

export default function PromoAdComponent() {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/(tabs)/notice",
      params: { showGiveaway: "true" }
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Row: Text + Image */}
      <View style={styles.topRow}>
        <View style={styles.textSection}>
          <ThemedText type="barlowLight" style={styles.sponsoredLabel}>
            이벤트
          </ThemedText>
          <ThemedText type="barlowHard" style={styles.title}>
            스코어 디스크 무료 증정 이벤트
          </ThemedText>
          <ThemedText type="barlowLight" style={styles.description}>
            토코기록기 스코어 어플 출시 기념 이벤트
          </ThemedText>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://via.placeholder.com/80x80/4CAE82/FFFFFF?text=⛳" }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Bottom: Full-width CTA Button */}
      <TouchableOpacity style={styles.ctaButton} onPress={handlePress}>
        <ThemedText type="barlowHard" style={styles.ctaText}>
          이벤트 보기
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
  description: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(20),
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
