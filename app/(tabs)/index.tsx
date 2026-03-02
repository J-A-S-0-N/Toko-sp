import HomeFeedHeader from '@/components/HomeFeedComponents/homeFeedHeader';
import RecentRoundComponent from '@/components/HomeFeedComponents/recentRoundComponent';
import UserStatComponent from '@/components/HomeFeedComponents/userStatComponent';
import UsernameHeader from '@/components/HomeFeedComponents/usernameHeader';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';


export default function HomeScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
      >

        <View style={{marginBottom: moderateScale(20)}}>
          <HomeFeedHeader/>
        </View>

        <View style={{marginBottom: moderateScale(20)}}>
          <UsernameHeader/>
        </View>

        <View style={{marginBottom: moderateScale(15)}}>
          <UserStatComponent/>
        </View>

        <View style={{marginBottom: moderateScale(10)}}>
          <RecentRoundComponent/>
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
