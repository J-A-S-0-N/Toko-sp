import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { moderateScale } from "react-native-size-matters";

type TrendPoint = {
  label?: string;
  value: number | null;
};

type BirdieTrendGraphProps = {
  data: TrendPoint[];
  startValue: string;
  currentValue: string;
  deltaValue: string;
};

export default function BirdieTrendGraph({
  data,
  startValue,
  currentValue,
  deltaValue,
}: BirdieTrendGraphProps) {
  const chartWidth = Dimensions.get("window").width * 0.85;
  const chartAccentColor = "#45D07F";

  // Convert null values to undefined for chart library compatibility
  const chartData = data.map((d) => ({
    label: d.label,
    value: d.value === null ? undefined : d.value,
  }));

  // Compute max value for chart scaling
  const maxVal = Math.max(...data.map((d) => d.value ?? 0), 1);
  const chartMax = Math.ceil(maxVal * 1.3);

  return (
    <>
      <Text type="barlowLight" style={styles.sectionTitle}>
        버디 트렌드
      </Text>
      <View style={styles.trendCard}>
        <Text type="barlowLight" style={styles.trendMeta}>
          6개월 추이
        </Text>
        <View style={styles.chartWrap}>
          <LineChart
            data={chartData}
            yAxisLabelWidth={0}
            disableScroll
            adjustToWidth
            rulesThickness={1.2}
            hideRules={false}
            // Line
            color={chartAccentColor}
            thickness={2}
            curved={false}
            // Area fill
            areaChart
            startFillColor={chartAccentColor}
            endFillColor="#ffffff"
            startOpacity={0.4}
            endOpacity={0}
            // Dots
            dataPointsColor="rgba(69, 208, 127, 0.60)"
            dataPointsRadius={3}
            // Y-axis
            hideYAxisText
            yAxisColor="transparent"
            xAxisThickness={2}
            xAxisColor="#414141"
            noOfSections={2}
            maxValue={chartMax}
            // X-axis labels
            xAxisLabelTextStyle={{
              color: "#999",
              fontSize: moderateScale(FONT.xs),
              fontFamily: "BarlowCondensed_400Regular",
              textAlign: "center",
            }}
            yAxisTextStyle={{ color: "#999", fontSize: moderateScale(FONT.sm) }}
            // Grid
            rulesColor="#555555"
            rulesType="dotted"
            // Size
            width={chartWidth}
            height={130}
            initialSpacing={6}
            endSpacing={6}
          />
        </View>
        {/*stats*/}
        <View style={styles.statsWrap}>
          <View style={styles.statsFirstItem}>
            <Text type="barlowHard" style={styles.statsValue}>{startValue}</Text>
            <Text style={styles.statsLabel}>
              시작
            </Text>
          </View>
          <View>
            <Text type="barlowHard" style={styles.statsValueSpecial}>{currentValue}</Text>
            <Text style={styles.statsLabel}>
              현재
            </Text>
          </View>
          <View>
            <Text type="barlowHard" style={styles.statsValueSpecial}>{deltaValue}</Text>
            <Text style={styles.statsLabel}>
              차이
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.sm),
    letterSpacing: 1.2,
    marginBottom: moderateScale(5),
  },
  trendCard: {
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#2B3230",
    padding: moderateScale(16),
    overflow: "hidden",
  },
  trendMeta: {
    color: "#ffffff",
    letterSpacing: 1.2,
    fontSize: moderateScale(FONT.sm),
  },
  chartWrap: {
    alignSelf: "center",
    marginHorizontal: moderateScale(10),
    paddingHorizontal: moderateScale(4),
  },
  statsWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: moderateScale(8),
    paddingHorizontal: moderateScale(2),
  },
  statsFirstItem: {
    alignItems: "center",
  },
  statsValue: {
    color: "#9B9C9B",
    fontSize: moderateScale(FONT.xxl),
  },
  statsValueSpecial: {
    color: "#45D07F",
    fontSize: moderateScale(FONT.xxl),
  },
  statsLabel: {
    color: "#6E7271",
    fontSize: moderateScale(FONT.xs),
  },
});
