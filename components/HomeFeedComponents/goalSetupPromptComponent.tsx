import { ThemedText as Text } from "@/components/themed-text";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const GoalSetupPromptComponent = () => {
  return (
    <View style={styles.container}>
      <View style={styles.leftBlock}>
        <Text style={styles.icon}>🎯</Text>
        <View>
          <Text type="barlowHard" style={styles.title}>
            목표 스코어 없음
          </Text>
          <Text style={styles.subtitle}>목표를 설정하고 성장을 추적하세요</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.8}
        onPress={() => router.push("/(modals)/setGoalModal")}
      >
        <Text type="barlowLight" style={styles.actionText}>
          설정하기
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#2A3131",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    flex: 1,
    marginRight: moderateScale(10),
  },
  icon: {
    fontSize: moderateScale(16),
  },
  title: {
    color: "#F2F5F4",
    fontSize: moderateScale(16),
  },
  subtitle: {
    marginTop: moderateScale(2),
    color: "#6F7775",
    fontSize: moderateScale(13),
  },
  actionButton: {
    backgroundColor: "#173B2E",
    borderColor: "#2A7857",
    borderWidth: 1,
    borderRadius: moderateScale(22),
    //minHeight: moderateScale(44),
    //minWidth: moderateScale(112),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
  },
  actionText: {
    color: "#48C28D",
    fontSize: moderateScale(13),
  },
});

export default GoalSetupPromptComponent;
