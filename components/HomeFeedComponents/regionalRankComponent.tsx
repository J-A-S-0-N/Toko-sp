import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import { View, StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";

const RegionalRankComponent = () => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text type="barlowHard" style={styles.title}>평택 지역 1위</Text>
        <View style={styles.badge}>
          <Text type="barlowHard" style={styles.badgeText}>TOP 100%</Text>
        </View>
      </View>

      <View style={styles.progressBarTrack}>
        <View style={styles.progressBarFill} />
      </View>

      <Text type="barlowLight" style={styles.subtitle}>현재 지역 내 최고 순위를 기록 중입니다</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(18),
    borderWidth: moderateScale(0.5),
    borderColor: "#1F5A40",
    backgroundColor: "#080F0C",
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(18),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  title: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.lg),
  },
  badge: {
    borderRadius: moderateScale(999),
    borderWidth: moderateScale(1),
    borderColor: "#1F5A40",
    backgroundColor: "#0A1F16",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
  },
  badgeText: {
    color: "#49C895",
    fontSize: moderateScale(FONT.xs),
  },
  progressBarTrack: {
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: "#1A2E24",
    overflow: "hidden",
    marginBottom: moderateScale(12),
  },
  progressBarFill: {
    height: "100%",
    width: "100%",
    borderRadius: moderateScale(3),
    backgroundColor: "#49C895",
  },
  subtitle: {
    color: "#7A8E85",
    fontSize: moderateScale(FONT.xxs),
  },
});

export default RegionalRankComponent;
