import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { moderateScale } from "react-native-size-matters";

const SkeletonBlock = ({
  height,
  borderRadius = moderateScale(20),
  style,
}: {
  height: number;
  borderRadius?: number;
  style?: any;
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.6, { duration: 800 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          height,
          borderRadius,
          backgroundColor: "#1F2222",
        },
        animStyle,
        style,
      ]}
    />
  );
};

export default function StatPageSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header pill */}
      <SkeletonBlock
        height={moderateScale(32)}
        borderRadius={moderateScale(20)}
        style={{ width: moderateScale(90), marginBottom: moderateScale(12) }}
      />

      {/* GraphStat card */}
      <SkeletonBlock
        height={moderateScale(230)}
        borderRadius={moderateScale(18)}
        style={{ marginBottom: moderateScale(15) }}
      />

      {/* StreakCard */}
      <SkeletonBlock
        height={moderateScale(80)}
        borderRadius={moderateScale(18)}
        style={{ marginBottom: moderateScale(12) }}
      />

      {/* ParAnalysis */}
      <SkeletonBlock
        height={moderateScale(160)}
        borderRadius={moderateScale(18)}
        style={{ marginBottom: moderateScale(15) }}
      />

      {/* ScoreDistribution */}
      <SkeletonBlock
        height={moderateScale(140)}
        borderRadius={moderateScale(18)}
        style={{ marginBottom: moderateScale(15) }}
      />

      {/* HandiCapGraph */}
      <SkeletonBlock
        height={moderateScale(200)}
        borderRadius={moderateScale(18)}
        style={{ marginBottom: moderateScale(15) }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
