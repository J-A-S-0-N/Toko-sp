import { ThemedText as Text } from '@/components/themed-text';
import { FONT } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';

import { EventItem, fetchEventById } from '@/services/eventService';

export default function EventResultModal() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) {
        setIsLoading(false);
        return;
      }

      try {
        const fetched = await fetchEventById(eventId);
        setEvent(fetched);
      } catch (error) {
        console.error('Failed to fetch event result:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const periodLabel = useMemo(() => {
    if (!event?.startAt || !event?.endAt) {
      return '일정 정보 없음';
    }

    return `${event.startAt.getFullYear()}년 ${event.startAt.getMonth() + 1}월 ${event.startAt.getDate()}일 ~ ${event.endAt.getFullYear()}년 ${event.endAt.getMonth() + 1}월 ${event.endAt.getDate()}일`;
  }, [event]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={moderateScale(24)} color="#FFFFFF" />
        </Pressable>
        <Text type="barlowHard" style={styles.headerTitle}>
          이벤트 결과
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#4CAE82" />
          </View>
        ) : null}

        <View style={styles.eventCard}>
          <Text type="barlowLight" style={styles.eventBadge}>종료됨</Text>
          <Text type="barlowHard" style={styles.eventTitle}>
            {event?.title || '종료된 이벤트가 없습니다.'}
          </Text>
          <Text type="barlowLight" style={styles.eventSubtitle}>
            {event?.subtitle || '결과 정보를 준비 중입니다.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text type="barlowHard" style={styles.sectionTitle}>결과 요약</Text>
          <Text type="barlowLight" style={styles.sectionText}>
            {event?.resultSummary || '등록된 결과 요약이 없습니다.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text type="barlowHard" style={styles.sectionTitle}>당첨자</Text>
          <Text type="barlowLight" style={styles.sectionText}>
            {event?.winnerText || '-'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text type="barlowHard" style={styles.sectionTitle}>참여자 수</Text>
          <Text type="barlowLight" style={styles.sectionText}>
            {`${event?.participantCount ?? 0}명`}
          </Text>
        </View>

        <View style={styles.section}>
          <Text type="barlowHard" style={styles.sectionTitle}>이벤트 기간</Text>
          <Text type="barlowLight" style={styles.sectionText}>
            {periodLabel}
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
  loadingWrap: {
    marginBottom: moderateScale(16),
    alignItems: 'center',
  },
  eventCard: {
    backgroundColor: '#2B2420',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(24),
    borderWidth: moderateScale(0.5),
    borderColor: '#8E7A5E',
  },
  eventBadge: {
    color: '#D8C3A5',
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
