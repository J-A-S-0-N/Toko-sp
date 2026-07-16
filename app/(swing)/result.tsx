import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

type SwingAnalysisState = {
  overallScore: number;
  addressAngleScore: number;
  headUpScore: number;
  backswingAngleScore: number;
  takebackScore: number;
  addressAngleFeedback: string;
  headUpFeedback: string;
  backswingAngleFeedback: string;
  takebackFeedback: string;
  summary: string;
};

const DEFAULT_ANALYSIS: SwingAnalysisState = {
  overallScore: 0,
  addressAngleScore: 0,
  headUpScore: 0,
  backswingAngleScore: 0,
  takebackScore: 0,
  addressAngleFeedback: "어드레스 각도 피드백이 아직 준비되지 않았습니다.",
  headUpFeedback: "헤드업 피드백이 아직 준비되지 않았습니다.",
  backswingAngleFeedback: "백스윙 각도 피드백이 아직 준비되지 않았습니다.",
  takebackFeedback: "테이크백 피드백이 아직 준비되지 않았습니다.",
  summary: "분석 결과를 불러오는 중입니다.",
};

function toScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function toText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

export default function SwingResultScreen() {
  const router = useRouter();
  const { swingVideoId } = useLocalSearchParams<{ swingVideoId?: string }>();
  const [analysis, setAnalysis] = React.useState<SwingAnalysisState>(DEFAULT_ANALYSIS);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!swingVideoId) {
      setIsLoading(false);
      return;
    }

    const swingVideoRef = doc(db, "SwingVideos", swingVideoId);
    const unsubscribe = onSnapshot(swingVideoRef, (snapshot) => {
      if (!snapshot.exists()) {
        setIsLoading(false);
        return;
      }

      const data = snapshot.data();
      setAnalysis({
        overallScore: toScore(data?.overallScore),
        addressAngleScore: toScore(data?.addressAngleScore),
        headUpScore: toScore(data?.headUpScore),
        backswingAngleScore: toScore(data?.backswingAngleScore),
        takebackScore: toScore(data?.takebackScore),
        addressAngleFeedback: toText(
          data?.addressAngleFeedback,
          DEFAULT_ANALYSIS.addressAngleFeedback
        ),
        headUpFeedback: toText(data?.headUpFeedback, DEFAULT_ANALYSIS.headUpFeedback),
        backswingAngleFeedback: toText(
          data?.backswingAngleFeedback,
          DEFAULT_ANALYSIS.backswingAngleFeedback
        ),
        takebackFeedback: toText(data?.takebackFeedback, DEFAULT_ANALYSIS.takebackFeedback),
        summary: toText(data?.summary, DEFAULT_ANALYSIS.summary),
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [swingVideoId]);

  const detailScores = [
    {
      key: "addressAngleScore",
      label: "어드레스 각도",
      score: analysis.addressAngleScore,
      feedback: analysis.addressAngleFeedback,
    },
    {
      key: "headUpScore",
      label: "헤드업",
      score: analysis.headUpScore,
      feedback: analysis.headUpFeedback,
    },
    {
      key: "backswingAngleScore",
      label: "백스윙 각도",
      score: analysis.backswingAngleScore,
      feedback: analysis.backswingAngleFeedback,
    },
    {
      key: "takebackScore",
      label: "테이크백",
      score: analysis.takebackScore,
      feedback: analysis.takebackFeedback,
    },
  ];

  const weakestDetail = detailScores.reduce((lowest, current) => {
    if (!lowest) return current;
    return current.score < lowest.score ? current : lowest;
  }, detailScores[0]);

  const handleShare = () => {
    Alert.alert("공유 준비 중", "공유 기능은 다음 단계에서 연결할 예정입니다.");
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={moderateScale(20)} color="#DDE4E2" />
          </Pressable>

          <Text type="barlowHard" style={styles.headerTitle}>
            스윙 분석 결과
          </Text>

          <Pressable style={styles.iconButton} onPress={() => router.replace("/(tabs)")}>
            <Feather name="arrow-up-right" size={moderateScale(18)} color="#DDE4E2" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#064133", "#02271D", "#04140F", "#010705"]}
            locations={[0, 0.28, 0.62, 1]}
            start={{ x: 0.08, y: 0.04 }}
            end={{ x: 0.95, y: 0.98 }}
            style={styles.overallCard}
          >
            <Text type="barlowHard" style={styles.overallLabel}>
              OVERALL SCORE
            </Text>

            <View style={styles.scoreRingWrap}>
              <View style={styles.scoreRingTrack}>
                <View
                  style={[
                    styles.scoreRingFill,
                    {
                      transform: [{ rotate: `${(analysis.overallScore / 100) * 360}deg` }],
                    },
                  ]}
                />
                <View style={styles.scoreCenter}>
                  <Text type="barlowHard" style={styles.scoreValue}>
                    {analysis.overallScore}
                  </Text>
                  <Text type="barlowLight" style={styles.scoreBase}>
                    / 100
                  </Text>
                </View>
              </View>
            </View>

            <Text type="barlowHard" style={styles.overallTitle}>
              {isLoading ? "분석 결과를 불러오는 중" : "파크골프 스윙 분석 완료"}
            </Text>
            <Text type="barlowLight" style={styles.overallDescription}>
              {analysis.summary}
            </Text>
          </LinearGradient>

          <View style={styles.detailHeaderRow}>
            <Text type="barlowHard" style={styles.detailTitle}>
              세부 점수
            </Text>
            <Text type="barlowLight" style={styles.detailMeta}>
              파크골프 · 5프레임
            </Text>
          </View>

          {detailScores.map((item) => (
            <View key={item.key} style={styles.scoreItemCard}>
              <View style={styles.scoreItemTopRow}>
                <Text type="barlowLight" style={styles.scoreItemLabel}>
                  {item.label}
                </Text>
                <Text type="barlowHard" style={styles.scoreItemValue}>
                  {item.score}
                </Text>
              </View>

              <View style={styles.scoreBarTrack}>
                <View style={[styles.scoreBarFill, { width: `${item.score}%` }]} />
              </View>

              <Text type="barlowLight" style={styles.scoreItemFeedback}>
                {item.feedback}
              </Text>
            </View>
          ))}

          <View style={styles.fixCard}>
            <Text type="barlowHard" style={styles.fixLabel}>
              가장 먼저 고칠 부분
            </Text>
            <Text type="barlowHard" style={styles.fixTitle}>
              {weakestDetail.label}
            </Text>
            <Text type="barlowLight" style={styles.fixDescription}>
              {weakestDetail.feedback}
            </Text>
          </View>
        </ScrollView>

        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text type="barlowHard" style={styles.shareButtonText}>
            공유하기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#010706",
  },
  container: {
    flex: 1,
    backgroundColor: "#010706",
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(16),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  iconButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#18312D",
    backgroundColor: "rgba(8,18,16,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: moderateScale(FONT.sm),
    color: "#EFF4F1",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateScale(16),
  },
  overallCard: {
    borderRadius: moderateScale(26),
    borderWidth: 1,
    borderColor: "#164C42",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(18),
    marginBottom: moderateScale(16),
  },
  overallLabel: {
    color: "#11E2A0",
    textAlign: "center",
    letterSpacing: moderateScale(1.8),
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(12),
  },
  scoreRingWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(14),
  },
  scoreRingTrack: {
    width: moderateScale(184),
    height: moderateScale(184),
    borderRadius: moderateScale(100),
    borderWidth: moderateScale(16),
    borderColor: "#18352F",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreRingFill: {
    position: "absolute",
    width: moderateScale(184),
    height: moderateScale(184),
    borderRadius: moderateScale(100),
    borderWidth: moderateScale(16),
    borderColor: "transparent",
    borderTopColor: "#12E3A2",
    borderRightColor: "#12E3A2",
  },
  scoreCenter: {
    alignItems: "center",
  },
  scoreValue: {
    color: "#F5F9F7",
    fontSize: moderateScale(FONT.h2),
    lineHeight: moderateScale(44),
  },
  scoreBase: {
    color: "#A6B4AF",
    fontSize: moderateScale(FONT.xxs),
    fontFamily: "Pretendard-Regular",
  },
  overallTitle: {
    color: "#F2F8F5",
    fontSize: moderateScale(FONT.xxl),
    textAlign: "center",
    marginBottom: moderateScale(4),
  },
  overallDescription: {
    color: "#95A59F",
    fontSize: moderateScale(FONT.xs),
    textAlign: "center",
    fontFamily: "Pretendard-Regular",
  },
  detailHeaderRow: {
    marginBottom: moderateScale(10),
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(2),
  },
  detailTitle: {
    color: "#EFF4F2",
    fontSize: moderateScale(FONT.lg),
  },
  detailMeta: {
    color: "#768783",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  scoreItemCard: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#1A302C",
    backgroundColor: "#071310",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginBottom: moderateScale(10),
  },
  scoreItemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  scoreItemLabel: {
    color: "#EAF1EE",
    fontSize: moderateScale(FONT.md),
    fontFamily: "Pretendard-Regular",
  },
  scoreItemValue: {
    color: "#EAF1EE",
    fontSize: moderateScale(FONT.xl),
  },
  scoreItemFeedback: {
    color: "#A5B5B0",
    fontSize: moderateScale(FONT.xxxs),
    lineHeight: moderateScale(18),
    marginTop: moderateScale(8),
    fontFamily: "Pretendard-Regular",
  },
  scoreBarTrack: {
    height: moderateScale(10),
    borderRadius: moderateScale(8),
    backgroundColor: "#243633",
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: moderateScale(8),
    backgroundColor: "#11E1A0",
  },
  fixCard: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#5A4723",
    backgroundColor: "rgba(35,28,15,0.55)",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(4),
  },
  fixLabel: {
    color: "#F4BF45",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(8),
  },
  fixTitle: {
    color: "#FFCC5D",
    fontSize: moderateScale(FONT.lg),
    lineHeight: moderateScale(30),
    marginBottom: moderateScale(8),
  },
  fixDescription: {
    color: "#C8B58D",
    fontSize: moderateScale(FONT.xs),
    lineHeight: moderateScale(24),
    fontFamily: "Pretendard-Regular",
  },
  shareButton: {
    marginTop: moderateScale(5),
    minHeight: moderateScale(56),
    borderRadius: moderateScale(18),
    backgroundColor: "#11E1A0",
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonText: {
    color: "#03120D",
    fontSize: moderateScale(FONT.md),
  },
});
