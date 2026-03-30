import HoleEditorModal from "@/components/ScanPageComponent/HoleEditorModal";
import { submit } from "@/components/ScanPageComponent/backendLogic/submit";
import { ThemedText as Text } from "@/components/themed-text";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

type HoleScore = {
  hole: number;
  score: number;
  par: number;
};

const defaultHoleScores: HoleScore[] = [
  { hole: 1, score: 5, par: 4 },
  { hole: 2, score: 3, par: 3 },
  { hole: 3, score: 5, par: 5 },
  { hole: 4, score: 4, par: 4 },
  { hole: 5, score: 5, par: 4 },
  { hole: 6, score: 3, par: 3 },
  { hole: 7, score: 4, par: 4 },
  { hole: 8, score: 6, par: 5 },
  { hole: 9, score: 4, par: 4 },
  { hole: 10, score: 4, par: 4 },
  { hole: 11, score: 2, par: 3 },
  { hole: 12, score: 4, par: 4 },
  { hole: 13, score: 5, par: 5 },
  { hole: 14, score: 4, par: 4 },
  { hole: 15, score: 5, par: 4 },
  { hole: 16, score: 4, par: 3 },
  { hole: 17, score: 5, par: 5 },
  { hole: 18, score: 4, par: 4 },
];

export default function ResultPreviewScreen() {
  const router = useRouter();
  const { holes } = useLocalSearchParams<{ holes?: string }>();

  const holesCount = holes === "18" ? 18 : 9;
  const standardCoursePar = holesCount === 18 ? 72 : 36;

  const [parInputEnabled, setParInputEnabled] = useState(false);
  const [coursePar, setCoursePar] = useState(standardCoursePar);
  const [holeScores, setHoleScores] = useState(defaultHoleScores);
  const [selectedHoleIndex, setSelectedHoleIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleHoleScores = useMemo(() => holeScores.slice(0, holesCount), [holeScores, holesCount]);
  const selectedHole = useMemo(
    () => (selectedHoleIndex === null ? null : holeScores[selectedHoleIndex] ?? null),
    [selectedHoleIndex, holeScores]
  );

  const stats = useMemo(() => {
    const totalScore = visibleHoleScores.reduce((acc, item) => acc + item.score, 0);
    const holeTotalPar = visibleHoleScores.reduce((acc, item) => acc + item.par, 0);
    const appliedPar = parInputEnabled ? holeTotalPar : coursePar;
    const diff = totalScore - appliedPar;
    const birdieCount = visibleHoleScores.filter((item) => item.score < item.par).length;
    const doubleCount = visibleHoleScores.filter((item) => item.score - item.par >= 2).length;

    return {
      totalScore,
      appliedPar,
      diff,
      birdieCount,
      doubleCount,
    };
  }, [visibleHoleScores, parInputEnabled, coursePar]);

  const diffLabel = stats.diff > 0 ? `+${stats.diff}` : stats.diff === 0 ? "E" : String(stats.diff);

  const handleHolePress = (index: number) => {
    setSelectedHoleIndex(index);
  };

  const handleCloseHoleEditor = () => {
    setSelectedHoleIndex(null);
  };

  const handleConfirmHoleEdit = (score: number, par: number) => {
    if (selectedHoleIndex === null) return;

    setHoleScores((prev) =>
      prev.map((item, holeIndex) =>
        holeIndex === selectedHoleIndex
          ? {
              ...item,
              score,
              par,
            }
          : item
      )
    );

    setSelectedHoleIndex(null);
  };

  const handleRetake = () => {
    router.replace({
      pathname: "./capture",
      params: {
        holes: String(holesCount),
        shotIndex: "1",
        photos: JSON.stringify([]),
      },
    });
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const result = await submit({
        holesCount,
        courseName: "페블 비치 골프 링크스",
        playedAt: new Date().toISOString(),
        parInputEnabled,
        appliedPar: stats.appliedPar,
        totalScore: stats.totalScore,
        diff: stats.diff,
        birdieCount: stats.birdieCount,
        doubleCount: stats.doubleCount,
        holeScores: visibleHoleScores,
      });

      Alert.alert("저장 완료", `분석 결과를 저장했어요.\nID: ${result.id}`, [
        {
          text: "확인",
          onPress: () => router.replace("/(tabs)/scan"),
        },
      ]);
    } catch (error) {
      Alert.alert("저장 실패", "저장 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecreaseCoursePar = () => {
    setCoursePar((prev) => Math.max(27, prev - 1));
  };

  const handleIncreaseCoursePar = () => {
    setCoursePar((prev) => Math.min(90, prev + 1));
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.resultCard}>
        <ScrollView style={styles.mainContentScroll} contentContainerStyle={styles.mainContentScrollContent}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="chevron-left" size={moderateScale(18)} color="#B8BEC1" />
            </Pressable>
            <Text type="barlowHard" style={styles.screenTitle}>
              분석 결과
            </Text>
          </View>

          <Text type="barlowHard" style={styles.courseTitle}>
            페블 비치 골프 링크스
          </Text>
          <Text type="barlowLight" style={styles.dateText}>
            2026년 3월 28일 · {holesCount}홀
          </Text>

          <View style={[styles.courseParCard, parInputEnabled && styles.courseParCardDisabled]}>
            <View style={styles.courseParInfo}>
              <Text type="barlowLight" style={styles.courseParLabel}>
                코스 파
              </Text>
              <Text type="barlowLight" style={styles.courseParHint}>
                {parInputEnabled ? "홀별 파 사용 중" : `표준 ${holesCount}홀 기준 ${standardCoursePar}`}
              </Text>
            </View>

            <View style={styles.courseParControl}>
              <Pressable
                onPress={handleDecreaseCoursePar}
                disabled={parInputEnabled}
                style={[styles.courseParButton, parInputEnabled && styles.courseParButtonDisabled]}
              >
                <Feather name="minus" size={moderateScale(18)} color={parInputEnabled ? "#5C6366" : "#57C79A"} />
              </Pressable>

              <Text type="barlowHard" style={styles.courseParValue}>
                {stats.appliedPar}
              </Text>

              <Pressable
                onPress={handleIncreaseCoursePar}
                disabled={parInputEnabled}
                style={[styles.courseParButton, parInputEnabled && styles.courseParButtonDisabled]}
              >
                <Feather name="plus" size={moderateScale(18)} color={parInputEnabled ? "#5C6366" : "#57C79A"} />
              </Pressable>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text type="barlowHard" style={styles.summaryValuePrimary}>
                {stats.totalScore}
              </Text>
              <Text type="barlowLight" style={styles.summaryLabel}>
                스코어
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text type="barlowHard" style={styles.summaryValueDanger}>
                {diffLabel}
              </Text>
              <Text type="barlowLight" style={styles.summaryLabel}>
                ±파
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text type="barlowHard" style={styles.summaryValueSuccess}>
                {stats.birdieCount}
              </Text>
              <Text type="barlowLight" style={styles.summaryLabel}>
                버디
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text type="barlowHard" style={styles.summaryValueWarn}>
                {stats.doubleCount}
              </Text>
              <Text type="barlowLight" style={styles.summaryLabel}>
                더블
              </Text>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <Text type="barlowLight" style={styles.sectionTitle}>
            {parInputEnabled ? "홀별 파 입력 · " : "홀별 스코어 · "}
            <Text
              type="barlowHard"
              style={{
                fontSize: moderateScale(15),
                color: "white",
              }}
            >
              탭하여 수정
            </Text>
          </Text>

          <View style={styles.scoreGrid}>
            {visibleHoleScores.map((item, index) => {
              const isGood = item.score <= item.par;

              return (
                <Pressable
                  key={item.hole}
                  onPress={() => handleHolePress(index)}
                  style={[
                    styles.holeItem,
                    holesCount === 9 ? styles.holeItemNine : styles.holeItemEighteen,
                    isGood ? styles.holeItemGood : styles.holeItemNormal,
                  ]}
                >
                  <Text type="barlowLight" style={styles.holeNumber}>
                    {item.hole}
                  </Text>
                  {parInputEnabled ? (
                    <Text type="barlowHard" style={styles.holeParPrimary}>
                      p{item.par}
                    </Text>
                  ) : (
                    <Text type="barlowHard" style={[styles.holeScore, isGood ? styles.holeScoreGood : styles.holeScoreNormal]}>
                      {item.score}
                    </Text>
                  )}
                  {parInputEnabled ? (
                    <Text type="barlowLight" style={styles.holeParText}>
                      {item.score}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text type="barlowLight" style={styles.helperText}>
            탭하면 홀 상세 수정창이 열립니다
          </Text>
        </ScrollView>

        <View style={styles.bottomControls}>
          <View style={styles.sectionDivider} />

          <View style={styles.switchRow}>
            <Text type="barlowHard" style={styles.switchLabel}>
              홀별 파 수정
            </Text>
            <Switch
              value={parInputEnabled}
              onValueChange={setParInputEnabled}
              trackColor={{ false: "#2F3335", true: "#48C795" }}
              thumbColor="#EFF3F4"
            />
          </View>

          <View style={styles.bottomButtonsRow}>
            <Pressable style={styles.secondaryButton} onPress={handleRetake}>
              <Text type="barlowHard" style={styles.secondaryButtonText}>
                다시 찍기
              </Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]} onPress={handleSave}>
              <Text type="barlowHard" style={styles.primaryButtonText}>
                {isSubmitting ? "저장 중..." : "저장하기"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {selectedHole ? (
        <HoleEditorModal
          visible={selectedHoleIndex !== null}
          hole={selectedHole.hole}
          initialScore={selectedHole.score}
          initialPar={selectedHole.par}
          onClose={handleCloseHoleEditor}
          onConfirm={handleConfirmHoleEdit}
          editPar={parInputEnabled}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#090B0B",
  },
  screen: {
    flex: 1,
    backgroundColor: "#090B0B",
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(16),
  },
  topScreenLabel: {
    color: "#7B8083",
    fontSize: moderateScale(14),
    marginBottom: moderateScale(12),
    alignSelf: "center",
  },
  resultCard: {
    flex: 1,
    backgroundColor: "#090B0B",
    paddingHorizontal: moderateScale(10),
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(16),
  },
  mainContentScroll: {
    flex: 1,
  },
  mainContentScrollContent: {
    paddingBottom: moderateScale(10),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginBottom: moderateScale(14),
  },
  backButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E2122",
  },
  screenTitle: {
    color: "#F4F6F7",
    fontSize: moderateScale(20),
  },
  aiBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    borderRadius: moderateScale(40),
    borderWidth: 1,
    borderColor: "#2A7D5D",
    backgroundColor: "#12382D",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
  },
  aiDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#46D49A",
  },
  aiBadgeText: {
    color: "#46D49A",
    fontSize: moderateScale(12),
  },
  courseTitle: {
    color: "#F4F6F7",
    fontSize: moderateScale(26),
    marginTop: moderateScale(14),
  },
  dateText: {
    color: "#80878B",
    fontSize: moderateScale(14),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(14),
  },
  courseParCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#2C3133",
    backgroundColor: "#161A1B",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    marginBottom: moderateScale(12),
  },
  courseParCardDisabled: {
    opacity: 0.45,
  },
  courseParInfo: {
    gap: moderateScale(4),
  },
  courseParLabel: {
    color: "#788083",
    fontSize: moderateScale(13),
  },
  courseParHint: {
    color: "#626A6D",
    fontSize: moderateScale(11),
  },
  courseParControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  courseParButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2425",
  },
  courseParButtonDisabled: {
    backgroundColor: "#1A1D1E",
  },
  courseParValue: {
    color: "#57C79A",
    fontSize: moderateScale(40),
    minWidth: moderateScale(52),
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  summaryItem: {
    width: "23%",
    alignItems: "center",
    borderRadius: moderateScale(14),
    backgroundColor: "#1A1E1F",
    borderWidth: 1,
    borderColor: "#2C3032",
    paddingVertical: moderateScale(10),
    gap: moderateScale(2),
  },
  summaryValuePrimary: {
    color: "#57C79A",
    fontSize: moderateScale(20),
  },
  summaryValueDanger: {
    color: "#FF4D4D",
    fontSize: moderateScale(20),
  },
  summaryValueSuccess: {
    color: "#4FD18E",
    fontSize: moderateScale(20),
  },
  summaryValueWarn: {
    color: "#F5C048",
    fontSize: moderateScale(20),
  },
  summaryLabel: {
    color: "#828A8D",
    fontSize: moderateScale(11),
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#1F2425",
    marginVertical: moderateScale(12),
  },
  sectionTitle: {
    color: "#8B9396",
    fontSize: moderateScale(15),
    marginBottom: moderateScale(10),
  },
  scoreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    columnGap: moderateScale(8),
    rowGap: moderateScale(8),
  },
  holeItem: {
    minHeight: moderateScale(66),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(6),
    gap: moderateScale(1),
  },
  holeItemNine: {
    width: "22%",
  },
  holeItemEighteen: {
    width: "22%",
  },
  holeItemNormal: {
    backgroundColor: "#1D2223",
    borderColor: "#2A3133",
  },
  holeItemGood: {
    backgroundColor: "#13382C",
    borderColor: "#1E604A",
  },
  holeNumber: {
    color: "#7A8387",
    fontSize: moderateScale(10),
  },
  holeScore: {
    fontSize: moderateScale(22),
  },
  holeScoreNormal: {
    color: "#C1C7C8",
  },
  holeScoreGood: {
    color: "#5DCE9F",
  },
  holeParPrimary: {
    color: "#7BE3B8",
    fontSize: moderateScale(20),
  },
  holeParText: {
    color: "#8DA8A0",
    fontSize: moderateScale(10),
  },
  helperText: {
    minHeight: moderateScale(18),
    color: "#6E7679",
    fontSize: moderateScale(11),
    textAlign: "center",
    marginTop: moderateScale(8),
  },
  bottomControls: {
    marginTop: "auto",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  switchLabel: {
    color: "#A2AAAE",
    fontSize: moderateScale(16),
  },
  bottomButtonsRow: {
    flexDirection: "row",
    gap: moderateScale(10),
  },
  secondaryButton: {
    flex: 0.38,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#2C3133",
    backgroundColor: "#0C1011",
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(58),
  },
  secondaryButtonText: {
    color: "#A2AAB0",
    fontSize: moderateScale(12),
  },
  primaryButton: {
    flex: 0.62,
    borderRadius: moderateScale(16),
    backgroundColor: "#4AB484",
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(58),
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#ECF7F1",
    fontSize: moderateScale(17),
  },
});
