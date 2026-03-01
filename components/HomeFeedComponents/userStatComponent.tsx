import { StyleSheet, Text, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { ThemedText } from "../themed-text";

const UserStatComponent = () => {
  return (
    <View style={styles.container}>
      {/*best*/}
      <View style={styles.statBlock}>
        <ThemedText type="barlowHard" style={styles.valueBest}>
          23
        </ThemedText>
        <Text style={styles.label}>BEST</Text>
      </View>
      <View style={styles.separator} />
      {/*avg*/}
      <View style={styles.statBlock}>
        <ThemedText type="barlowHard" style={styles.valueAvg}>
          80.2
        </ThemedText>
        <Text style={styles.label}>BEST</Text>
      </View>
      <View style={styles.separator} />
      {/*monthly round count*/}
      <View style={styles.statBlock}>
        <ThemedText type="barlowHard" style={styles.valueMonthly}>
          +23.5
        </ThemedText>
        <Text style={styles.label}>BEST</Text>
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
    paddingHorizontal: moderateScale(40),
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