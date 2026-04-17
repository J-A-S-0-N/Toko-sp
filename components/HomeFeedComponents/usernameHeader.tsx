import { ThemedText as Text } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from "react";
import { View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const UsernameHeader = () => {
  const { username } = useAuth();
  const [stats, setStats] = useState({
    handi: 0,
    rounds: 0,
  });

  useEffect(() => {
    //TODO: implement fetch stats
    setStats({
      handi: 12.3,
      rounds: 235
    });
  }, []);
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
        <Text type="barlowHard" style={{fontSize: moderateScale(15), color: "white"}}>
          {(username ?? '').slice(0, 1)}
        </Text >
      </View>
      <View>
        <Text type="barlowHard" style={{fontSize: moderateScale(20), color: "white"}}>{username}</Text>
        {/*Stats View*/}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: moderateScale(5)}}>
          <Text
          style={{fontSize: moderateScale(13), color: "#6E7171"}}
          >+{stats.handi} 핸디캡</Text>
         <View
          style={{width: moderateScale(4), height: moderateScale(4), borderRadius: moderateScale(5), backgroundColor: "#6E7171"}}
          ></View>
          <Text
          style={{fontSize: moderateScale(13), color: "#6E7171"}}
          >{stats.rounds}회 라운딩</Text>
        </View>
      </View>
    </View>
  );
};

export default UsernameHeader;