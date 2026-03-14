import { ThemedText } from "@/components/themed-text";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const WeeklySummaryComponent = () => {
  return (
    <LinearGradient
      colors={["#082017", "#062016", "#0E2E20"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerLabel}>이번 주 요약</Text>
          <ThemedText type="barlowHard" style={styles.weekRange}>
            2월 17일 - 23일
          </ThemedText>
        </View>

        <View style={styles.deltaBadge}>
          <ThemedText type="barlowLight" style={styles.deltaBadgeText}>
            ↑ 2.5타
          </ThemedText>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText type="barlowHard" style={styles.statValue}>
            2
          </ThemedText>
          <Text style={styles.statLabel}>라운드</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.statItem}>
          <ThemedText type="barlowHard" style={styles.statValue}>
            79.5
          </ThemedText>
          <Text style={styles.statLabel}>평균</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.statItem}>
          <ThemedText type="barlowHard" style={styles.statValueAccent}>
            78
          </ThemedText>
          <Text style={styles.statLabel}>최고</Text>
        </View>

        <View style={styles.separator} />

        <View style={[styles.statItem, styles.comparisonStatItem]}>
          <ThemedText type="barlowHard" style={styles.statValueAccentKor}>
            {"지난주\n대비"}
          </ThemedText>
          <Text style={styles.statLabel}>-2.5타</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(18),
    borderWidth: moderateScale(0.5),
    borderColor: "#1F5A40",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLabel: {
    color: "#53D39A",
    fontSize: moderateScale(11),
    marginBottom: moderateScale(6),
  },
  weekRange: {
    color: "#FFFFFF",
    fontSize: moderateScale(23),
    lineHeight: moderateScale(30),
  },
  deltaBadge: {
    backgroundColor: "#174D37",
    borderColor: "#2C7453",
    borderWidth: moderateScale(0.5),
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
  },
  deltaBadgeText: {
    color: "#56E6A5",
    fontSize: moderateScale(15),
    lineHeight: moderateScale(18),
  },
  statsRow: {
    marginTop: moderateScale(16),
    flexDirection: "row",
    alignItems: "stretch",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  comparisonStatItem: {
    flex: 1.15,
    minWidth: moderateScale(50),
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: moderateScale(25),
    lineHeight: moderateScale(30),
  },
  statValueAccent: {
    color: "#45DB96",
    fontSize: moderateScale(25),
    lineHeight: moderateScale(30),
  },
  statValueAccentKor: {
    color: "#45DB96",
    fontSize: moderateScale(18),
    lineHeight: moderateScale(22),
  },
  statLabel: {
    marginTop: moderateScale(4),
    color: "#83968C",
    fontSize: moderateScale(11),
  },
  separator: {
    width: moderateScale(1),
    backgroundColor: "#245740",
    marginHorizontal: moderateScale(8),
  },
});

export default WeeklySummaryComponent;
