import { ThemedText as Text } from "@/components/themed-text";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { moderateScale } from "react-native-size-matters";

type GraphStatProps = {
  headlineDelta: string;
  trendLabels: string[];
};

const data = [
  { label: "1월", value: 12 },
  { value: 18 }, { value: 15 }, { value: 19 }, { value: 20 },
  { label: "2월", value: 17 },
  { value: 21 }, { value: 22 }, { value: 20 }, { value: 23 },
  { label: "3월", value: 22 },
  { value: 24 }, { value: 21 }, { value: 25 },
  { label: "4월", value: 18 },
  { value: 26 }, { value: 28 }, { value: 27 }, { value: 29 },
  { label: "5월", value: 25 },
  { value: 30 }, { value: 31 }, { value: 32 }, { value: 37 },
];


export default function HandiCapGraph({ headlineDelta, trendLabels }: GraphStatProps) {
  const chartWidth = Dimensions.get("window").width * 0.85;
  const chartAccentColor = "#3CC06E";
  const chartAccentGlow = "#3CC06E";
  //const [graphData, setGraphData] =  useState();
  
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
    <>
      <Text type="barlowLight" style={styles.sectionTitle}>
        핸디캡 트렌드
      </Text>
      <View style={styles.trendCard}>
        <Text type="barlowLight" style={styles.trendMeta}>
          7개월 추이
        </Text>
        {/*
        <Text type="barlowHard" style={styles.trendHeadline}>
          {headlineDelta}
        </Text>
        */}
        <View style={styles.chartWrap}>
          <LineChart
          hideDataPoints
            data={data}
            yAxisLabelWidth={0}
            disableScroll
            adjustToWidth
            rulesThickness={2}
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
              fontSize: 14,
              fontFamily: "BarlowCondensed_400Regular",
              width: 28,
              textAlign: "center",
            }}
            yAxisTextStyle={{ color: "#999", fontSize: 14 }}
            // Grid
            rulesColor="#414141"
            rulesType="solid"
            // Size
            width={chartWidth}
            height={130}
            initialSpacing={10}
          />
        </View>
        {/*stats*/}
        <View
          style={styles.statsWrap}
        >
          <View style={styles.statsFirstItem}>
            <Text type="barlowHard" style={styles.statsValue}>8.5</Text>
            <Text style={styles.statsLabel}>
              시작
            </Text>
          </View>
          <View>
            <Text type="barlowHard" style={styles.statsValueSpecial}>6.7</Text>
            <Text style={styles.statsLabel}>
              현제
            </Text>
          </View>
          <View>
            <Text type="barlowHard" style={styles.statsValueSpecial}>-1.3</Text>
            <Text style={styles.statsLabel}>
              차이
            </Text>
          </View>
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
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#6F7775",
    fontSize: moderateScale(16),
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
    fontSize: moderateScale(16),
  },
  trendHeadline: {
    color: "#4DAE82",
    fontSize: moderateScale(33),
  },
  trendSub: {
    color: "#7E8784",
    fontSize: moderateScale(15),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(8),
  },
  chartWrap: {
    alignSelf: "center",
    marginHorizontal: moderateScale(10),
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
    fontSize: moderateScale(27),
  },
  statsValueSpecial: {
    color: "#3CC06E",
    fontSize: moderateScale(27),
  },
  statsLabel: {
    color: "#6E7271",
    fontSize: moderateScale(17),
  },
  chartLabelsRow: {
    marginTop: moderateScale(8),
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(2),
  },
  chartLabel: {
    color: "#6F7775",
    fontSize: moderateScale(13),
  },
});
