import DailyTipComponent from '@/components/HomeFeedComponents/dailyTipComponent';
import GoalSetupPromptComponent from '@/components/HomeFeedComponents/goalSetupPromptComponent';
import HomeFeedHeader from '@/components/HomeFeedComponents/homeFeedHeader';
import HomeFeedSkeleton from '@/components/HomeFeedComponents/HomeFeedSkeleton';
import NearbyCoursesComponent from '@/components/HomeFeedComponents/nearbyCoursesComponent';
import RecentRoundComponent from '@/components/HomeFeedComponents/recentRoundComponent';
import UsernameHeader from '@/components/HomeFeedComponents/usernameHeader';
import UserStatComponent from '@/components/HomeFeedComponents/userStatComponent';
import WeatherSummaryComponent from '@/components/HomeFeedComponents/weatherSummaryComponent';
import WeeklySummaryComponent from '@/components/HomeFeedComponents/weeklySummaryComponent';
import { ThemedText as Text } from '@/components/themed-text';
import db from '@/config/firebase';
import { FONT } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [roundCount, setRoundCount] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {showSkeleton ? (
        <Animated.View
          exiting={FadeOut.duration(400)}
          style={styles.skeletonContainer}
        >
          <HomeFeedSkeleton />
        </Animated.View>
      ) : (
      <Animated.ScrollView
        entering={FadeIn.duration(400)}
        style={styles.container}
      >

        <View style={{marginBottom: moderateScale(15)}}>
          <HomeFeedHeader/>
        </View>

        <View style={{marginBottom: moderateScale(15)}}>
          <UsernameHeader/>
        </View>

        <View style={{marginBottom: moderateScale(15)}}>
          <UserStatComponent/>
        </View>

        <View style={{marginBottom: moderateScale(15)}}>
          <WeeklySummaryComponent/>
        </View>

        <View style={{marginBottom: moderateScale(25)}}>
          <WeatherSummaryComponent/>
        </View>

        <View style={{marginBottom: moderateScale(25)}}>
          <RecentRoundComponent/>
        </View>

        <View style={{marginBottom: moderateScale(25)}}>
          <NearbyCoursesComponent/>
        </View>

        <View style={{marginBottom: moderateScale(15)}}>
          <DailyTipComponent/>
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
      )}
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
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(10),
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
});
