import DailyTipComponent from '@/components/HomeFeedComponents/dailyTipComponent';
import GoalSetupPromptComponent from '@/components/HomeFeedComponents/goalSetupPromptComponent';
import HomeFeedHeader from '@/components/HomeFeedComponents/homeFeedHeader';
import RecentRoundComponent from '@/components/HomeFeedComponents/recentRoundComponent';
import UsernameHeader from '@/components/HomeFeedComponents/usernameHeader';
import UserStatComponent from '@/components/HomeFeedComponents/userStatComponent';
import WeatherSummaryComponent from '@/components/HomeFeedComponents/weatherSummaryComponent';
import WeeklySummaryComponent from '@/components/HomeFeedComponents/weeklySummaryComponent';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';


export default function HomeScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
      >

        <View style={{marginBottom: moderateScale(30)}}>
          <HomeFeedHeader/>
        </View>

        <View style={{marginBottom: moderateScale(30)}}>
          <UsernameHeader/>
        </View>

        <View style={{marginBottom: moderateScale(25)}}>
          <UserStatComponent/>
        </View>

        <View style={{marginBottom: moderateScale(25)}}>
          <WeeklySummaryComponent/>
        </View>

        <View style={{marginBottom: moderateScale(35)}}>
          <WeatherSummaryComponent/>
        </View>

        <View style={{marginBottom: moderateScale(35)}}>
          <RecentRoundComponent/>
        </View>

        <View style={{marginBottom: moderateScale(20)}}>
          <DailyTipComponent/>
        </View>

        <View style={{marginBottom: moderateScale(20)}}>
          <GoalSetupPromptComponent/>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0F0F0F',
  },
  container: {
    backgroundColor: "#0F0F0F",
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
