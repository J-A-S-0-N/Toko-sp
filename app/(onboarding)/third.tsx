import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import OnboardingProgressIndicator from '@/components/OnboardingProgressIndicator';
import { ThemedText as Text } from '@/components/themed-text';
import { moderateScale } from 'react-native-size-matters';

export default function OnboardingThirdScreen() {
  const cardSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(cardSlideAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [cardSlideAnim]);

  return (
    <LinearGradient colors={['#1D1805', '#0C0E12', '#07090C']} style={styles.container}>
      <LinearGradient
        colors={['rgba(212, 167, 51, 0.28)', 'rgba(212, 167, 51, 0)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.6, y: 0.8 }}
        style={styles.topGlow}
      />

      <Pressable style={styles.skipButton} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.skipText}>건너뛰기</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎯 목표 설정</Text>
        </View>

        <Text type="barlowHard" style={styles.title}>목표 스코어를{`\n`}향해 나아가세요</Text>
        <Text style={styles.description}>목표를 설정하고 매 라운드마다 얼마나 가까워지고 있는지 확인하세요.</Text>

        <Animated.View style={[styles.card, { transform: [{ translateY: cardSlideAnim }] }]}>
          <Text style={styles.cardLabel}>목표 스코어</Text>
          <Text type="barlowHard" style={styles.scoreText}>79타</Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <View style={styles.progressLegend}>
            <Text style={styles.legendText}>시작 88타</Text>
            <Text style={styles.legendPercent}>70%</Text>
            <Text style={styles.legendText}>목표 75타</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <OnboardingProgressIndicator step={2} initialStep={2} />
        <Pressable style={styles.ctaButton} onPress={() => router.replace('/(tabs)')}>
          <View style={styles.ctaContent}>
            <Text type="barlowHard" style={styles.ctaText}>시작하기</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </View>
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
    left: -12,
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
    backgroundColor: 'rgba(49, 42, 21, 0.95)',
    borderWidth: 1,
    borderColor: '#5A4A1F',
  },
  badgeText: {
    fontSize: moderateScale(12),
    color: '#6FDEAE',
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#212529',
    borderWidth: 1,
    borderColor: '#2A2F34',
    gap: 8,
  },
  cardLabel: {
    color: '#6F767D',
    fontSize: moderateScale(11),
    fontFamily: 'Pretendard-Regular',
  },
  scoreText: {
    color: '#54CC96',
    fontSize: moderateScale(46),
    lineHeight: 44,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#31363A',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    width: '70%',
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#4CC291',
  },
  progressLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendText: {
    color: '#6F767D',
    fontSize: moderateScale(10),
    fontFamily: 'Pretendard-Regular',
  },
  legendPercent: {
    color: '#4CC291',
    fontSize: moderateScale(12),
    fontFamily: 'Pretendard-Bold',
  },
  footer: {
    gap: 18,
    paddingBottom: 10,
  },
  ctaButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F0B42A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F0B42A',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
  },
});
