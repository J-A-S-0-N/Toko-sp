import { ThemedText as Text } from "@/components/themed-text";
import React from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type ParItem = {
  parLabel: string;
  average: number;
  delta: number;
  valueColor: string;
};

const PAR_ANALYSIS_DATA: ParItem[] = [
  { parLabel: "파 3", average: 3.2, delta: 0.2, valueColor: "#45D07F" },
  { parLabel: "파 4", average: 4.6, delta: 0.6, valueColor: "#55BE96" },
  { parLabel: "파 5", average: 5.4, delta: 0.4, valueColor: "#F2C233" },
];

export default function ParAnalysis() {
  return (
    <View style={styles.container}>
      <Text type="barlowLight" style={styles.sectionTitle}>
        파 분석
      </Text>

      <View style={styles.cardsRow}>
        {PAR_ANALYSIS_DATA.map((item) => (
          <View key={item.parLabel} style={styles.card}>
            <Text type="barlowLight" style={styles.parLabel}>
              {item.parLabel}
            </Text>
            <Text type="barlowHard" style={[styles.averageValue, { color: item.valueColor }]}>
              {item.average.toFixed(1)}
            </Text>
            <Text type="barlowLight" style={[styles.deltaText, { color: item.valueColor }]}>
              +{item.delta.toFixed(1)} 평균
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  sectionTitle: {
    color: "#6F7775",
    fontSize: moderateScale(13),
    letterSpacing: 1,
    marginBottom: moderateScale(12),
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },
  card: {
    flex: 1,
    backgroundColor: "#1F2222",
    borderWidth: 1,
    borderColor: "#2B3230",
    borderRadius: moderateScale(28),
    //minHeight: moderateScale(138),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(14),
    gap: moderateScale(4),
  },
  parLabel: {
    //color: "#6F7775",
    color: "#ffffff",
    fontSize: moderateScale(14),
    letterSpacing: 0.8,
  },
  averageValue: {
    fontSize: moderateScale(30),
    //lineHeight: moderateScale(64),
    paddingVertical: moderateScale(4),
  },
  deltaText: {
    fontSize: moderateScale(13),
    letterSpacing: 0.4,
  },
});
