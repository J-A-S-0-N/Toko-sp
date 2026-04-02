import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import OnboardingProgressIndicator from '@/components/OnboardingProgressIndicator';
import { ThemedText as Text } from '@/components/themed-text';
import { moderateScale } from 'react-native-size-matters';

export default function OnboardingFirstScreen() {
  const cardSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(cardSlideAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [cardSlideAnim]);

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    router.push('./second');
  };

  return (
    <LinearGradient colors={['#03190F', '#07120F', '#06080B']} style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 255, 145, 0.26)', 'rgba(0, 255, 145, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.7 }}
        style={styles.topGlow}
      />

      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>건너뛰기</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>📄 AI 스캔</Text>
        </View>

        <Text type="barlowHard" style={styles.title}>사진 한 장으로{`\n`}스코어 자동 입력</Text>
        <Text style={styles.description}>스코어카드를 찍으면 AI가 홀별 스코어를 자동으로 인식해요. 손글씨도 OK.</Text>

        <Animated.View style={[styles.card, { transform: [{ translateY: cardSlideAnim }] }]}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            <Text style={styles.scanTitle}>📄{`\n`}스코어카드</Text>
          </View>
          <View style={styles.bottomTabs}>
            <View style={styles.bottomTab}><Text type="barlowLight" style={styles.bottomTabText}>버디 2</Text></View>
            <View style={styles.bottomTab}><Text type="barlowLight" style={styles.bottomTabText}>파 9</Text></View>
            <View style={styles.bottomTab}><Text type="barlowLight" style={styles.bottomTabText}>보기 6</Text></View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <OnboardingProgressIndicator step={0} initialStep={0} />
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
    top: -20,
    left: -10,
    width: 210,
    height: 230,
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
    backgroundColor: 'rgba(33, 54, 44, 0.9)',
    borderWidth: 1,
    borderColor: '#1E5D48',
  },
  badgeText: {
    fontSize: moderateScale(12),
    color: '#49C390',
    fontFamily: 'Pretendard-Bold',
  },
  title: {
    fontSize: moderateScale(35),
    lineHeight: 48,
    color: '#FFFFFF',
  },
  description: {
    fontSize: moderateScale(14),
    color: '#7B848D',
    lineHeight: 21,
    fontFamily: 'Pretendard-Regular',
  },
  card: {
    marginTop: 2,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#212529',
    borderWidth: 1,
    borderColor: '#2A2F34',
    gap: 10,
  },
  scanFrame: {
    height: 96,
    borderRadius: 8,
    backgroundColor: '#04110F',
    borderWidth: 1,
    borderColor: '#1A1E22',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: {
    width: 10,
    height: 10,
    position: 'absolute',
    borderColor: '#4BD29A',
  },
  cornerTopLeft: {
    left: 8,
    top: 8,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  cornerTopRight: {
    right: 8,
    top: 8,
    borderTopWidth: 1,
    borderRightWidth: 1,
  },
  cornerBottomLeft: {
    left: 8,
    bottom: 8,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  cornerBottomRight: {
    right: 8,
    bottom: 8,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  scanTitle: {
    textAlign: 'center',
    color: '#7E858B',
    fontSize: moderateScale(12),
    lineHeight: 16,
    fontFamily: 'Pretendard-Regular',
  },
  bottomTabs: {
    flexDirection: 'row',
    gap: 6,
  },
  bottomTab: {
    flex: 1,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#27332F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabText: {
    color: '#4DC995',
    fontSize: moderateScale(14),
    //fontFamily: 'Pretendard-Regular',
  },
  footer: {
    gap: 18,
    paddingBottom: 10,
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
  },
  ctaText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
  },
});
