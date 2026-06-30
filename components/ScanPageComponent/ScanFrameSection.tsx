import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Image as RNImage, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { SvgUri } from "react-native-svg";

type ScanFrameSectionProps = {
  onFramePress?: () => void;
  onCameraPress?: () => void;
  onGalleryPress?: () => void;
};

const ScanFrameSection = ({ onFramePress, onCameraPress, onGalleryPress }: ScanFrameSectionProps) => {
  const cameraIconUri = RNImage.resolveAssetSource(require("@/assets/images/camera_open_icon_thick.svg")).uri;
  const courseFlagIconUri = RNImage.resolveAssetSource(require("@/assets/images/course_hole_flag_icon_thick.svg")).uri;

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

      <View style={styles.actionList}>
        <Pressable style={styles.actionButton} onPress={onCameraPress}>
          <LinearGradient
            colors={["#1B2125", "#11161A", "#0D1216"]}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <View style={styles.actionLeftWrap}>
              <View style={styles.actionIconWrap}>
                <SvgUri uri={cameraIconUri} width={moderateScale(40)} height={moderateScale(40)} />
              </View>
              <View>
                <Text type="barlowHard" style={styles.actionTitleText}>
                  토코기록기 입력
                </Text>
                <Text type="barlowLight" style={styles.actionSubtitleText}>
                  스코어카드 촬영하기
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={moderateScale(24)} color="#AEB7BC" />
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={onGalleryPress}>
          <LinearGradient
            colors={["#1B2125", "#11161A", "#0D1216"]}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <View style={styles.actionLeftWrap}>
              <View style={styles.actionIconWrap}>
                <SvgUri uri={courseFlagIconUri} width={moderateScale(40)} height={moderateScale(40)} />
              </View>
              <View>
                <Text type="barlowHard" style={styles.actionTitleText}>
                  코스 설정
                </Text>
                <Text type="barlowLight" style={styles.actionSubtitleText}>
                  코스 / 홀 정보 선택
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={moderateScale(24)} color="#AEB7BC" />
          </LinearGradient>
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
  actionList: {
    paddingHorizontal: moderateScale(10),
    gap: moderateScale(10.5),
  },
  actionButton: {
    borderRadius: moderateScale(19),
    overflow: "hidden",
  },
  actionGradient: {
    borderRadius: moderateScale(19),
    borderWidth: 1,
    borderColor: "#2A3237",
    minHeight: moderateScale(90),
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(20),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionLeftWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  actionIconWrap: {
    width: moderateScale(30),
    height: moderateScale(30),
    marginRight: moderateScale(10),
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.95,
  },
  actionTitleText: {
    color: "#E7ECEF",
    fontSize: moderateScale(FONT.xl),
  },
  actionSubtitleText: {
    color: "#838E94",
    fontSize: moderateScale(FONT.sm),
  },
});

export default ScanFrameSection;
