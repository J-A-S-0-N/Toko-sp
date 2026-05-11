import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import React from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type ScoreCountItem = {
  label: string;
  count: number;
  prevMonthCount: number;
  delta: number;
  valueColor: string;
};

interface ParAnalysisProps {
  data: ScoreCountItem[];
}

export default function ParAnalysis({ data }: ParAnalysisProps) {
  return (
    <View style={styles.container}>
      <Text type="barlowLight" style={styles.sectionTitle}>
        스코어 분석 (전 월대비)
      </Text>

      <View style={styles.cardsRow}>
        {data.map((item) => (
          <View key={item.label} style={styles.card}>
            <Text type="barlowLight" style={styles.parLabel}>
              {item.label}
            </Text>
            <Text type="barlowHard" style={[styles.countValue, { color: item.valueColor }]}>
              {item.count}
            </Text>
            <Text type="barlowLight" style={[styles.deltaText, { color: item.delta >= 0 ? '#45D07F' : '#FF4F5F' }]}>
              {item.delta > 0 ? `+${item.delta}` : item.delta}
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
    fontSize: moderateScale(FONT.sm),
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
    borderRadius: moderateScale(20),
    //minHeight: moderateScale(138),
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(14),
    gap: moderateScale(4),
  },
  parLabel: {
    //color: "#6F7775",
    color: "#ffffff",
    fontSize: moderateScale(FONT.sm),
    letterSpacing: 0.8,
  },
  countValue: {
    fontSize: moderateScale(FONT.xxl),
    paddingVertical: moderateScale(4),
  },
  deltaText: {
    fontSize: moderateScale(FONT.sm),
    letterSpacing: 0.4,
  },
});
