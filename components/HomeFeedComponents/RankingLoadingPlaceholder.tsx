import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { moderateScale } from "react-native-size-matters";

function PulseBlock({
  height,
  width = "100%",
  radius = moderateScale(16),
}: {
  height: number;
  width?: number | string;
  radius?: number;
}) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 850 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          height,
          width,
          borderRadius: radius,
          backgroundColor: "#27302D",
        },
        animatedStyle,
      ]}
    />
  );
}

export default function RankingLoadingPlaceholder() {
  return (
    <View style={styles.wrap}>
      <PulseBlock height={moderateScale(180)} radius={moderateScale(30)} />

      <View style={styles.listCard}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.row, i < 2 && styles.rowDivider]}>
            <PulseBlock
              height={moderateScale(72)}
              width={moderateScale(72)}
              radius={moderateScale(22)}
            />
            <View style={styles.textCol}>
              <PulseBlock height={moderateScale(18)} width="80%" />
              <PulseBlock height={moderateScale(14)} width="60%" />
            </View>
            <View style={styles.scoreCol}>
              <PulseBlock height={moderateScale(16)} width={moderateScale(52)} />
              <PulseBlock height={moderateScale(12)} width={moderateScale(40)} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: moderateScale(12),
  },
  listCard: {
    borderRadius: moderateScale(30),
    borderWidth: 1,
    borderColor: "#313A37",
    backgroundColor: "#1B2120",
    overflow: "hidden",
  },
  row: {
    minHeight: moderateScale(118),
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(16),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#2D3533",
  },
  textCol: {
    flex: 1,
    gap: moderateScale(8),
  },
  scoreCol: {
    alignItems: "flex-end",
    gap: moderateScale(8),
  },
});
