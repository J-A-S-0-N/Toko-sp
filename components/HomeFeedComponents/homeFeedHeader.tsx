import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import { View } from "react-native";
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { moderateScale } from 'react-native-size-matters';

interface HomeFeedHeaderProps {
  scrollY: SharedValue<number>;
}

const HomeFeedHeader = ({ scrollY }: HomeFeedHeaderProps) => {
  const brandAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(scrollY.value, [0, 80], [1, 0], 'clamp');
    const translateY = interpolate(scrollY.value, [0, 80], [0, -20], 'clamp');
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        brandAnimatedStyle,
      ]}
    >
      <View>
        <Text type="barlowHard" style={{fontSize: moderateScale(FONT.xl), color: "white"}}>토코기록기</Text>
        <Text type="barlowLight" style={{fontSize: moderateScale(12), color: "#9BA1A6"}}>토코코포츠 - 대한민국 1위 파크골프 기록기</Text>
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
    </Animated.View>
  );
};

export default HomeFeedHeader;