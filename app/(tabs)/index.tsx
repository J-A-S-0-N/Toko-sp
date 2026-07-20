import { checkUserExistsByPhoneNumber } from '@/app/(auth)/functions/loginFetchUserFunction';
import ParkPromotionAdComponent from '@/components/ads/ParkPromotionAdComponent';
import PromoAdComponent from '@/components/ads/PromoAdComponent';
import SponsoredAdComponent from '@/components/ads/SponsoredAdComponent';
// import DailyScanEventCard from '@/components/HomeFeedComponents/dailyScanEventCard';
import DailyTipComponent from '@/components/HomeFeedComponents/dailyTipComponent';
import GoalSetupPromptComponent from '@/components/HomeFeedComponents/goalSetupPromptComponent';
import HottestLocationsComponent from '@/components/HomeFeedComponents/hottestLocationsComponent';
import LiveChatBannerComponent from '@/components/HomeFeedComponents/liveChatBannerComponent';
import RecentRoundComponent from '@/components/HomeFeedComponents/recentRoundComponent';
import RegionalRankComponent from '@/components/HomeFeedComponents/regionalRankComponent';
import SwingAnalyzerHero from '@/components/HomeFeedComponents/swingAnalyzerHero';
import { ThemedText as Text } from '@/components/themed-text';
import db from '@/config/firebase';
import { FONT } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { collection, doc, getCountFromServer, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';

const MOCK_SWING_HISTORY_ROWS = [
  {
    id: 'swing-1',
    title: '7월 16일 스윙',
    summary: '자세 77 · 템포 74 · 밸런스 82',
    score: '78점',
    delta: '+6',
  },
  {
    id: 'swing-2',
    title: '7월 10일 스윙',
    summary: '자세 72 · 템포 70 · 밸런스 74',
    score: '72점',
    delta: '+3',
  },
  {
    id: 'swing-3',
    title: '7월 3일 스윙',
    summary: '자세 68 · 템포 69 · 밸런스 70',
    score: '69점',
    delta: '첫 분석',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const [roundCount, setRoundCount] = useState<number | null>(null);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const formattedPhoneNumber = phoneNumber
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d{1,4})?(\d{1,4})?/, (_, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join('-'));
  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 10;
  const hasPhoneValue = phoneNumber.replace(/\D/g, '').length > 0;

  useEffect(() => {
    if (!user?.uid) return;
    const fetchCount = async () => {
      try {
        const q = query(
          collection(db, 'Scans'),
          where('userId', '==', user.uid),
          where('status', '==', 'completed')
        );
        const snapshot = await getCountFromServer(q);
        setRoundCount(snapshot.data().count);
      } catch (error) {
        console.error('Failed to fetch round count:', error);
      }
    };
    fetchCount();
  }, [user?.uid]);

  // useEffect(() => {
  //   if (!user?.uid) {
  //     setPhoneModalVisible(false);
  //     return;
  //   }

  //   const checkLegacyGooglePhoneRequirement = async () => {
  //     try {
  //       const providerIds = user.providerData?.map((provider) => provider?.providerId).filter(Boolean) ?? [];
  //       const isGoogleUser = providerIds.includes('google.com');

  //       if (!isGoogleUser) {
  //         setPhoneModalVisible(false);
  //         return;
  //       }

  //       const userSnap = await getDoc(doc(db, 'Users', user.uid));
  //       const storedPhone = userSnap.exists() ? userSnap.data()?.phoneNumber : null;
  //       const hasStoredPhone = typeof storedPhone === 'string' && storedPhone.trim().length > 0;

  //       setPhoneModalVisible(!hasStoredPhone);
  //     } catch (error) {
  //       console.error('Failed to check phone requirement:', error);
  //     }
  //   };

  //   checkLegacyGooglePhoneRequirement();
  // }, [user]);

  // useEffect(() => {
  //   if (!phoneModalVisible) {
  //     return;
  //   }

  //   const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
  //   return () => subscription.remove();
  // }, [phoneModalVisible]);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setPhoneNumber(digits);
  };

  const savePhoneNumber = async () => {
    if (!user?.uid || !isPhoneValid || isSavingPhone) {
      return;
    }

    setIsSavingPhone(true);

    try {
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      const e164PhoneNumber = `+82${digitsOnly.replace(/^0/, '')}`;
      const existingPhoneUser = await checkUserExistsByPhoneNumber(e164PhoneNumber);

      if (existingPhoneUser) {
        Alert.alert('이미 가입된 번호예요', '다른 번호를 입력해주세요.');
        setIsSavingPhone(false);
        return;
      }

      await setDoc(
        doc(db, 'Users', user.uid),
        { phoneNumber: e164PhoneNumber },
        { merge: true }
      );

      setPhoneModalVisible(false);
      setPhoneNumber('');
    } catch (error) {
      Alert.alert('저장 실패', '전화번호 저장 중 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSavePhone = () => {
    if (!isPhoneValid || isSavingPhone) {
      return;
    }

    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const e164PhoneNumber = `+82${digitsOnly.replace(/^0/, '')}`;

    Alert.alert('번호를 저장할까요?', `입력 번호: ${formattedPhoneNumber}\n저장 번호: ${e164PhoneNumber}`, [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: () => { void savePhoneNumber(); } },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Animated.ScrollView
        entering={FadeIn.duration(400)}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: tabBarHeight + moderateScale(150) }}
      >

        <View style={{marginBottom: moderateScale(15)}}>
          <SwingAnalyzerHero onPress={() => router.push('/(swing)' as never)} />
        </View>

        <Pressable
          style={styles.swingHistoryEntryButton}
          onPress={() => router.push('/(swing)/history' as never)}
        >
          <View style={styles.swingHistoryHeaderRow}>
            <Text type="barlowHard" style={styles.swingHistoryHeaderTitle}>
              이전 분석 기록
            </Text>
            <View style={styles.swingHistoryHeaderAction}>
              <Text type="barlowHard" style={styles.swingHistoryHeaderActionText}>
                전체 보기
              </Text>
              <Text type="barlowHard" style={styles.swingHistoryHeaderActionArrow}>
                →
              </Text>
            </View>
          </View>

          {MOCK_SWING_HISTORY_ROWS.map((row, index) => {
            const isLast = index === MOCK_SWING_HISTORY_ROWS.length - 1;
            return (
              <View key={row.id} style={[styles.swingHistoryRow, !isLast && styles.swingHistoryRowDivider]}>
                <View style={styles.swingHistoryThumbBox}>
                  <Text type="barlowHard" style={styles.swingHistoryThumbPlay}>
                    ▶
                  </Text>
                </View>

                <View style={styles.swingHistoryRowBody}>
                  <Text type="barlowHard" style={styles.swingHistoryRowTitle}>
                    {row.title}
                  </Text>
                  <Text type="barlowLight" style={styles.swingHistoryRowSummary}>
                    {row.summary}
                  </Text>
                </View>

                <View style={styles.swingHistoryScoreColumn}>
                  <Text type="barlowHard" style={styles.swingHistoryScoreText}>
                    {row.score}
                  </Text>
                  <Text type="barlowHard" style={styles.swingHistoryDeltaText}>
                    {row.delta}
                  </Text>
                </View>
              </View>
            );
          })}
        </Pressable>

{/*         <View style={{marginBottom: moderateScale(15)}}>
          <UserStatComponent/>
        </View> */}

{/*         <View style={{marginBottom: moderateScale(15)}}>
          <WeeklySummaryComponent/>
        </View> */}

{/*         <View style={{marginBottom: moderateScale(15)}}>
          <DailyScanEventCard/>
        </View> */}

        <View style={{marginBottom: moderateScale(15)}}>
          <RegionalRankComponent/>
        </View>

        <View style={{marginBottom: moderateScale(15)}}>
          <LiveChatBannerComponent onPress={() => router.push('/chatRoom')} />
        </View>

  {/*       <View style={{marginBottom: moderateScale(25)}}>
          <WeatherSummaryComponent/>
        </View> */}

        <View style={{marginBottom: moderateScale(25)}}>
          <ParkPromotionAdComponent/>
        </View>

        <View style={{marginBottom: moderateScale(25)}}>
          <RecentRoundComponent/>
        </View>

        <View style={{marginBottom: moderateScale(15)}}>
          <PromoAdComponent/>
        </View>

        <View style={{marginBottom: moderateScale(15)}}>
          <DailyTipComponent/>
        </View>

        <View style={{marginBottom: moderateScale(25)}}>
          <SponsoredAdComponent/>
        </View>

        <View style={{marginBottom: moderateScale(25)}}>
          <HottestLocationsComponent
            onPressViewAll={() => Linking.openURL('https://www.kpga7330.com/park-golf/courses')}
          />
        </View>

        <View style={{marginBottom: moderateScale(15)}}>
          <GoalSetupPromptComponent/>
        </View>

        <Pressable
          style={styles.allRoundsButton}
          onPress={() => router.push('/(modals)/allRoundsModal')}
        >
          <Text type="barlowLight" style={styles.allRoundsButtonText}>
            전체 라운드 보기 ({roundCount !== null ? `${roundCount}개` : '…'}) →
          </Text>
        </Pressable>

      </Animated.ScrollView>
      {/*
      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        <View style={styles.phoneModalBackdrop}>
          <View style={styles.phoneModalCard}>
            <Text type="barlowHard" style={styles.phoneModalTitle}>전화번호 입력 필요</Text>
            <Text style={styles.phoneModalDescription}>서비스 이용을 위해 전화번호를 등록해주세요.</Text>

            <TextInput
              value={formattedPhoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="number-pad"
              placeholder="010-0000-0000"
              placeholderTextColor="#6A7278"
              style={[
                styles.phoneModalInput,
                hasPhoneValue && styles.phoneModalInputActive,
                hasPhoneValue && !isPhoneValid && styles.phoneModalInputInvalid,
              ]}
              maxLength={13}
              editable={!isSavingPhone}
            />

            <Pressable
              style={[styles.phoneModalButton, (!isPhoneValid || isSavingPhone) && styles.phoneModalButtonDisabled]}
              onPress={handleSavePhone}
              disabled={!isPhoneValid || isSavingPhone}
            >
              <Text style={styles.phoneModalButtonText}>저장하고 계속하기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0F1010',
  },
  container: {
    backgroundColor: "#0F1010",
    flex: 1,
    paddingHorizontal: moderateScale(10),
    paddingTop: moderateScale(12),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  allRoundsButton: {
    backgroundColor: '#1F2222',
    borderRadius: moderateScale(14),
    borderWidth: moderateScale(0.5),
    borderColor: '#353838',
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(30),
  },
  allRoundsButtonText: {
    color: '#A2AAAE',
    fontSize: moderateScale(FONT.sm),
  },
  swingHistoryEntryButton: {
    borderRadius: moderateScale(30),
    borderWidth: 1,
    borderColor: '#2A3835',
    backgroundColor: '#171E1D',
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(8),
    marginBottom: moderateScale(15),
  },
  swingHistoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  swingHistoryHeaderTitle: {
    color: '#F2F6F4',
    fontSize: moderateScale(FONT.md),
  },
  swingHistoryHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(3),
  },
  swingHistoryHeaderActionText: {
    color: '#13E4B0',
    fontSize: moderateScale(FONT.xxxs),
  },
  swingHistoryHeaderActionArrow: {
    color: '#13E4B0',
    fontSize: moderateScale(FONT.xxs),
  },
  swingHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(11),
  },
  swingHistoryRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A3431',
  },
  swingHistoryThumbBox: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(16),
    backgroundColor: '#1E312C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  swingHistoryThumbPlay: {
    color: '#08DFAF',
    fontSize: moderateScale(FONT.sm),
  },
  swingHistoryRowBody: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  swingHistoryRowTitle: {
    color: '#EDF2F0',
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(2),
  },
  swingHistoryRowSummary: {
    color: '#86918E',
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: 'Pretendard-Regular',
  },
  swingHistoryScoreColumn: {
    minWidth: moderateScale(64),
    alignItems: 'flex-end',
  },
  swingHistoryScoreText: {
    color: '#F2F6F4',
    fontSize: moderateScale(FONT.lg),
    marginBottom: moderateScale(2),
  },
  swingHistoryDeltaText: {
    color: '#11E0AE',
    fontSize: moderateScale(FONT.xxxs),
  },
  phoneModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  phoneModalCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#11161B',
    borderWidth: 1,
    borderColor: '#252C31',
    padding: moderateScale(16),
    gap: moderateScale(10),
  },
  phoneModalTitle: {
    color: '#F4F7F6',
    fontSize: moderateScale(FONT.lg),
  },
  phoneModalDescription: {
    color: '#9BA4AA',
    fontSize: moderateScale(FONT.xs),
    fontFamily: 'Pretendard-Regular',
  },
  phoneModalInput: {
    minHeight: moderateScale(48),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#252C31',
    backgroundColor: '#13191F',
    color: '#EAF3EF',
    paddingHorizontal: moderateScale(12),
    fontSize: moderateScale(FONT.md),
    fontFamily: 'Pretendard-Regular',
  },
  phoneModalInputActive: {
    borderColor: '#4FB78A',
  },
  phoneModalInputInvalid: {
    borderColor: '#DE5A5A',
  },
  phoneModalButton: {
    minHeight: moderateScale(48),
    borderRadius: 10,
    backgroundColor: '#4FB78A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneModalButtonDisabled: {
    backgroundColor: '#1A2026',
  },
  phoneModalButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT.sm),
    fontFamily: 'Pretendard-Bold',
  },
});
