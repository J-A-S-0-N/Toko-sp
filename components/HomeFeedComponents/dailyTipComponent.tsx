import { ThemedText } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { moderateScale } from 'react-native-size-matters';

const DailyTipComponent = () => {
  return (
    <LinearGradient
      colors={["#0D1B34", "#0B1A31", "#0A1629"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Text style={styles.tipIcon}>💡</Text>
        <ThemedText type="barlowLight" style={styles.headerText}>
          오늘의 팁 · 퍼팅 팁
        </ThemedText>
      </View>

      <ThemedText type="barlowLight" style={styles.tipText}>
        "퍼팅 전 홀을 3번 바라보고 스트로크하면 방향성이 좋아집니다."
      </ThemedText>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    borderColor: "#173254",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginBottom: moderateScale(10),
  },
  tipIcon: {
    fontSize: moderateScale(FONT.sm),
    color: "#A8C5FF",
  },
  headerText: {
    color: "#A8C5FF",
    fontSize: moderateScale(FONT.sm),
  },
  tipText: {
    color: "#F4F8FF",
    fontSize: moderateScale(FONT.sm),
    //lineHeight: moderateScale(25),
    letterSpacing: -0.2,
  },
});

export default DailyTipComponent;
