import StatAdBanner from "@/components/ads/StatAdBanner";
import BirdieTrendGraph from "@/components/StatPageComponents/BirdieTrendGraph";
import GraphStat from "@/components/StatPageComponents/graphStat";
import HeaderStatPage from "@/components/StatPageComponents/HeaderStatPage";
import HitProgressBar from "@/components/StatPageComponents/hitProgressBar";
import LatestPool from "@/components/StatPageComponents/LatestPoll";
import ParAnalysis from "@/components/StatPageComponents/parAnalysis";
import RegionRanking from "@/components/StatPageComponents/RegionRanking";
import ScoreDistribution from "@/components/StatPageComponents/scoreDistribution";
import StatPageSkeleton from "@/components/StatPageComponents/StatPageSkeleton";
import StreakCard from "@/components/StatPageComponents/StreakCard";
import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import { useComputedStats } from '@/hooks/useComputedStats';
import { useRounds } from '@/hooks/useRounds';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

export default function StatsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { rounds, loading: roundsLoading } = useRounds();
  const { stats, trend, birdieTrend, parAnalysis, scoreDistribution, perRoundStats } = useComputedStats(rounds);

  // Compute headline delta from trend
  const trendData = trend.map((t) => ({ label: t.month, value: t.value }));
  const firstScore = trend[0]?.value ?? 0;
  const lastScore = trend[trend.length - 1]?.value ?? 0;
  const totalDelta = lastScore - firstScore;
  const headlineDelta = `${totalDelta > 0 ? "+" : ""}${totalDelta}타`;

  // Compute birdie trend stats
  const birdieData = birdieTrend.map((t) => ({ label: t.month, value: t.value }));
  const firstBirdies = birdieTrend[0]?.value ?? 0;
  const lastBirdies = birdieTrend[birdieTrend.length - 1]?.value ?? 0;
  const birdieDelta = lastBirdies - firstBirdies;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {roundsLoading ? (
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
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + moderateScale(48) }]}
      >
        <View>
          <View style={styles.header}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>내 통계</Text>
            </View>
          </View>

          <HeaderStatPage />
        </View>

        <RegionRanking />

        <GraphStat
          headlineDelta={headlineDelta}
          trendLabels={trend.map(t => t.month)}
          startValue={firstScore.toFixed(1)}
          currentValue={lastScore.toFixed(1)}
          data={trendData}
        />

        <StreakCard
          currentStreak={stats.currentStreak}
          longestStreak={stats.longestStreak}
        />

        <StatAdBanner />

        <ParAnalysis data={parAnalysis} />

        <ScoreDistribution items={scoreDistribution} />

        <StatAdBanner />

        <BirdieTrendGraph
          data={birdieData}
          startValue={String(firstBirdies)}
          currentValue={String(lastBirdies)}
          deltaValue={`${birdieDelta > 0 ? "+" : ""}${birdieDelta}`}
        />

        <LatestPool />

        <HitProgressBar roundStats={perRoundStats} />
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
    gap: moderateScale(25),
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
    fontSize: moderateScale(FONT.xxl),
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
    fontSize: moderateScale(FONT.xs),
  },
  sectionLabel: {
    marginTop: moderateScale(5),
    color: "#6F7775",
    fontSize: moderateScale(FONT.xl),
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
    fontSize: moderateScale(FONT.sm),
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(10),
    paddingTop: moderateScale(4),
  },
});
