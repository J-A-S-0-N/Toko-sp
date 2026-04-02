import { ThemedText as Text } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const WeatherSummaryComponent = () => {
  return (
    <LinearGradient
      colors={["#091528", "#0B1E36", "#102A48"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.leftContent}>
        <Text style={styles.headerLabel}>오늘의 날씨 · 서울</Text>

        <View style={styles.tempRow}>
          <Ionicons name="sunny" size={moderateScale(28)} color="#F9C94D" />
          <Text type="barlowHard" style={styles.tempValue}>
            18°C
          </Text>
        </View>

        <Text style={styles.detailText}>맑음 · 바람 12km/h · 습도 45%</Text>
      </View>

      <LinearGradient
        colors={["rgba(41, 168, 149, 0.24)", "rgba(32, 114, 102, 0.16)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.recommendationCard}
      >
        <Text style={styles.recommendationLabel}>라운드 추천</Text>
        <Text type="barlowHard" style={styles.recommendationValue}>
          완벽한 날씨!
        </Text>
      </LinearGradient>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(16),
    borderWidth: moderateScale(0.5),
    borderColor: "#1E3556",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftContent: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  headerLabel: {
    color: "#58B9FF",
    fontSize: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  tempRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  tempValue: {
    color: "#FFFFFF",
    fontSize: moderateScale(45),
    lineHeight: moderateScale(55),
  },
  detailText: {
    marginTop: moderateScale(6),
    color: "#7F91A7",
    fontSize: moderateScale(12),
  },
  recommendationCard: {
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderWidth: moderateScale(0.5),
    borderColor: "#2C7165",
    minWidth: moderateScale(128),
    alignSelf: "stretch",
    justifyContent: "center",
  },
  recommendationLabel: {
    color: "#53D2C0",
    fontSize: moderateScale(12),
    marginBottom: moderateScale(4),
  },
  recommendationValue: {
    color: "#FFFFFF",
    fontSize: moderateScale(21),
    lineHeight: moderateScale(37),
  },
});

export default WeatherSummaryComponent;
