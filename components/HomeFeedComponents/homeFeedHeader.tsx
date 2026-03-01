import { ThemedText } from "@/components/themed-text";
import { Text, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const HomeFeedHeader = () => {
  return (
    <View
      style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}
    >
      <ThemedText type="barlowHard" style={{fontSize: moderateScale(20), color: "white"}}>이름 아직 미정임</ThemedText>
      <View
        style={{
          paddingHorizontal: moderateScale(15),
          paddingVertical: moderateScale(5),
          borderRadius: moderateScale(20),
          backgroundColor: "#1F2222",
          borderWidth: moderateScale(0.5),
          borderColor: "#353838",
        }}
      >
        <Text
          style={{fontSize: moderateScale(11), color: "#6E7171"}}
        >내 피드</Text>
      </View>
    </View>
  );
};

export default HomeFeedHeader;