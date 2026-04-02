import { ThemedText as Text } from "@/components/themed-text";
import { View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const HomeFeedHeader = () => {
  return (
    <View
      style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}
    >
      <Text type="barlowHard" style={{fontSize: moderateScale(20), color: "white"}}>이름 아직 미정임</Text>
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
          style={{fontSize: moderateScale(13), color: "white"}}
        >내 피드</Text>
      </View>
    </View>
  );
};

export default HomeFeedHeader;