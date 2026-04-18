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
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';


export default function HomeScreen() {
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
