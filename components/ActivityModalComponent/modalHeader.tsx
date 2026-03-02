import { ThemedText } from "@/components/themed-text";
import { Text, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
const ModalHeader = () => {
  return (
    <View>
      {/* Back Button */}
      <TouchableOpacity>
        <Text>Back</Text>
      </TouchableOpacity>
      {/* Location */}
      <ThemedText type="barlowHard" style={{ fontSize: moderateScale(18), color: "white" }}>Location</ThemedText>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: moderateScale(5),
        }}
      >
        {/* <ThemedText type="barlowLight" style={{ fontSize: moderateScale(11), color: "#6E7171" }}>{round.location}</ThemedText> */}
        <Text style={{ fontSize: moderateScale(11), color: "#6E7171" }}>pebble beathch, CA</Text>
        <View
          style={{ width: moderateScale(2), height: moderateScale(2), borderRadius: moderateScale(5), backgroundColor: "#6E7171" }}
        />
        <Text style={{ fontSize: moderateScale(11), color: "#6E7171" }}>Feb 22, 2027</Text>
      </View>
    </View>
  );
};

export default ModalHeader;