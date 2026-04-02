import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type OnboardingProgressIndicatorProps = {
  step: 0 | 1 | 2;
  initialStep?: 0 | 1 | 2;
};

const STEP_DISTANCE = 24;

export default function OnboardingProgressIndicator({ step, initialStep }: OnboardingProgressIndicatorProps) {
  const initialTranslate = (initialStep ?? step) * STEP_DISTANCE;
  const translateX = useRef(new Animated.Value(initialTranslate)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: step * STEP_DISTANCE,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, translateX]);

  return (
    <View style={styles.container}>
      <View style={styles.slot}>
        <View style={styles.dot} />
      </View>
      <View style={styles.slot}>
        <View style={styles.dot} />
      </View>
      <View style={styles.slot}>
        <View style={styles.dot} />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.activeBar,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  slot: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#3A7E62',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    width: 14,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#4CAE82',
  },
});
