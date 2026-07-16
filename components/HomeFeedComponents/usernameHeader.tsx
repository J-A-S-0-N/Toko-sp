import { ThemedText as Text } from '@/components/themed-text';
import { FONT } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useComputedStats } from '@/hooks/useComputedStats';
import { useRounds } from '@/hooks/useRounds';
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
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: "#4CAE82",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text type="barlowHard" style={{fontSize: moderateScale(FONT.sm), color: "white"}}>
          {(username ?? '').slice(0, 1)}
        </Text >
      </View>
      <View>
        <Text type="barlowHard" style={{fontSize: moderateScale(FONT.lg), color: "white"}}>{username}</Text>
        {!hideStats && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: moderateScale(5)}}>
            <Text
            style={{fontSize: moderateScale(FONT.xs), color: "#6E7171"}}
            >{averageDelta != null ? `${averageDelta >= 0 ? '+' : ''}${averageDelta}` : '-'} 평타</Text>
           <View
            style={{width: moderateScale(4), height: moderateScale(4), borderRadius: moderateScale(5), backgroundColor: "#6E7171"}}
            ></View>
            <Text
            style={{fontSize: moderateScale(FONT.xs), color: "#6E7171"}}
            >{roundCount}회 라운딩</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default UsernameHeader;