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

  const [parInputEnabled, setParInputEnabled] = useState(false);
  const [holeScores, setHoleScores] = useState(defaultHoleScores);

  const visibleHoleScores = useMemo(() => holeScores.slice(0, holesCount), [holeScores, holesCount]);

  const stats = useMemo(() => {
    const totalScore = visibleHoleScores.reduce((acc, item) => acc + item.score, 0);
    const totalPar = visibleHoleScores.reduce((acc, item) => acc + item.par, 0);
    const diff = totalScore - totalPar;
    const birdieCount = visibleHoleScores.filter((item) => item.score < item.par).length;
    const doubleCount = visibleHoleScores.filter((item) => item.score - item.par >= 2).length;

    return {
      totalScore,
      diff,
      birdieCount,
      doubleCount,
    };
  }, [visibleHoleScores]);

  const diffLabel = stats.diff > 0 ? `+${stats.diff}` : stats.diff === 0 ? "E" : String(stats.diff);

  const handleHolePress = (index: number) => {
    setHoleScores((prev) =>
      prev.map((item, holeIndex) => {
        if (holeIndex !== index) return item;

        const nextScore = item.score >= 9 ? 1 : item.score + 1;
        const nextPar = parInputEnabled ? (item.par >= 5 ? 3 : item.par + 1) : item.par;

        return {
          ...item,
          score: nextScore,
          par: nextPar,
        };
      })
    );
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

  const handleSave = () => {
    Alert.alert("저장 완료", "분석 결과를 저장했어요.", [
      {
        text: "확인",
        onPress: () => router.replace("/(tabs)/scan"),
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <Text type="barlowLight" style={styles.topScreenLabel}>
          {parInputEnabled ? "파 입력 ON" : "기본 결과"}
        </Text>

        <View style={styles.resultCard}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="chevron-left" size={moderateScale(18)} color="#B8BEC1" />
            </Pressable>
            <Text type="barlowHard" style={styles.screenTitle}>
              분석 결과
            </Text>
          </View>

          <View style={styles.aiBadge}>
            <View style={styles.aiDot} />
            <Text type="barlowHard" style={styles.aiBadgeText}>
              AI 분석 완료
            </Text>
          </View>

          <Text type="barlowHard" style={styles.courseTitle}>
            페블 비치 골프 링크스
          </Text>
          <Text type="barlowLight" style={styles.dateText}>
            2026년 3월 28일 · {holesCount}홀
          </Text>

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

          <Text type="barlowHard" style={styles.sectionTitle}>
            {parInputEnabled ? "홀별 스코어 + 파 수정" : "홀별 스코어 · 탭하여 수정"}
          </Text>

          <ScrollView style={styles.scoreGridScroll} contentContainerStyle={styles.scoreGridContent}>
            <View style={styles.scoreGrid}>
              {visibleHoleScores.map((item, index) => {
                const isGood = item.score <= item.par;

                return (
                  <Pressable
                    key={item.hole}
                    onPress={() => handleHolePress(index)}
                    style={[styles.holeItem, isGood ? styles.holeItemGood : styles.holeItemNormal]}
                  >
                    <Text type="barlowLight" style={styles.holeNumber}>
                      {item.hole}
                    </Text>
                    <Text type="barlowHard" style={[styles.holeScore, isGood ? styles.holeScoreGood : styles.holeScoreNormal]}>
                      {item.score}
                    </Text>
                    {parInputEnabled ? (
                      <Text type="barlowLight" style={styles.holeParText}>
                        p{item.par}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Text type="barlowLight" style={styles.helperText}>
            {parInputEnabled ? "탭하면 스코어·파 모두 수정 가능" : ""}
          </Text>

          <View style={styles.sectionDivider} />

          <View style={styles.switchRow}>
            <Text type="barlowHard" style={styles.switchLabel}>
              홀별 파 직접 입력
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
            <Pressable style={styles.primaryButton} onPress={handleSave}>
              <Text type="barlowHard" style={styles.primaryButtonText}>
                저장하기
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#242424",
  },
  screen: {
    flex: 1,
    backgroundColor: "#242424",
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(16),
  },
  topScreenLabel: {
    color: "#7B8083",
    fontSize: moderateScale(22),
    marginBottom: moderateScale(12),
    alignSelf: "center",
  },
  resultCard: {
    flex: 1,
    borderRadius: moderateScale(34),
    backgroundColor: "#090B0B",
    borderWidth: 1,
    borderColor: "#1C2020",
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(18),
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
    fontSize: moderateScale(44),
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
    fontSize: moderateScale(20),
  },
  courseTitle: {
    color: "#F4F6F7",
    fontSize: moderateScale(45),
    marginTop: moderateScale(14),
  },
  dateText: {
    color: "#80878B",
    fontSize: moderateScale(28),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(14),
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  summaryItem: {
    flex: 1,
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
    fontSize: moderateScale(36),
  },
  summaryValueDanger: {
    color: "#FF4D4D",
    fontSize: moderateScale(36),
  },
  summaryValueSuccess: {
    color: "#4FD18E",
    fontSize: moderateScale(36),
  },
  summaryValueWarn: {
    color: "#F5C048",
    fontSize: moderateScale(36),
  },
  summaryLabel: {
    color: "#828A8D",
    fontSize: moderateScale(20),
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#1F2425",
    marginVertical: moderateScale(12),
  },
  sectionTitle: {
    color: "#8B9396",
    fontSize: moderateScale(33),
    marginBottom: moderateScale(10),
  },
  scoreGridScroll: {
    maxHeight: moderateScale(188),
  },
  scoreGridContent: {
    paddingBottom: moderateScale(6),
  },
  scoreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: moderateScale(8),
  },
  holeItem: {
    width: "10.7%",
    minHeight: moderateScale(66),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(6),
    gap: moderateScale(1),
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
    fontSize: moderateScale(14),
  },
  holeScore: {
    fontSize: moderateScale(29),
  },
  holeScoreNormal: {
    color: "#C1C7C8",
  },
  holeScoreGood: {
    color: "#5DCE9F",
  },
  holeParText: {
    color: "#4FB485",
    fontSize: moderateScale(14),
  },
  helperText: {
    minHeight: moderateScale(18),
    color: "#6E7679",
    fontSize: moderateScale(15),
    textAlign: "center",
    marginTop: moderateScale(8),
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  switchLabel: {
    color: "#A2AAAE",
    fontSize: moderateScale(32),
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
    fontSize: moderateScale(33),
  },
  primaryButton: {
    flex: 0.62,
    borderRadius: moderateScale(16),
    backgroundColor: "#4AB484",
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(58),
  },
  primaryButtonText: {
    color: "#ECF7F1",
    fontSize: moderateScale(36),
  },
});
