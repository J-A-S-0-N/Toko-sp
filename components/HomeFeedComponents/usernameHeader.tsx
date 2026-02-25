import { useEffect, useState } from "react";
import { View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { ThemedText as Text } from "../themed-text";

const UsernameHeader = () => {
  const [username, setUsername] = useState('');

  useEffect(() => {
    //TODO: impliment fetch username
    setUsername('90');
  }, []);
  return (
    <View
      style={{flexDirection: 'row', alignItems: 'center', gap: moderateScale(8)}}
    >
      {/*placeholder profile image*/}
      <View
        style={{
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
        }}
      >
      </View>
      <Text type="barlowHard" style={{fontSize: moderateScale(30)}}>{username}</Text>
    </View>
  );
};

export default UsernameHeader;