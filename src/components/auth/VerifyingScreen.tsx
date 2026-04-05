import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText as Text } from '@/components/themed-text';

type VerifyingScreenProps = {
  onDone: () => void;
};

type PulseDotProps = {
  index: number;
};

function PulseDot({ index }: PulseDotProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      index * 200,
      withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0.3, { duration: 600 })), -1),
    );
  }, [index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function VerifyingScreen({ onDone }: VerifyingScreenProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1);
  }, [rotation]);

  useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.spinnerWrap}>
          <View style={styles.spinnerBase} />
          <Animated.View style={[styles.spinnerTop, spinnerStyle]} />

          <View style={styles.spinnerCenter}>
            <Text style={styles.phoneEmoji}>📱</Text>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text type="barlowHard" style={styles.title}>
            인증 중...
          </Text>
          <Text style={styles.subtitle}>잠시만 기다려 주세요</Text>
        </View>

        <View style={styles.dotRow}>
          <PulseDot index={0} />
          <PulseDot index={1} />
          <PulseDot index={2} />
        </View>
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
    gap: 24,
  },
  spinnerWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerBase: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  spinnerTop: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#4CAF82',
  },
  spinnerCenter: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 26,
    backgroundColor: 'rgba(76,175,130,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneEmoji: {
    fontSize: 22,
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    color: '#F2F2F0',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Pretendard-Bold',
    marginBottom: 6,
  },
  subtitle: {
    color: '#6E7271',
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF82',
  },
});
