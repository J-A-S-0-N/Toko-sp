import GraphStat from "@/components/StatPageComponents/graphStat";
import HandiCapGraph from "@/components/StatPageComponents/handiCapGraph";
import HitProgressBar from "@/components/StatPageComponents/hitProgressBar";
import LatestPool from "@/components/StatPageComponents/LatestPoll";
import ParAnalysis from "@/components/StatPageComponents/parAnalysis";
import ScoreDistribution from "@/components/StatPageComponents/scoreDistribution";
import StatPageSkeleton from "@/components/StatPageComponents/StatPageSkeleton";
import StreakCard from "@/components/StatPageComponents/StreakCard";
import { ThemedText as Text } from "@/components/themed-text";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

const TREND = [
  { month: "8월", value: 85 },
  { month: "9월", value: 82 },
  { month: "10월", value: 80 },
  { month: "11월", value: 83 },
  { month: "12월", value: 79 },
  { month: "1월", value: 81 },
  { month: "2월", value: 78 },
];

const ROUND_STATS = [
  { label: "라운드당 버디", value: 1.8, max: 3, color: "#45D07F" },
  { label: "라운드당 파", value: 8.3, max: 15, color: "#B7BCB9" },
  { label: "라운드당 보기", value: 6.9, max: 12, color: "#55BE96" },
  { label: "라운드당 더블보기+", value: 1.0, max: 5, color: "#FF4F5F" },
];

/*
const data = TREND.map((point, index) => ({
  x: index + 1,
  y: point.value,
}));
*/
const data = [
  { value: 0.032 },
  { value: 0.055 },
  { value: 0.048 },
  { value: 0.064 },
  { value: 0.038 },
  { value: 0.030 },
  { value: 0.017 },
  { value: 0.025 },
];

export default function StatsScreen() {
  const trendLabels = TREND.map((point) => point.month);

  const firstScore = TREND[0]?.value ?? 0;
  const lastScore = TREND[TREND.length - 1]?.value ?? 0;
  const totalDelta = lastScore - firstScore;
  const headlineDelta = `${totalDelta > 0 ? "+" : ""}${totalDelta}타`;

  const [showSkeleton, setShowSkeleton] = useState(true);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) {
      setShowSkeleton(false);
      return;
    }
    hasLoaded.current = true;

    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {showSkeleton ? (
        <Animated.View
          exiting={FadeOut.duration(400)}
          style={styles.skeletonContainer}
        >
          <StatPageSkeleton />
        </Animated.View>
      ) : (
      <Animated.ScrollView
        entering={FadeIn.duration(400)}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>내 통계</Text>
          </View>
        </View>

        <View style={{ marginBottom: moderateScale(15) }}>
          <GraphStat headlineDelta={headlineDelta} trendLabels={trendLabels} />
        </View>

        <StreakCard />

        <View style={{ marginBottom: moderateScale(15) }}>
          <ParAnalysis/>
        </View>

        <View style={{ marginBottom: moderateScale(15) }}>
          <ScoreDistribution />
        </View>

        <View
          style={{marginBottom: moderateScale(15)}}
        >
          <HandiCapGraph headlineDelta={headlineDelta} trendLabels={trendLabels} />
        </View>

        <View style={{marginBottom: moderateScale(15)}}>
          <LatestPool />
        </View>

        <HitProgressBar roundStats={ROUND_STATS} />
      </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  container: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  content: {
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(24),
    gap: moderateScale(12),
  },
  header: {
    marginTop: moderateScale(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  brandText: {
    color: "#E8ECEA",
    fontSize: moderateScale(29),
    letterSpacing: 0.5,
  },
  pill: {
    borderWidth: moderateScale(0.5),
    borderColor: "#353838",
    backgroundColor: "#1F2222",
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(20),
  },
  pillText: {
    //color: "#6E7171",
    color: "white",
    fontSize: moderateScale(16),
  },
  sectionLabel: {
    marginTop: moderateScale(5),
    color: "#6F7775",
    fontSize: moderateScale(23),
    letterSpacing: 1.3,
  },
  chartContainer: {
    height: moderateScale(110),
    paddingBottom: 10,
    borderRadius: moderateScale(14),
    //backgroundColor: "#151919",
    //borderWidth: 1,
    //borderColor: "#28302E",
    paddingHorizontal: moderateScale(8),
    paddingTop: moderateScale(4),
  },
  chartWrap: {
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  chart: {
    borderRadius: moderateScale(16),
  },
  valueLabel: {
    color: "#8C9492",
    fontSize: moderateScale(15),
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(10),
    paddingTop: moderateScale(4),
  },
});
