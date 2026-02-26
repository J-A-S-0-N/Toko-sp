import { ThemedText } from '@/components/themed-text';
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const UsernameHeader = () => {
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState({
    handi: 0,
    rounds: 0,
  });

  useEffect(() => {
    //TODO: impliment fetch username
    setUsername('채준성');
  }, []);

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
        <ThemedText type="barlowHard" style={{fontSize: moderateScale(15), color: "white"}}>
          {username.slice(0, 1)}
        </ThemedText>
      </View>
      <View>
        <ThemedText type="barlowHard" style={{fontSize: moderateScale(15), color: "white"}}>{username}</ThemedText>
        {/*Stats View*/}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: moderateScale(5)}}>
          <Text
          style={{fontSize: moderateScale(11), color: "#6E7171"}}
          >+{stats.handi} 핸디캡</Text>
         <View
          style={{width: moderateScale(3), height: moderateScale(3), borderRadius: moderateScale(5), backgroundColor: "#6E7171"}}
          ></View>
          <Text
          style={{fontSize: moderateScale(11), color: "#6E7171"}}
          >{stats.rounds}회 라운딩</Text>
        </View>
      </View>
    </View>
  );
};

export default UsernameHeader;