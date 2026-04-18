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

export default function HomeFeedSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <SkeletonBlock
        height={moderateScale(30)}
        style={{ marginBottom: moderateScale(15) }}
      />

      {/* Username row */}
      <View style={styles.usernameRow}>
        <SkeletonBlock
          height={moderateScale(40)}
          borderRadius={moderateScale(20)}
          style={{ width: moderateScale(40) }}
        />
        <SkeletonBlock
          height={moderateScale(40)}
          style={{ flex: 1 }}
        />
      </View>

      {/* UserStat card */}
      <SkeletonBlock
        height={moderateScale(70)}
        style={{ marginBottom: moderateScale(15) }}
      />

      {/* Weekly summary card */}
      <SkeletonBlock
        height={moderateScale(140)}
        borderRadius={moderateScale(24)}
        style={{ marginBottom: moderateScale(15) }}
      />

      {/* Weather */}
      <SkeletonBlock
        height={moderateScale(110)}
        borderRadius={moderateScale(24)}
        style={{ marginBottom: moderateScale(25) }}
      />

      {/* Recent rounds */}
      <SkeletonBlock
        height={moderateScale(200)}
        borderRadius={moderateScale(24)}
        style={{ marginBottom: moderateScale(25) }}
      />

      {/* Nearby courses */}
      <SkeletonBlock
        height={moderateScale(160)}
        borderRadius={moderateScale(24)}
        style={{ marginBottom: moderateScale(25) }}
      />

      {/* Daily tip */}
      <SkeletonBlock
        height={moderateScale(80)}
        style={{ marginBottom: moderateScale(15) }}
      />

      {/* Goal setup */}
      <SkeletonBlock
        height={moderateScale(60)}
        borderRadius={moderateScale(24)}
        style={{ marginBottom: moderateScale(15) }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginBottom: moderateScale(15),
  },
});
