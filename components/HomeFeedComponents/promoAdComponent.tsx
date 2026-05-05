import { ThemedText } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

export default function PromoAdComponent() {
  return (
    <View style={styles.container}>
      {/* Top Row: Text + Image */}
      <View style={styles.topRow}>
        <View style={styles.textSection}>
          <ThemedText type="barlowLight" style={styles.sponsoredLabel}>
            SPONSORED
          </ThemedText>
          <ThemedText type="barlowHard" style={styles.title}>
            당신의 게임을 형상해보세요!
          </ThemedText>
          <ThemedText type="barlowLight" style={styles.description}>
            20% 활인을 당장 받아보세요
          </ThemedText>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://via.placeholder.com/80x80/FFFFFF/000000?text=⛳" }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Bottom: Full-width CTA Button */}
      <TouchableOpacity style={styles.ctaButton}>
        <ThemedText type="barlowHard" style={styles.ctaText}>
          자세히 보기
        </ThemedText>
        <Ionicons name="arrow-forward" size={moderateScale(16)} color="#FFFFFF" />
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
    gap: moderateScale(6),
  },
  sponsoredLabel: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.xs),
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.lg),
    lineHeight: moderateScale(24),
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
    borderWidth: 1,
    borderColor: "#45D07F",
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(8),
  },
  ctaText: {
    color: "#45D07F",
    fontSize: moderateScale(FONT.sm),
  },
});
