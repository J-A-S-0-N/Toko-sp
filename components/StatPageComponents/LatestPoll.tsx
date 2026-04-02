import { ThemedText as Text, ThemedText } from "@/components/themed-text";
import React from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type LatestPoolItem = {
  date: string;
  progress: number;
  score: number;
  delta?: number;
};

const LATEST_POOL_DATA: LatestPoolItem[] = [
  { date: "2/22", progress: 0.26, score: 78, delta: 5 },
  { date: "2/15", progress: 0.44, score: 83, delta: -2 },
  { date: "2/8", progress: 0.37, score: 81, delta: -1 },
  { date: "2/1", progress: 0.34, score: 80, delta: 4 },
  { date: "1/25", progress: 0.47, score: 84 },
];

export default function LatestPool() {
  return (
    <View>
      <ThemedText type="barlowLight" style={styles.sectionTitle}>
        최근 폼
      </ThemedText>

      <View style={styles.card}>
        {LATEST_POOL_DATA.map((item, index) => {
          const isLast = index === LATEST_POOL_DATA.length - 1;
          const deltaText =
            item.delta === undefined ? "—" : `${item.delta > 0 ? "+" : ""}${item.delta}`;

          return (
            <View key={`${item.date}-${item.score}`}>
              <View style={styles.row}>
                <Text type="barlowLight" style={styles.date}>{item.date}</Text>

                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${item.progress * 100}%` }]} />
                </View>

                <View style={styles.rightGroup}>
                  <Text type="barlowHard" style={styles.score}>
                    {item.score}
                  </Text>
                  <Text
                    style={[
                      styles.delta,
                      item.delta === undefined
                        ? styles.deltaNeutral
                        : item.delta > 0
                          ? styles.deltaPositive
                          : styles.deltaNegative,
                    ]}
                  >
                    {deltaText}
                  </Text>
                </View>
              </View>

              {!isLast && <View style={styles.separator} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#6F7775",
    fontSize: moderateScale(16),
    letterSpacing: 1.2,
    marginBottom: moderateScale(10),
  },
  card: {
    backgroundColor: "#1F2222",
    borderWidth: 1,
    borderColor: "#2B3230",
    borderRadius: moderateScale(22),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
  },
  row: {
    minHeight: moderateScale(50),
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    width: moderateScale(52),
    color: "#76807D",
    fontSize: moderateScale(17),
  },
  barTrack: {
    flex: 1,
    height: moderateScale(5),
    borderRadius: 99,
    backgroundColor: "#333838",
    marginRight: moderateScale(12),
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "#FF4F5F",
  },
  rightGroup: {
    width: moderateScale(86),
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: moderateScale(14),
  },
  score: {
    color: "#FF4F5F",
    fontSize: moderateScale(28),
    lineHeight: moderateScale(27),
  },
  delta: {
    fontSize: moderateScale(15),
  },
  deltaPositive: {
    color: "#FF4F5F",
  },
  deltaNegative: {
    color: "#45D07F",
  },
  deltaNeutral: {
    color: "#5F6765",
  },
  separator: {
    height: 1,
    backgroundColor: "#2B3230",
  },
});