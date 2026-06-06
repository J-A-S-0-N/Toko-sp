import { ThemedText as Text } from '@/components/themed-text';
import { FONT } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';

export default function EventDetailModal() {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={moderateScale(24)} color="#FFFFFF" />
        </Pressable>
        <Text type="barlowHard" style={styles.headerTitle}>
          이벤트
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.eventCard}>
          <Text type="barlowLight" style={styles.eventBadge}>진행 중</Text>
          <Text type="barlowHard" style={styles.eventTitle}>
            스코어 디스크 무료 증정 이벤트
          </Text>
          <Text type="barlowLight" style={styles.eventSubtitle}>
            토코기록기 스코어 어플 출시 기념 이벤트
          </Text>
        </View>

        <View style={styles.section}>
          <Text type="barlowHard" style={styles.sectionTitle}>이벤트 내용</Text>
          <Text type="barlowLight" style={styles.sectionText}>
            토코기록기 스코어 앱을 다운로드하고 스코어 디스크를 무료로 받아가세요!
          </Text>
        </View>

        <View style={styles.section}>
          <Text type="barlowHard" style={styles.sectionTitle}>이벤트 기간</Text>
          <Text type="barlowLight" style={styles.sectionText}>
            2025년 5월 15일 ~ 2025년 6월 15일
          </Text>
        </View>

        <View style={styles.section}>
          <Text type="barlowHard" style={styles.sectionTitle}>참여 방법</Text>
          <Text type="barlowLight" style={styles.sectionText}>
            1. 토코기록기 스코어 앱 다운로드{'\n'}
            2. 회원가입 및 라운드 기록 1회 이상{'\n'}
            3. 이벤트 신청하기
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#1F2222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(FONT.lg),
    color: '#FFFFFF',
  },
  placeholder: {
    width: moderateScale(40),
  },
  content: {
    padding: moderateScale(16),
  },
  eventCard: {
    backgroundColor: '#163429',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(24),
    borderWidth: moderateScale(0.5),
    borderColor: '#4CAE82',
  },
  eventBadge: {
    color: '#4CAE82',
    fontSize: moderateScale(FONT.xs),
    marginBottom: moderateScale(8),
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT.xl),
    marginBottom: moderateScale(4),
  },
  eventSubtitle: {
    color: '#9BA1A6',
    fontSize: moderateScale(FONT.sm),
  },
  section: {
    marginBottom: moderateScale(20),
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT.md),
    marginBottom: moderateScale(8),
  },
  sectionText: {
    color: '#9BA1A6',
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(22),
  },
});
