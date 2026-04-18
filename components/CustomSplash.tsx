import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';

export default function CustomSplash({ onComplete }: { onComplete?: () => void }) {
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.92);
  const subtitleOpacity = useSharedValue(0);
  const lineWidth = useSharedValue(0);

  useEffect(() => {
    // Title: fade in + spring scale
    titleOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    titleScale.value = withSpring(1, { damping: 14, stiffness: 120 });

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
      <LinearGradient
        colors={['rgba(65, 159, 113, 0.12)', 'rgba(65, 159, 113, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.7 }}
        style={styles.topLeftGlow}
      />
      <LinearGradient
        colors={['rgba(65, 159, 113, 0.10)', 'rgba(65, 159, 113, 0)']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.4, y: 0.3 }}
        style={styles.bottomRightGlow}
      />

      <View style={styles.content}>
        <Animated.Text style={[styles.title, titleStyle]}>
          토코스포츠
        </Animated.Text>

        <Animated.View style={[styles.line, lineStyle]} />

        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          당신의 골프 동반자
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
  topLeftGlow: {
    position: 'absolute',
    top: -30,
    left: -20,
    width: 220,
    height: 240,
    borderRadius: 130,
  },
  bottomRightGlow: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    width: 220,
    height: 240,
    borderRadius: 130,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'BarlowCondensed_900Black_Italic',
    fontSize: 50,
    color: '#FFFFFF',
    letterSpacing: 3,
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
