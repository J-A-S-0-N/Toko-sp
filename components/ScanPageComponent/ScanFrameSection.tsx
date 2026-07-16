import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Image as RNImage, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type ScanFrameSectionProps = {
  onSwingAnalysisPress?: () => void;
  onFramePress?: () => void;
  onCameraPress?: () => void;
  onGalleryPress?: () => void;
};

const ScanFrameSection = ({ onSwingAnalysisPress, onFramePress, onCameraPress, onGalleryPress }: ScanFrameSectionProps) => {
  const cameraIconSource = require("@/assets/images/camera_open_icon_thick.png");
  const courseFlagIconSource = require("@/assets/images/course_hole_flag_icon_thick.png");

  return (
    <>
      <Pressable style={styles.swingAnalysisButton} onPress={onSwingAnalysisPress}>
        <LinearGradient
          colors={["#0C1E19", "#0A1815", "#071311"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.swingAnalysisGradient}
        >
          <View style={styles.swingAnalysisLeft}>
            <View style={styles.swingIconWrap}>
              <Feather name="star" size={moderateScale(15)} color="#4BEFC1" />
            </View>

            <View>
              <View style={styles.swingTitleRow}>
                <Text type="barlowHard" style={styles.swingTitle}>
                  AI 스윙 분석
                </Text>
                <View style={styles.swingNewBadge}>
                  <Text type="barlowHard" style={styles.swingNewBadgeText}>
                    NEW
                  </Text>
                </View>
              </View>

              <Text type="barlowLight" style={styles.swingSubtitle}>
                내 스윙을 촬영하고 AI로 분석해보세요
              </Text>
            </View>
          </View>

          <View style={styles.swingArrowWrap}>
            <Feather name="arrow-right" size={moderateScale(22)} color="#4BEFC1" />
          </View>
        </LinearGradient>
      </Pressable>

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
                <RNImage source={cameraIconSource} style={styles.actionIconImage} resizeMode="contain" />
              </View>
              <View>
                <Text type="barlowHard" style={styles.actionTitleText}>
                  기록기 촬영 입력
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
                <RNImage source={courseFlagIconSource} style={styles.actionIconImage} resizeMode="contain" />
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
  swingAnalysisButton: {
    marginHorizontal: moderateScale(10),
    borderRadius: moderateScale(22),
    overflow: "hidden",
    marginBottom: 0,
  },
  swingAnalysisGradient: {
    minHeight: moderateScale(84),
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#14493D",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  swingAnalysisLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    flex: 1,
  },
  swingIconWrap: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#1F7260",
    backgroundColor: "rgba(8, 51, 42, 0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  swingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  swingTitle: {
    color: "#F0F9F6",
    fontSize: moderateScale(FONT.md),
  },
  swingNewBadge: {
    borderRadius: moderateScale(999),
    backgroundColor: "#14D89A",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
  },
  swingNewBadgeText: {
    color: "#03231A",
    fontSize: moderateScale(FONT.xxxs),
  },
  swingSubtitle: {
    marginTop: moderateScale(4),
    color: "#90A9A1",
    fontSize: moderateScale(FONT.xxs),
    fontFamily: "Pretendard-Regular",
  },
  swingArrowWrap: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#1A5A4C",
    backgroundColor: "rgba(8, 32, 27, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: moderateScale(8),
  },
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
  actionIconImage: {
    width: moderateScale(42),
    height: moderateScale(42),
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
