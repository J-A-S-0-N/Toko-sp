import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { ThemedText as Text } from '@/components/themed-text';
import { moderateScale } from 'react-native-size-matters';

type VerifiedScreenProps = {
  onDone: () => void;
};

type RippleRingProps = {
  delay: number;
};

function RippleRing({ delay }: RippleRingProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withDelay(delay, withTiming(2.2, { duration: 1400 }));
    opacity.value = withDelay(delay, withTiming(0, { duration: 1400 }));
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.rippleRing, animatedStyle]} />;
}

export default function VerifiedScreen({ onDone }: VerifiedScreenProps) {
  const [popped, setPopped] = useState(false);

  const checkScale = useSharedValue(0.4);
  const checkOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(16);

  useEffect(() => {
    const popTimer = setTimeout(() => setPopped(true), 100);
    const doneTimer = setTimeout(onDone, 2200);

    return () => {
      clearTimeout(popTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  useEffect(() => {
    if (!popped) {
      return;
    }

    checkScale.value = withSpring(1, { damping: 10, stiffness: 180 });
    checkOpacity.value = withTiming(1, { duration: 200 });

    textOpacity.value = withDelay(300, withTiming(1, { duration: 350 }));
    textTranslateY.value = withDelay(300, withTiming(0, { duration: 350 }));
  }, [checkOpacity, checkScale, popped, textOpacity, textTranslateY]);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.visualWrap}>
          {popped && (
            <>
              <RippleRing delay={0} />
              <RippleRing delay={350} />
            </>
          )}

          <Animated.View style={checkAnimatedStyle}>
            <View style={styles.checkGlowWrap}>
              <LinearGradient colors={['#4CAF82', '#3A9668']} style={styles.checkCircle}>
                <Svg viewBox="0 0 24 24" width={38} height={38}>
                  <Path
                    d="M20 6 L9 17 L4 12"
                    stroke="white"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </LinearGradient>
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.textBlock, textAnimatedStyle]}>
          <Text type="barlowHard" style={styles.title}>
            인증 완료!
          </Text>
          <Text style={styles.subtitle}>환영합니다 🎉</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1010',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  visualWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(76,175,130,0.3)',
  },
  checkGlowWrap: {
    borderRadius: 44,
    padding: 12,
    backgroundColor: 'rgba(76,175,130,0.1)',
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF82',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    color: '#F2F2F0',
    fontSize: moderateScale(28),
    fontWeight: '900',
    fontFamily: 'Pretendard-Bold',
    marginBottom: 6,
  },
  subtitle: {
    color: '#6E7271',
    fontSize: moderateScale(14),
    fontFamily: 'Pretendard-Regular',
  },
});
