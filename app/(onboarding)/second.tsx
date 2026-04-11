import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText as Text } from '@/components/themed-text';
import { moderateScale } from 'react-native-size-matters';

export default function OnboardingSecondScreen() {
  const cardSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(cardSlideAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [cardSlideAnim]);

  const handleNext = () => {
    router.push('./third');
  };

  return (
    <LinearGradient colors={['#07142A', '#080D17', '#06080B']} style={styles.container}>
      <LinearGradient
        colors={['rgba(34, 111, 255, 0.28)', 'rgba(34, 111, 255, 0)']}
        start={{ x: 0.35, y: 0 }}
        end={{ x: 0.7, y: 0.75 }}
        style={styles.topGlow}
      />

      <Pressable style={styles.skipButton} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.skipText}>건너뛰기</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>📈 통계 분석</Text>
        </View>

        <Text type="barlowHard" style={styles.title}>모든 라운드를{`\n`}한눈에 파악</Text>
        <Text style={styles.description}>스코어 추세, 홀별 강점/약점, 파 분석까지 - 데이터를 실력으로 키워요.</Text>

        <Animated.View style={[styles.card, { transform: [{ translateY: cardSlideAnim }] }]}>
          <View style={styles.headerRow}>
            <Text style={styles.cardLabel}>스코어 추세</Text>
            <View style={styles.dot} />
          </View>
          <View style={styles.lineWrap}>
            <View style={[styles.segment, styles.segmentA]} />
            <View style={[styles.segment, styles.segmentB]} />
            <View style={[styles.segment, styles.segmentC]} />
            <View style={[styles.segment, styles.segmentD]} />
            <View style={[styles.segment, styles.segmentE]} />
          </View>
          <View style={styles.statsRow}>
            <View>
              <Text type="barlowHard" style={styles.statValue}>3.2</Text>
              <Text style={styles.statLabel}>거리</Text>
            </View>
            <View>
              <Text type="barlowHard" style={[styles.statValue, styles.statValueMid]}>4.6</Text>
              <Text style={styles.statLabel}>파악</Text>
            </View>
            <View>
              <Text type="barlowHard" style={[styles.statValue, styles.statValueHigh]}>5.4</Text>
              <Text style={styles.statLabel}>비중</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressIndicator}>
          <View style={styles.progressSlot}>
            <View style={styles.progressDot} />
          </View>
          <View style={styles.progressSlot}>
            <View style={styles.activeBar} />
          </View>
          <View style={styles.progressSlot}>
            <View style={styles.progressDot} />
          </View>
        </View>
        <Pressable style={styles.ctaButton} onPress={handleNext}>
          <Text type="barlowHard" style={styles.ctaText}>다음</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    justifyContent: 'space-between',
    position: 'relative',
  },
  topGlow: {
    position: 'absolute',
    top: -15,
    right: -18,
    width: 220,
    height: 240,
    borderRadius: 130,
  },
  skipButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  skipText: {
    fontSize: 13,
    color: '#767D86',
    fontFamily: 'Pretendard-Regular',
  },
  content: {
    gap: 14,
    marginTop: 40,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(22, 57, 68, 0.92)',
    borderWidth: 1,
    borderColor: '#1E667B',
  },
  badgeText: {
    fontSize: moderateScale(12),
    color: '#44D0B1',
    fontFamily: 'Pretendard-Bold',
  },
  title: {
    fontSize: moderateScale(35),
    lineHeight: 48,
    color: '#FFFFFF',
    //fontFamily: 'Pretendard-Bold',
  },
  description: {
    fontSize: moderateScale(14),
    color: '#7B848D',
    lineHeight: 21,
    fontFamily: 'Pretendard-Regular',
  },
  card: {
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#212529',
    borderWidth: 1,
    borderColor: '#2A2F34',
    gap: 10,
  },
  cardLabel: {
    color: '#6F767D',
    fontSize: moderateScale(11),
    fontFamily: 'Pretendard-Regular',
  },
  lineWrap: {
    height: 60,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  segment: {
    height: 3,
    backgroundColor: '#4FD1A0',
    borderRadius: 2,
    flex: 1,
    maxWidth: 50,
  },
  segmentA: {
    height: 4,
    backgroundColor: '#4FD1A0',
  },
  segmentB: {
    height: 42,
    backgroundColor: '#66EFAF',
  },
  segmentC: {
    height: 8,
    backgroundColor: '#4BD9A9',
  },
  segmentD: {
    height: 54,
    backgroundColor: '#66EFAF',
  },
  segmentE: {
    height: 48,
    backgroundColor: '#4FD1A0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0C95C',
    shadowColor: '#E0C95C',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statValue: {
    color: '#66EFAF',
    fontSize: moderateScale(18),
    textAlign: 'center',
  },
  statValueMid: {
    color: '#4BD9A9',
  },
  statValueHigh: {
    color: '#E0C95C',
  },
  statLabel: {
    marginTop: 2,
    color: '#6F767D',
    fontSize: moderateScale(10),
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
  },
  footer: {
    gap: 18,
    paddingBottom: 10,
  },
  progressIndicator: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressSlot: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#3A7E62',
  },
  activeBar: {
    width: 14,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#4CAE82',
  },
  ctaButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#4CAE82',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAE82',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  ctaText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
  },
});
