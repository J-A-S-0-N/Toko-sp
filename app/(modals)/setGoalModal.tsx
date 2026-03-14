import { ThemedText } from "@/components/themed-text";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

const SCORE_OPTIONS = [77, 75, 73, 70] as const;
const PERIOD_OPTIONS = ["1개월", "3개월", "6개월", "1년"] as const;

export default function SetGoalModal() {
  const [targetScore, setTargetScore] = useState<number>(75);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("3개월");

  const selectedScoreDelta = useMemo(() => targetScore - 78, [targetScore]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { backgroundColor: "#0F0F0F" }]}
      entering={FadeInDown.duration(200)}
    >
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <LinearGradient
          colors={["rgba(31,230,146,0.12)", "transparent"]}
          style={styles.screenGlow}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={moderateScale(20)} color="#FFFFFF" />
              <Text style={styles.backText}>피드</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.titleBlock}>
            <ThemedText type="barlowHard" style={styles.titleText}>목표 설정</ThemedText>
            <Text style={styles.subtitleText}>현재 평균 스코어: 78타</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>목표 스코어</Text>
            <View style={styles.scoreControlRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setTargetScore((prev) => Math.max(60, prev - 1))}
                style={styles.circleButton}
              >
                <ThemedText type="barlowLight" style={styles.circleSymbol}>-</ThemedText>
              </TouchableOpacity>

              <View style={styles.scoreCenterBlock}>
                <ThemedText type="barlowHard" style={styles.scoreValue}>{targetScore}</ThemedText>
                <Text style={styles.scoreSubText}>목표 타수</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setTargetScore((prev) => Math.min(120, prev + 1))}
                style={styles.circleButton}
              >
                <ThemedText type="barlowLight" style={styles.circleSymbol}>+</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.optionRow}>
              {SCORE_OPTIONS.map((score) => {
                const selected = score === targetScore;
                return (
                  <TouchableOpacity
                    key={score}
                    onPress={() => setTargetScore(score)}
                    activeOpacity={0.85}
                    style={[styles.optionChip, selected && styles.optionChipActive]}
                  >
                    <ThemedText type="barlowLight" style={[styles.optionChipText, selected && styles.optionChipTextActive]}>
                      {score}타
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <LinearGradient
            colors={["#042717", "#06331D", "#0D4628"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultCard}
          >
            <Text style={styles.resultTitle}>목표 달성 시</Text>
            <View style={styles.resultStatsRow}>
              <View style={styles.resultStatItem}>
                <ThemedText type="barlowHard" style={styles.resultValueGreen}>
                  {selectedScoreDelta > 0 ? `+${selectedScoreDelta}` : `${selectedScoreDelta}`}타
                </ThemedText>
                <Text style={styles.resultLabel}>개선 목표</Text>
              </View>

              <View style={styles.resultDivider} />

              <View style={styles.resultStatItem}>
                <ThemedText type="barlowHard" style={styles.resultValueAmber}>80s</ThemedText>
                <Text style={styles.resultLabel}>달성 레벨</Text>
              </View>

              <View style={styles.resultDivider} />

              <View style={styles.resultStatItem}>
                <ThemedText type="barlowHard" style={styles.resultValueWhite}>{selectedPeriod}</ThemedText>
                <Text style={styles.resultLabel}>목표 기간</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>목표 기간</Text>
            <View style={styles.optionRow}>
              {PERIOD_OPTIONS.map((period) => {
                const selected = period === selectedPeriod;
                return (
                  <TouchableOpacity
                    key={period}
                    onPress={() => setSelectedPeriod(period)}
                    activeOpacity={0.85}
                    style={[styles.optionChip, selected && styles.periodChipActive]}
                  >
                    <ThemedText type="barlowLight" style={[styles.optionChipText, selected && styles.optionChipTextActive]}>
                      {period}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85}>
            <ThemedText type="barlowLight" style={styles.saveButtonText}>목표 저장하기</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  screenGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(300),
  },
  scrollContent: {
    paddingHorizontal: moderateScale(12),
    paddingBottom: moderateScale(34),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(4),
    marginBottom: moderateScale(24),
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(2),
  },
  backText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
  },
  titleBlock: {
    marginBottom: moderateScale(20),
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    //lineHeight: moderateScale(24),
  },
  subtitleText: {
    marginTop: moderateScale(6),
    fontSize: moderateScale(14),
    color: "#767D7A",
  },
  card: {
    backgroundColor: "#1B1F1F",
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#2A2F2F",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginBottom: moderateScale(14),
  },
  cardLabel: {
    color: "#757C79",
    fontSize: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  scoreControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  circleButton: {
    width: moderateScale(58),
    height: moderateScale(58),
    borderRadius: moderateScale(32),
    borderWidth: 1,
    borderColor: "#303737",
    backgroundColor: "#2A2F2F",
    justifyContent: "center",
    alignItems: "center",
  },
  circleSymbol: {
    fontSize: moderateScale(30),
    color: "#F0F3F2",
    lineHeight: moderateScale(36),
  },
  scoreCenterBlock: {
    alignItems: "center",
  },
  scoreValue: {
    fontSize: moderateScale(70),
    lineHeight: moderateScale(95),
    color: "#53D39A",
  },
  scoreSubText: {
    marginTop: moderateScale(2),
    fontSize: moderateScale(12),
    color: "#7A827E",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },
  optionChip: {
    flex: 1,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#343A3A",
    backgroundColor: "#252A2A",
    paddingVertical: moderateScale(10),
    alignItems: "center",
  },
  optionChipActive: {
    backgroundColor: "#53C998",
    borderColor: "#53C998",
  },
  periodChipActive: {
    borderColor: "#53C998",
    backgroundColor: "#2E4A3E",
  },
  optionChipText: {
    color: "#9AA19E",
    fontSize: moderateScale(15),
  },
  optionChipTextActive: {
    color: "#EFFCF5",
  },
  resultCard: {
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#1E5D3F",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginBottom: moderateScale(14),
  },
  resultTitle: {
    color: "#49CA90",
    fontSize: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  resultStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultStatItem: {
    flex: 1,
    alignItems: "center",
  },
  resultDivider: {
    width: 1,
    height: moderateScale(50),
    backgroundColor: "#18603E",
  },
  resultValueGreen: {
    color: "#53D39A",
    fontSize: moderateScale(28),
    lineHeight: moderateScale(30),
  },
  resultValueAmber: {
    color: "#F3A63F",
    fontSize: moderateScale(28),
    lineHeight: moderateScale(30),
  },
  resultValueWhite: {
    color: "#FFFFFF",
    fontSize: moderateScale(28),
    lineHeight: moderateScale(30),
  },
  resultLabel: {
    marginTop: moderateScale(4),
    color: "#7F8B85",
    fontSize: moderateScale(12),
  },
  saveButton: {
    marginTop: moderateScale(20),
    borderRadius: moderateScale(18),
    backgroundColor: "#4CAF82",
    minHeight: moderateScale(68),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#57C798",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  saveButtonText: {
    color: "#F4FFF9",
    fontSize: moderateScale(15),
  },
});