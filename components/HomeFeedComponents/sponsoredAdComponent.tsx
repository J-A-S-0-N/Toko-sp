import { ThemedText } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

export default function SponsoredAdComponent() {
  return (
    <View style={styles.container}>
      {/* Header with Sponsored label */}
      <View style={styles.headerRow}>
        <ThemedText type="barlowLight" style={styles.sponsoredLabel}>
          스폰서 광고
        </ThemedText>
        <View style={styles.moreButton}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentRow}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://via.placeholder.com/100x100/2D3A2D/FFFFFF?text=Golf+Set" }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>

        {/* Right Column: Text + Button */}
        <View style={styles.rightColumn}>
          {/* Text Content */}
          <View style={styles.textContainer}>
            <ThemedText type="barlowHard" style={styles.title}>
              ARCGOLF 프리미엄 볼 SET 할인
            </ThemedText>
            <ThemedText type="barlowLight" style={styles.description}>
              부드러운 타구감과 뛰어난 비거리.{"\n"}
              지금 20% 할인된 가격으로 만나보세요!
            </ThemedText>
          </View>

          {/* CTA Button */}
          <TouchableOpacity style={styles.ctaButton}>
            <ThemedText type="barlowLight" style={styles.ctaText}>
              자세히 보기
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: "#292E31",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  sponsoredLabel: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.xs),
  },
  moreButton: {
    flexDirection: "row",
    gap: moderateScale(2),
    padding: moderateScale(4),
  },
  dot: {
    width: moderateScale(3),
    height: moderateScale(3),
    borderRadius: moderateScale(1.5),
    backgroundColor: "#6E7171",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: moderateScale(12),
  },
  rightColumn: {
    flex: 1,
    flexDirection: "column",
    gap: moderateScale(8),
    marginRight: moderateScale(10),
  },
  imageContainer: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(12),
    overflow: "hidden",
    backgroundColor: "#2D3A2D",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    gap: moderateScale(4),
  },
  title: {
    alignSelf: "flex-end",
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.md),
    lineHeight: moderateScale(20),
  },
  description: {
    alignSelf: "flex-end",
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.xs),
    lineHeight: moderateScale(16),
  },
  ctaButton: {
    borderWidth: 1,
    borderColor: "#45D07F",
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: "auto",
  },
  ctaText: {
    color: "#45D07F",
    fontSize: moderateScale(FONT.xs),
  },
});
