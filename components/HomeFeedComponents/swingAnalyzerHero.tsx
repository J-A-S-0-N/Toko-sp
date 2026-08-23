import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { moderateScale } from "react-native-size-matters";

type SwingAnalyzerHeroProps = {
  onPress?: () => void;
};

const MODAL_EXIT_MS = 320;

const MOCK_TOP3_ROWS = [
  { rank: "1", initial: "영", name: "박영수님", summary: "끝까지 완성된 스윙", score: "96" },
  { rank: "2", initial: "정", name: "김정희님", summary: "힘보다 리듬이 좋은 스윙", score: "94" },
  { rank: "3", initial: "미", name: "한미숙님", summary: "흐름림 없는 피니시", score: "93" },
];

export default function SwingAnalyzerHero({ onPress }: SwingAnalyzerHeroProps) {
  const [isWeeklyModalMounted, setIsWeeklyModalMounted] = useState(false);
  const [isWeeklyModalVisible, setIsWeeklyModalVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const openWeeklyModal = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsWeeklyModalMounted(true);
    setTimeout(() => {
      setIsWeeklyModalVisible(true);
    }, 10);
  };

  const closeWeeklyModal = () => {
    setIsWeeklyModalVisible(false);

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      setIsWeeklyModalMounted(false);
      closeTimerRef.current = null;
    }, MODAL_EXIT_MS);
  };

  return (
    <View style={styles.stack}>
      <LinearGradient
        colors={["#063A2E", "#032A21", "#03251D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroContainer}
      >
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        {/* 
        <View style={styles.challengeBadge}>
          <Text
            type="barlowHard"
            style={styles.challengeBadgeText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            ellipsizeMode="clip"
          >
            🏆 이번 주 도전 · 80점 이상
          </Text>
        </View>
        */}

        <Text type="barlowHard" style={styles.heroTitle}>
          내 스윙은{"\n"}몇 점일까요?
        </Text>

        <Text type="barlowLight" style={styles.heroSubtitle}>
          촬영하면 스윙 유형, 점수, 장점과 가장 먼저 고칠 점을 바로 알려드립니다.
        </Text>

        <Pressable style={styles.heroCtaButton} onPress={onPress}>
          <Text type="barlowHard" style={styles.heroCtaText}>
            스윙 촬영 시작
          </Text>
        </Pressable>
      </LinearGradient>

      <Modal
        visible={isWeeklyModalMounted}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeWeeklyModal}
      >
        <View style={styles.modalRoot}>
          {isWeeklyModalVisible && (
            <Animated.View
              entering={FadeIn.duration(320)}
              exiting={FadeOut.duration(MODAL_EXIT_MS)}
              style={styles.modalBackdrop}
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={closeWeeklyModal} />
            </Animated.View>
          )}

          {isWeeklyModalVisible && (
            <Animated.View
              entering={FadeIn.duration(320)}
              exiting={FadeOut.duration(MODAL_EXIT_MS)}
              style={styles.modalSheetWrap}
            >
              <Animated.View
                entering={SlideInDown.duration(240)}
                exiting={SlideOutDown.duration(MODAL_EXIT_MS)}
                style={styles.modalSheet}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  <View style={styles.modalHeaderRow}>
                    <View style={styles.modalBadge}>
                      <Text type="barlowHard" style={styles.modalBadgeText}>
                        이번 주 베스트 스윙
                      </Text>
                    </View>

                    <Pressable onPress={closeWeeklyModal} style={styles.modalCloseBtn}>
                      <Text type="barlowHard" style={styles.modalCloseText}>
                        ×
                      </Text>
                    </Pressable>
                  </View>

                  <LinearGradient
                    colors={["#28553F", "#123528", "#0A2018"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bestSwingCard}
                  >
                    <View style={styles.bestSwingGlow} />
                    <View style={styles.bestSwingMedia}>
                      <View style={styles.bestSwingPlayCircle}>
                        <Text type="barlowHard" style={styles.bestSwingPlayIcon}>
                          ▶
                        </Text>
                      </View>
                    </View>

                    <View style={styles.bestSwingMeta}>
                      <Text type="barlowHard" style={styles.bestSwingLabel}>
                        이번 주 가장 완성도 높은 스윙
                      </Text>
                      <Text type="barlowHard" style={styles.bestSwingName}>
                        박영수님
                      </Text>
                      <Text type="barlowLight" style={styles.bestSwingSubtext}>
                        끝까지 완성된 스윙
                      </Text>
                    </View>

                    <View style={styles.bestSwingScoreBox}>
                      <Text type="barlowHard" style={styles.bestSwingScoreText}>
                        96
                      </Text>
                      <Text type="barlowHard" style={styles.bestSwingScoreLabel}>
                        MATCH
                      </Text>
                    </View>
                  </LinearGradient>

                  <View style={styles.modalSummaryBox}>
                    <Text type="barlowLight" style={styles.modalSummaryText}>
                      리듬, 균형, 피니시가 고르게 뛰어났고 스윙 전체의 흐름이 자연스럽게 이어졌어요.
                    </Text>
                  </View>

                  <View style={styles.top3HeaderRow}>
                    <Text type="barlowHard" style={styles.top3Title}>
                      이번 주 TOP 3
                    </Text>
                    <Text type="barlowLight" style={styles.top3Subtext}>
                      공개 스윙 기준
                    </Text>
                  </View>

                  {MOCK_TOP3_ROWS.map((row) => (
                    <View key={row.rank} style={styles.top3Row}>
                      <Text type="barlowLight" style={styles.top3RankText}>
                        {row.rank}
                      </Text>

                      <LinearGradient
                        colors={["#5C8F78", "#2E5F4C"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.top3InitialBubble}
                      >
                        <Text type="barlowHard" style={styles.top3InitialText}>
                          {row.initial}
                        </Text>
                      </LinearGradient>

                      <View style={styles.top3NameBlock}>
                        <Text type="barlowHard" style={styles.top3NameText}>
                          {row.name}
                        </Text>
                        <Text type="barlowLight" style={styles.top3SummaryText}>
                          {row.summary}
                        </Text>
                      </View>

                      <View style={styles.top3ScoreBlock}>
                        <Text type="barlowHard" style={styles.top3ScoreText}>
                          {row.score}
                        </Text>
                        <Text type="barlowLight" style={styles.top3ScoreLabel}>
                          MATCH
                        </Text>
                      </View>
                    </View>
                  ))}

                  <Pressable style={styles.fullViewButton} onPress={closeWeeklyModal}>
                    <Text type="barlowHard" style={styles.fullViewButtonText}>
                      1위 스윙 전체 보기
                    </Text>
                  </Pressable>
                </ScrollView>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: moderateScale(12),
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(14),
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.66)",
  },
  modalSheetWrap: {
    maxHeight: "92%",
  },
  modalSheet: {
    backgroundColor: "#111615",
    borderRadius: moderateScale(30),
    borderWidth: 1,
    borderColor: "#2A3331",
    overflow: "hidden",
  },
  modalScrollContent: {
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(16),
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  modalBadge: {
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "#4D655A",
    backgroundColor: "rgba(79, 121, 103, 0.42)",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
  },
  modalBadgeText: {
    color: "#DCE7E1",
    fontSize: moderateScale(FONT.xxs),
  },
  modalCloseBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "rgba(46, 56, 52, 0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: "#D7E1DB",
    fontSize: moderateScale(FONT.lg),
  },
  bestSwingCard: {
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#2E5745",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
    overflow: "hidden",
  },
  bestSwingGlow: {
    position: "absolute",
    right: moderateScale(18),
    top: moderateScale(10),
    width: moderateScale(86),
    height: moderateScale(86),
    borderRadius: moderateScale(999),
    backgroundColor: "rgba(174, 222, 62, 0.2)",
  },
  bestSwingMedia: {
    width: moderateScale(82),
    height: moderateScale(108),
    borderRadius: moderateScale(18),
    backgroundColor: "rgba(28, 41, 36, 0.9)",
    borderWidth: 1,
    borderColor: "#3C564C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
  },
  bestSwingPlayCircle: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(999),
    backgroundColor: "rgba(239, 248, 244, 0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  bestSwingPlayIcon: {
    color: "#184433",
    marginLeft: moderateScale(2),
    fontSize: moderateScale(FONT.xs),
  },
  bestSwingMeta: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  bestSwingLabel: {
    color: "#C8E462",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(5),
  },
  bestSwingName: {
    color: "#EDF3F0",
    fontSize: moderateScale(FONT.lg),
    marginBottom: moderateScale(2),
  },
  bestSwingSubtext: {
    color: "#9DB0A7",
    fontSize: moderateScale(FONT.xxxs),
  },
  bestSwingScoreBox: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(20),
    backgroundColor: "#D6F954",
    alignItems: "center",
    justifyContent: "center",
  },
  bestSwingScoreText: {
    color: "#0F1B14",
    fontSize: moderateScale(FONT.xl),
    lineHeight: moderateScale(28),
  },
  bestSwingScoreLabel: {
    color: "#253223",
    fontSize: moderateScale(FONT.xxxs - 1),
  },
  modalSummaryBox: {
    borderRadius: moderateScale(18),
    backgroundColor: "#1A2220",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    marginBottom: moderateScale(14),
  },
  modalSummaryText: {
    color: "#B4C0BB",
    fontSize: moderateScale(FONT.xs),
    lineHeight: moderateScale(19),
    fontFamily: "Pretendard-Regular",
  },
  top3HeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  top3Title: {
    color: "#E8EFEB",
    fontSize: moderateScale(FONT.lg),
  },
  top3Subtext: {
    color: "#7F8D88",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  top3Row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(16),
    backgroundColor: "#1A201F",
    borderWidth: 1,
    borderColor: "#27302E",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginBottom: moderateScale(8),
  },
  top3RankText: {
    width: moderateScale(22),
    color: "#D1BE7B",
    fontSize: moderateScale(FONT.md),
    textAlign: "center",
    marginRight: moderateScale(8),
  },
  top3InitialBubble: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(15),
    borderColor: "#4D7E69",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(10),
  },
  top3InitialText: {
    color: "#EDF5F1",
    fontSize: moderateScale(FONT.sm),
  },
  top3NameBlock: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  top3NameText: {
    color: "#E7EEEA",
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(3),
  },
  top3SummaryText: {
    color: "#8EA09A",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  top3ScoreBlock: {
    alignItems: "flex-end",
  },
  top3ScoreText: {
    color: "#78DEB2",
    fontSize: moderateScale(FONT.xl),
    lineHeight: moderateScale(26),
  },
  top3ScoreLabel: {
    color: "#83918C",
    fontSize: moderateScale(FONT.xxxs - 1),
    fontFamily: "Pretendard-Regular",
  },
  fullViewButton: {
    marginTop: moderateScale(12),
    minHeight: moderateScale(62),
    borderRadius: moderateScale(20),
    backgroundColor: "#174D3B",
    alignItems: "center",
    justifyContent: "center",
  },
  fullViewButtonText: {
    color: "#F4F9F7",
    fontSize: moderateScale(FONT.md),
  },
  heroContainer: {
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#18745F",
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(20),
    overflow: "hidden",
    backgroundColor: "#04241C",
  },
  heroGlowOne: {
    position: "absolute",
    right: moderateScale(-62),
    bottom: moderateScale(-130),
    width: moderateScale(250),
    height: moderateScale(250),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "rgba(108, 255, 208, 0.2)",
  },
  heroGlowTwo: {
    position: "absolute",
    right: moderateScale(-18),
    bottom: moderateScale(-42),
    width: moderateScale(180),
    height: moderateScale(180),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "rgba(108, 255, 208, 0.2)",
  },
  challengeBadge: {
    alignSelf: "stretch",
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "#8A7834",
    backgroundColor: "rgba(64, 52, 18, 0.65)",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(9),
    marginBottom: moderateScale(16),
  },
  challengeBadgeText: {
    color: "#EED487",
    fontSize: moderateScale(FONT.xxs),
    textAlign: "center",
    includeFontPadding: false,
  },
  heroTitle: {
    color: "#F1F8F4",
    fontSize: moderateScale(FONT.xl + 2),
    //lineHeight: moderateScale(44),
  },
  heroSubtitle: {
    marginTop: moderateScale(12),
    marginBottom: moderateScale(18),
    color: "#9CB7AE",
    fontSize: moderateScale(FONT.xs),
    fontFamily: "Pretendard-Regular",
  },
  heroCtaButton: {
    minHeight: moderateScale(58),
    borderRadius: moderateScale(20),
    backgroundColor: "#16E4B0",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCtaText: {
    color: "#02130F",
    fontSize: moderateScale(FONT.md),
  },
});
