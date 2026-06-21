import { ThemedText } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

interface LaunchEventModalProps {
  onClose: () => void;
}

export default function LaunchEventModal({ onClose }: LaunchEventModalProps) {
  const router = useRouter();

  const handleJoin = () => {
    onClose();
    router.push({
      pathname: "/(tabs)/notice",
      params: { showGiveaway: "true" }
    });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Header with badge and close button */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={moderateScale(10)} color="#E8B923" />
            <ThemedText type="barlowLight" style={styles.badgeText}>
              특별 이벤트
            </ThemedText>
            <Ionicons name="sparkles" size={moderateScale(10)} color="#E8B923" />
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={moderateScale(20)} color="#6E7171" />
          </Pressable>
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleJoin}>
          <ThemedText type="barlowLight" style={styles.primaryButtonText}>
            이벤트 참여하기
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
  titleContainer: {
    marginBottom: moderateScale(8),
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  titleWhite: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.xxl),
    lineHeight: moderateScale(34),
  },
  titleGreen: {
    color: "#4CAE82",
    fontSize: moderateScale(FONT.xxl),
    lineHeight: moderateScale(34),
  },
  description: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(4),
  },
  highlight: {
    color: "#4CAE82",
    fontSize: moderateScale(FONT.md),
    marginBottom: moderateScale(12),
  },
  imageContainer: {
    alignSelf: "center",
    marginBottom: moderateScale(12),
  },
  giftImage: {
    width: moderateScale(100),
    height: moderateScale(100),
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginBottom: moderateScale(16),
  },
  periodText: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.xs),
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
