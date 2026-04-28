import { ThemedText as Text } from '@/components/themed-text';
import { db } from '@/config/firebase';
import { FONT } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from "react";
import { View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const UsernameHeader = () => {
  const { user, username } = useAuth();
  const [stats, setStats] = useState({
    handi: 0,
    rounds: 0,
  });

  useEffect(() => {
    if (!user?.uid) return;

    const fetchStats = async () => {
      try {
        // Fetch handicap from user document
        const userDocRef = doc(db, 'Users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const handicap = userDoc.exists() ? (userDoc.data()?.handicap ?? 0) : 0;

        // Count completed rounds
        const scansRef = collection(db, 'Scans');
        const q = query(
          scansRef,
          where('userId', '==', user.uid),
          where('status', '==', 'completed'),
        );
        const snapshot = await getDocs(q);

        setStats({
          handi: handicap,
          rounds: snapshot.size,
        });
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      }
    };

    fetchStats();
  }, [user?.uid]);

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
        {/*Stats View*/}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: moderateScale(5)}}>
          <Text
          style={{fontSize: moderateScale(FONT.xs), color: "#6E7171"}}
          >+{stats.handi} 핸디캡</Text>
         <View
          style={{width: moderateScale(4), height: moderateScale(4), borderRadius: moderateScale(5), backgroundColor: "#6E7171"}}
          ></View>
          <Text
          style={{fontSize: moderateScale(FONT.xs), color: "#6E7171"}}
          >{stats.rounds}회 라운딩</Text>
        </View>
      </View>
    </View>
  );
};

export default UsernameHeader;