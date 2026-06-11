import { ThemedText } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { arrayUnion, doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import React from "react";
import { Image, Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

export default function SponsoredAdComponent() {
  const { user, username } = useAuth();

  const handleContactPress = async () => {
    console.log("contact pressed by:", username);
    try {
      await setDoc(
        doc(db, "AdStats", "서산점"),
        {
          contactClicks: increment(1),
          contacts: arrayUnion({
            userUid: user?.uid ?? null,
            userName: username ?? null,
            pressedAt: new Date().toISOString(),
          }),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error incrementing contact clicks:", error);
    }
    Linking.openURL("tel:0416628979");
  };

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
            source={require("@/assets/images/서산매장이미지.png")}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>

        {/* Right Column: Text + Button */}
        <View style={styles.rightColumn}>
          {/* Text Content */}
          <View style={styles.textContainer}>
            <ThemedText type="barlowHard" style={styles.title}>
              하루 8만원 4명이용 6만원 이벤트!!
            </ThemedText>
            <ThemedText type="barlowLight" style={styles.description}>
              서산점 올싱글 041 662 8979
              부드러운 타구감과 뛰어난 비거리.{"\n"}
              지금 20% 할인된 가격으로 만나보세요!
            </ThemedText>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleContactPress}
          >
            <ThemedText type="barlowLight" style={styles.ctaText}>
              바로 연락하기
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
    paddingHorizontal: moderateScale(20),
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
