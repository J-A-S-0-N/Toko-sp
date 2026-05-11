import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import { View } from "react-native";
import { moderateScale } from 'react-native-size-matters';

const HomeFeedHeader = () => {
  return (
    <View
      style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}
    >
      <View>
        <Text type="barlowHard" style={{fontSize: moderateScale(FONT.lg), color: "white"}}>파크필드</Text>
        <Text type="barlowLight" style={{fontSize: moderateScale(10), color: "#9BA1A6"}}>토고코포츠 - 대한민국 1위 파크골프 기록기</Text>
      </View>
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
          style={{fontSize: moderateScale(FONT.xs), color: "white"}}
        >내 피드</Text>
      </View>
    </View>
  );
};

export default HomeFeedHeader;