import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { ThemedText as Text } from "../themed-text";

const UserStatComponent = () => {
  return (
    <View style={styles.container}>
      {/*best*/}
      <View style={styles.statBlock}>
        <Text type="barlowHard" style={styles.valueBest}>
          23
        </Text>
        <Text style={styles.label}>최저 (18홀 기준)</Text>
      </View>
      <View style={styles.separator} />
      {/*avg*/}
      <View style={styles.statBlock}>
        <Text type="barlowHard" style={styles.valueAvg}>
          80.2
        </Text>
        <Text style={styles.label}>AVG (평균)</Text>
      </View>
      <View style={styles.separator} />
      {/*monthly round count*/}
      <View style={styles.statBlock}>
        <Text type="barlowHard" style={styles.valueMonthly}>
          +23.5
        </Text>
        <Text style={styles.label}>저번달 대비 -/+</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(0.5),
    borderColor: "#2E3131",
  },
  statBlock: {
    alignItems: "center",
  },
  valueBest: {
    fontSize: moderateScale(25),
    color: "#3DBF6E",
  },
  valueAvg: {
    fontSize: moderateScale(25),
    color: "white",
  },
  valueMonthly: {
    fontSize: moderateScale(25),
    color: "#3DBF6E",
  },
  label: {
    fontSize: moderateScale(11),
    color: "#6E7171",
  },
  separator: {
    width: 1,
    height: moderateScale(30),
    backgroundColor: "#2A2D2D",
  },
});

export default UserStatComponent;