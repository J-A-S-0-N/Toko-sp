import { ThemedText as Text } from "@/components/themed-text";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import { CartesianChart, Line } from "victory-native";

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

const data = TREND.map((point, index) => ({
  x: index + 1,
  y: point.value,
}));

export default function StatsScreen() {
  const { width } = useWindowDimensions();

  const screenPadding = moderateScale(10);
  const cardPadding = moderateScale(16);
  const chartWidth = width - screenPadding * 2 - cardPadding * 2;

  //const chartWidth = Math.max(290, width - moderateScale(0));

  const chartHeight = moderateScale(180);
  const trendValues = TREND.map((point) => point.value);
  const trendLabels = TREND.map((point) => point.month);

  const firstScore = TREND[0]?.value ?? 0;
  const lastScore = TREND[TREND.length - 1]?.value ?? 0;
  const totalDelta = lastScore - firstScore;
  const headlineDelta = `${totalDelta > 0 ? "+" : ""}${totalDelta}타`;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          {/*
          <View style={styles.brandRow}>
            <Ionicons name="flag-outline" size={moderateScale(18)} color="#49D39A" />
            <Text type="barlowHard" style={styles.brandText}>
              CADDIE
            </Text>
          </View>
          */}
          <View style={styles.pill}>
            <Text style={styles.pillText}>내 통계</Text>
          </View>
        </View>

        <Text type="barlowLight" style={styles.sectionLabel}>
          스코어 변화
        </Text>

        <View style={styles.trendCard}>
          <Text type="barlowLight" style={styles.trendMeta}>
            7개월 추이
          </Text>
          <Text type="barlowHard" style={styles.trendHeadline}>
            {headlineDelta}
          </Text>
          <Text style={styles.trendSub}>2025년 8월 이후</Text>
          <View style={styles.chartContainer}>
            <CartesianChart 
              data={data} 
              xKey="x" 
              yKeys={["y"]}
            >
            {({ points }) => (
              <>
                <Line points={points.y} color="rgba(69,208,127,0.28)" strokeWidth={8} />
                <Line points={points.y} color="#45D07F" strokeWidth={3} />
              </>
            )}
          </CartesianChart>

          </View>
          <View style={styles.chartLabelsRow}>
            {trendLabels.map((label) => (
              <Text key={label} style={styles.chartLabel}>
                {label}
              </Text>
            ))}
          </View>
          {/*
          <View style={[styles.chartWrap, { height: chartHeight, width: chartWidth }]}>
          </View>
          */}
        </View>

        {ROUND_STATS.map((stat) => {
          const progress = Math.max(0, Math.min(1, stat.value / stat.max));

          return (
            <View
              key={stat.label}
              style={styles.metricCard}
            >
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>{stat.label}</Text>
                <Text type="barlowHard" style={[styles.metricValue, { color: stat.color }]}>
                  {stat.value.toFixed(1)}
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: stat.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#07090A",
  },
  container: {
    flex: 1,
    backgroundColor: "#07090A",
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
    fontSize: moderateScale(26),
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
    color: "#6E7171",
    fontSize: moderateScale(11),
  },
  sectionLabel: {
    marginTop: moderateScale(5),
    color: "#6F7775",
    fontSize: moderateScale(20),
    letterSpacing: 1.3,
  },
  trendCard: {
    backgroundColor: "#1E2222",
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#2B3230",
    padding: moderateScale(16),
    overflow: "hidden",
  },
  trendMeta: {
    color: "#7A8380",
    letterSpacing: 1.2,
    fontSize: moderateScale(15),
  },
  trendHeadline: {
    color: "#45D07F",
    fontSize: moderateScale(35),
  },
  trendSub: {
    color: "#7E8784",
    fontSize: moderateScale(12),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(8),
  },
  chartContainer: {
    height: moderateScale(130),
    borderRadius: moderateScale(14),
    backgroundColor: "#151919",
    borderWidth: 1,
    borderColor: "#28302E",
    paddingHorizontal: moderateScale(8),
    paddingTop: moderateScale(4),
  },
  chartLabelsRow: {
    marginTop: moderateScale(8),
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(2),
  },
  chartLabel: {
    color: "#6F7775",
    fontSize: moderateScale(10),
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
    fontSize: moderateScale(12),
  },
  metricCard: {
    backgroundColor: "#1E2222",
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#2B3230",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  metricLabel: {
    color: "#8A9290",
    fontSize: moderateScale(14),
  },
  metricValue: {
    fontSize: moderateScale(18),
  },
  track: {
    height: 5,
    borderRadius: 99,
    backgroundColor: "#313735",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 99,
  },
});
