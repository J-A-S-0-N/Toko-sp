import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type ScanFrameSectionProps = {
  onFramePress?: () => void;
  onCameraPress?: () => void;
  onGalleryPress?: () => void;
};

const ScanFrameSection = ({ onFramePress, onCameraPress, onGalleryPress }: ScanFrameSectionProps) => {
  return (
    <>
      <Pressable style={styles.scanFrame} onPress={onFramePress}>
        <LinearGradient
          colors={["#13D58B", "#12D88D", "#11CC84"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scanFrameGradient}
        >
          <View style={styles.scanFrameGlowSoft} />
          <View style={styles.scanFrameGlow} />

          <View style={styles.scanTextWrap}>
            <Text type="barlowHard" style={styles.scanTitle}>
              스코어 입력
            </Text>
            <Text type="barlowLight" style={styles.scanSubtitle}>
              오늘 라운드 기록하기
            </Text>
          </View>

          <View style={styles.scanArrowWrap}>
            <Feather name="arrow-right" size={moderateScale(28)} color="#031B12" />
          </View>
        </LinearGradient>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable style={[styles.actionButton, styles.primaryAction]} onPress={onCameraPress}>
          <Feather name="camera" size={moderateScale(16)} color="#7B8388" />
          <Text type="barlowHard" style={styles.primaryActionText}>
            카메라 열기
          </Text>
        </Pressable>

        <Pressable style={[styles.actionButton, styles.secondaryAction]} onPress={onGalleryPress}>
          <Feather name="edit-3" size={moderateScale(16)} color="#E5E9E6" />
          <Text type="barlowLight" style={styles.secondaryActionText}>
            직접 입력
          </Text>
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  scanFrame: {
    marginHorizontal: moderateScale(10),
    borderRadius: moderateScale(34),
    overflow: "hidden",
  },
  scanFrameGradient: {
    minHeight: moderateScale(170),
    borderRadius: moderateScale(34),
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(22),
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    position: "relative",
    backgroundColor: "#12D88D",
    overflow: "hidden",
  },
  scanFrameGlowSoft: {
    position: "absolute",
    top: moderateScale(-46),
    right: moderateScale(-30),
    width: moderateScale(230),
    height: moderateScale(230),
    borderRadius: moderateScale(130),
    backgroundColor: "rgba(227, 255, 246, 0.18)",
  },
  scanFrameGlow: {
    position: "absolute",
    top: moderateScale(-28),
    right: moderateScale(-14),
    width: moderateScale(170),
    height: moderateScale(170),
    borderRadius: moderateScale(100),
    backgroundColor: "rgba(226, 255, 245, 0.34)",
  },
  scanTextWrap: {
    flex: 1,
    paddingRight: moderateScale(16),
  },
  scanTitle: {
    color: "#031B12",
    fontSize: moderateScale(FONT.xxl),
  },
  scanSubtitle: {
    marginTop: moderateScale(8),
    color: "rgba(3, 27, 18, 0.84)",
    fontSize: moderateScale(FONT.md),
  },
  scanArrowWrap: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(22),
    backgroundColor: "rgba(6, 145, 95, 0.32)",
    borderWidth: 1,
    borderColor: "rgba(227, 255, 246, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    paddingHorizontal: moderateScale(10),
    flexDirection: "row",
    gap: moderateScale(10),
  },
  actionButton: {
    borderRadius: moderateScale(16),
    justifyContent: "center",
    alignItems: "center",
    height: moderateScale(70),
    flexDirection: "row",
    gap: moderateScale(7),
  },
  primaryAction: {
    flex: 1,
    backgroundColor: "#252A2D",
    borderWidth: 1,
    borderColor: "#32383C",
  },
  primaryActionText: {
    color: "#7B8388",
    fontSize: moderateScale(FONT.sm),
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: "#1A1F22",
    borderWidth: 1,
    borderColor: "#2A2E30",
  },
  secondaryActionText: {
    color: "#E5E9E6",
    fontSize: moderateScale(FONT.sm),
  },
});

export default ScanFrameSection;
