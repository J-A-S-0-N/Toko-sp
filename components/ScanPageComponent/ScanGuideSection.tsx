import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import React from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type GuideStep = {
  id: string;
  title: string;
  desc: string;
};

const GUIDE_STEPS: GuideStep[] = [
  { id: "01", title: "스코어카드 촬영", desc: "인쇄본 또는 손글씨 카드 모두 가능합니다" },
  { id: "02", title: "AI 자동 분석", desc: "홀별 스코어를 자동으로 인식합니다" },
  { id: "03", title: "기록 저장", desc: "분석 결과가 피드에 자동으로 추가됩니다" },
];

type ScanGuideSectionProps = {
  steps?: GuideStep[];
};

const ScanGuideSection = ({ steps = GUIDE_STEPS }: ScanGuideSectionProps) => {
  return (
    <>
      <Text type="barlowHard" style={styles.howToTitle}>
        이렇게 사용해요
      </Text>

      <View style={styles.guideList}>
        {steps.map((step) => (
          <View key={step.id} style={styles.guideCard}>
            <Text type="barlowHard" style={styles.guideIndex}>
              {step.id}
            </Text>
            <View style={styles.guideTextWrap}>
              <Text type="barlowHard" style={styles.guideTitle}>
                {step.title}
              </Text>
              <Text type="barlowLight" style={styles.guideDesc}>
                {step.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  howToTitle: {
    paddingHorizontal: moderateScale(10),
    color: "#636A6E",
    fontSize: moderateScale(FONT.sm),
  },
  guideList: {
    paddingHorizontal: moderateScale(10),
    gap: moderateScale(10),
  },
  guideCard: {
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#292E31",
    backgroundColor: "#1F2222",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(13),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  guideIndex: {
    color: "#46C396",
    fontSize: moderateScale(FONT.lg),
    width: moderateScale(20),
  },
  guideTextWrap: {
    flex: 1,
  },
  guideTitle: {
    color: "#EDF1EE",
    fontSize: moderateScale(FONT.md),
  },
  guideDesc: {
    marginTop: moderateScale(4),
    color: "#61696B",
    fontSize: moderateScale(FONT.xs),
  },
});

export default ScanGuideSection;
