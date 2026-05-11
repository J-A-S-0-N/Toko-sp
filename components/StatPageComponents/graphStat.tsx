import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { moderateScale } from "react-native-size-matters";

type TrendPoint = {
  label: string;
  value: number | null;
};

type GraphStatProps = {
  headlineDelta: string;
  trendLabels: string[];
  startValue: string;
  currentValue: string;
  data: TrendPoint[];
};

export default function GraphStat({
  headlineDelta,
  trendLabels,
  startValue,
  currentValue,
  data,
}: GraphStatProps) {
  const chartWidth = Dimensions.get("window").width * 0.85;
  const chartAccentColor = "#3CC06E";
  const chartAccentGlow = "#3CC06E";

  // Convert null values to undefined for chart library compatibility
  const chartData = data.map((d) => ({
    label: d.label,
    value: d.value === null ? undefined : d.value,
  }));
  
  /*
  not used right now 

  useEffect(() => {
    const valueShifting = () => {
      let lowest = Infinity;
      for (let i = 0; i < data.length; i++) {
        if (data[i].value < lowest) {
          lowest = data[i].value;
        }
      }

      for (let i = 0; i < data.length; i++) {
        data[i].value -= (lowest+1);
      }
    };

    valueShifting();
  }, [])
  */

  return (
    <View style={styles.container}>
      <Text type="barlowLight" style={styles.sectionTitle}>
        스코어 트렌드
      </Text>
      <View style={styles.trendCard}>
        <View style={styles.headerRow}>
          <View>
            <Text type="barlowMedium" style={styles.trendHeadline}>
              {headlineDelta}
            </Text>
            <Text type="barlowLight" style={styles.trendMeta}>
              6개월 추이
            </Text>
          </View>
          <View>
            <Text type="barlowLight" style={styles.trendSub}>2025년 8월 이후</Text>
            <View style={styles.rightStatsRow}>
              <View style={styles.rightStatItem}>
                <Text type="barlowHard" style={styles.rightStatValueMuted}>{startValue}</Text>
                <Text type="barlowLight" style={styles.rightStatLabel}>시작</Text>
              </View>
              <View style={styles.rightStatItem}>
                <Text type="barlowHard" style={styles.rightStatValueActive}>{currentValue}</Text>
                <Text type="barlowLight" style={styles.rightStatLabel}>현재</Text>
              </View>
            </View>
          </View>
        </View>
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
            startFillColor={chartAccentGlow}
            endFillColor="#ffffff"
            startOpacity={0.4}
            endOpacity={0}
            // Dots
            dataPointsColor="rgba(60, 192, 110, 0.60)"
            dataPointsRadius={3}
            // Y-axis (right side)
            hideYAxisText
            yAxisLabelSuffix=" mi"
            yAxisColor="transparent"
            xAxisThickness={2}
            xAxisColor="#414141"
            noOfSections={2}
            maxValue={37}
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
        {/*
        <View style={styles.chartLabelsRow}>
          {trendLabels.map((label) => (
            <Text key={label} style={styles.chartLabel}>
              {label}
            </Text>
          ))}
        </View>
        */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: moderateScale(8),
  },
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
    color: "#7E8784",
    letterSpacing: 1.2,
    fontSize: moderateScale(FONT.xs),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  trendHeadline: {
    color: "#4DAE82",
    fontSize: moderateScale(FONT.xxl),
    letterSpacing: 2,
  },
  trendSub: {
    color: "#7E8784",
    fontSize: moderateScale(FONT.xs),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(4),
    textAlign: "right",
  },
  rightStatsRow: {
    flexDirection: "row",
    columnGap: moderateScale(20),
    justifyContent: "flex-end",
  },
  rightStatItem: {
    alignItems: "center",
  },
  rightStatValueMuted: {
    color: "#9B9C9B",
    fontSize: moderateScale(FONT.xl),
    lineHeight: moderateScale(26),
  },
  rightStatValueActive: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.xl),
    lineHeight: moderateScale(26),
  },
  rightStatLabel: {
    color: "#7E8784",
    fontSize: moderateScale(FONT.xs),
  },
  chartWrap: {
    alignSelf: "center",
    marginHorizontal: moderateScale(10),
    paddingHorizontal: moderateScale(4),
  },
  chartLabelsRow: {
    marginTop: moderateScale(8),
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(2),
  },
  chartLabel: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.sm),
  },
});
