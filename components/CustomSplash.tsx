import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export default function CustomSplash({ onComplete }: { onComplete?: () => void }) {
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.7);
  const subtitleOpacity = useSharedValue(0);
  const lineWidth = useSharedValue(0);

  useEffect(() => {
    // Title: fade in + spring scale
    titleOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    titleScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // Decorative line expands
    lineWidth.value = withDelay(
      300,
      withTiming(120, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // Subtitle fades in after line
    subtitleOpacity.value = withDelay(
      550,
      withTiming(1, { duration: 400 })
    );
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    width: lineWidth.value,
    opacity: lineWidth.value > 0 ? 1 : 0,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <Animated.View
      exiting={FadeOut.duration(300).withCallback((finished) => {
        if (finished && onComplete) {
          onComplete();
        }
      })}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.Text style={[styles.title, titleStyle]}>
          TOKO
        </Animated.Text>

        <Animated.View style={[styles.line, lineStyle]} />

        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Your Golf Companion
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F1010',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'BarlowCondensed_900Black_Italic',
    fontSize: 56,
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  line: {
    height: 2,
    backgroundColor: '#419F71',
    borderRadius: 1,
  },
  subtitle: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    color: '#9BA1A6',
    letterSpacing: 3,
  },
});
