import { ThemedText as Text } from '@/components/themed-text';
import { FONT } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useComputedStats } from '@/hooks/useComputedStats';
import { useRounds } from '@/hooks/useRounds';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type UsernameHeaderProps = {
  hideStats?: boolean;
};

const UsernameHeader = ({ hideStats = false }: UsernameHeaderProps) => {
  const { username } = useAuth();
  const { rounds } = useRounds();
  const { stats } = useComputedStats(rounds);

  const averageDelta = stats.averageDelta;
  const roundCount = rounds.length;

  return (
    <View
      style={{flexDirection: 'row', alignItems: 'center', gap: moderateScale(10)}}
    >
      {/*placeholder profile image*/}
      <View
        style={{
          width: moderateScale(44),
          height: moderateScale(44),
          borderRadius: moderateScale(14),
          shadowColor: '#57C79A',
          shadowOpacity: 0.5,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={['#64D7A7', '#419A74', '#1B4D39']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: moderateScale(14),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text type="barlowHard" style={{fontSize: moderateScale(FONT.xs), color: "white"}}>
            {(username ?? '').slice(0, 1)}
          </Text >
        </LinearGradient>
      </View>
      <View>
        <Text type="barlowHard" style={{fontSize: moderateScale(FONT.md), color: "white"}}>{username}</Text>
        {!hideStats && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: moderateScale(5)}}>
            <Text
            style={{fontSize: moderateScale(FONT.xxs), color: "#6E7171"}}
            >{averageDelta != null ? `${averageDelta >= 0 ? '+' : ''}${averageDelta}` : '-'} 평타</Text>
           <View
            style={{width: moderateScale(4), height: moderateScale(4), borderRadius: moderateScale(5), backgroundColor: "#6E7171"}}
            ></View>
            <Text
            style={{fontSize: moderateScale(FONT.xxs), color: "#6E7171"}}
            >{roundCount}회 라운딩</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default UsernameHeader;