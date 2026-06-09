import { ThemedText } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

interface AdRequestModalProps {
  onClose: () => void;
}

export default function AdRequestModal({ onClose }: AdRequestModalProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Header with badge and close button */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="megaphone" size={moderateScale(10)} color="#E8B923" />
            <ThemedText type="barlowLight" style={styles.badgeText}>
              광고 문의
            </ThemedText>
            <Ionicons name="megaphone" size={moderateScale(10)} color="#E8B923" />
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={moderateScale(20)} color="#6E7171" />
          </Pressable>
        </View>

        {/* Ad Request Banner Image */}
        <Image
          source={require('../assets/images/adImages/ads reqest banner image.png')}
          style={styles.bannerImage}
          resizeMode="stretch"
        />

        {/* Buttons */}
        <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
          <ThemedText type="barlowLight" style={styles.primaryButtonText}>
            확인
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
          <ThemedText type="barlowLight" style={styles.secondaryButtonText}>
            닫기
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: moderateScale(80),
    paddingHorizontal: moderateScale(20),
    zIndex: 9999,
  },
  card: {
    width: "100%",
    backgroundColor: "#141718",
    borderRadius: moderateScale(20),
    padding: moderateScale(7),
    borderWidth: 1,
    borderColor: "#1F2528",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(12),
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    backgroundColor: "#1F2222",
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#2A3134",
  },
  badgeText: {
    color: "#E8B923",
    fontSize: moderateScale(FONT.xxs),
    letterSpacing: 0.5,
  },
  closeButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#1F2222",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerImage: {
    alignSelf: "center",
    width: "100%",
    height: moderateScale(230),
    marginVertical: moderateScale(16),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#4CAE82",
    shadowColor: "#4CAE82",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  primaryButton: {
    backgroundColor: "#4CAE82",
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  primaryButtonText: {
    color: "#0F1010",
    fontSize: moderateScale(FONT.sm),
  },
  secondaryButton: {
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A3134",
  },
  secondaryButtonText: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
  },
});
