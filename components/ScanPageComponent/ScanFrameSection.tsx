import { ThemedText as Text } from "@/components/themed-text";
import Feather from "@expo/vector-icons/Feather";
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
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />

        <View style={styles.scanCenterIconWrap}>
          <Feather name="camera" size={moderateScale(24)} color="#61D8A9" />
        </View>
        <Text type="barlowHard" style={styles.scanTitle}>
          스코어카드를 프레임에 맞추세요
        </Text>
        <Text type="barlowLight" style={styles.scanSubtitle}>
          탭하여 카메라 또는 갤러리 열기
        </Text>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable style={[styles.actionButton, styles.primaryAction]} onPress={onCameraPress}>
          <Feather name="camera" size={moderateScale(16)} color="#FFFFFF" />
          <Text type="barlowHard" style={styles.primaryActionText}>
            카메라 열기
          </Text>
        </Pressable>

        <Pressable style={[styles.actionButton, styles.secondaryAction]} onPress={onGalleryPress}>
          <Text type="barlowLight" style={styles.secondaryActionText}>
            갤러리
          </Text>
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  scanFrame: {
    marginHorizontal: moderateScale(10),
    height: moderateScale(300),
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#292E31",
    backgroundColor: "#1F2222",
    justifyContent: "center",
    alignItems: "center",
  },
  cornerTopLeft: {
    position: "absolute",
    top: moderateScale(14),
    left: moderateScale(14),
    width: moderateScale(14),
    height: moderateScale(14),
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#38C792",
  },
  cornerTopRight: {
    position: "absolute",
    top: moderateScale(14),
    right: moderateScale(14),
    width: moderateScale(14),
    height: moderateScale(14),
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#38C792",
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: moderateScale(14),
    left: moderateScale(14),
    width: moderateScale(14),
    height: moderateScale(14),
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#38C792",
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: moderateScale(14),
    right: moderateScale(14),
    width: moderateScale(14),
    height: moderateScale(14),
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#38C792",
  },
  scanCenterIconWrap: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: "#1D3A32",
    borderWidth: 1,
    borderColor: "#2F7460",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(18),
  },
  scanTitle: {
    color: "#EEF2EF",
    fontSize: moderateScale(18),
    textAlign: "center",
  },
  scanSubtitle: {
    marginTop: moderateScale(3),
    color: "#5E666A",
    fontSize: moderateScale(15),
    textAlign: "center",
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
    height: moderateScale(52),
    flexDirection: "row",
    gap: moderateScale(7),
  },
  primaryAction: {
    flex: 2,
    backgroundColor: "#52B88F",
    shadowColor: "#52B88F",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: "#1A1F22",
    borderWidth: 1,
    borderColor: "#2A2E30",
  },
  secondaryActionText: {
    color: "#E5E9E6",
    fontSize: moderateScale(15),
  },
});

export default ScanFrameSection;
