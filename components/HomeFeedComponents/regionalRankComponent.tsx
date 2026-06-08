import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from '@/constants/theme';
import { useAuth } from "@/context/AuthContext";
import {
    collection,
    doc,
    getCountFromServer,
    getDoc,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const RegionalRankComponent = () => {
  const { user } = useAuth();
  const [myRank, setMyRank] = useState<number | null>(null);
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const fetchRankingSummary = async () => {
      try {
        const myEntrySnap = await getDoc(doc(db, "RankingEntries", user.uid));
        if (!myEntrySnap.exists()) {
          setLoading(false);
          return;
        }

        const myEntry = myEntrySnap.data();
        const userCity = myEntry.city as string;
        const myDelta = myEntry.averageDelta as number;
        setCity(userCity);

        const betterQuery = query(
          collection(db, "RankingEntries"),
          where("city", "==", userCity),
          where("averageDelta", "<", myDelta)
        );
        const betterSnap = await getCountFromServer(betterQuery);
        setMyRank(betterSnap.data().count + 1);

        const totalQuery = query(
          collection(db, "RankingEntries"),
          where("city", "==", userCity)
        );
        const totalSnap = await getCountFromServer(totalQuery);
        setTotalMembers(totalSnap.data().count);
      } catch (error) {
        console.error("Failed to fetch regional rank summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingSummary();
  }, [user?.uid]);

  const topPercent = useMemo(() => {
    if (myRank != null && totalMembers != null && totalMembers > 0) {
      return Math.round((myRank / totalMembers) * 1000) / 10;
    }
    return null;
  }, [myRank, totalMembers]);

  const hasRankingData = myRank != null && totalMembers != null && city != null;

  // Fill represents how many players you outrank (#1 → full bar)
  const fillPercent = useMemo(() => {
    if (myRank === 1) return 100;
    if (myRank != null && totalMembers != null && totalMembers > 1) {
      return ((totalMembers - myRank) / (totalMembers - 1)) * 100;
    }
    return 0;
  }, [myRank, totalMembers]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#49C895" style={{ paddingVertical: moderateScale(20) }} />
      </View>
    );
  }

  if (!hasRankingData) {
    return (
      <View style={styles.container}>
        <Text type="barlowHard" style={styles.title}>지역 랭킹</Text>
        <Text type="barlowLight" style={[styles.subtitle, { marginTop: moderateScale(8) }]}>
          라운드를 완료하면 지역 순위가 표시됩니다
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text type="barlowHard" style={styles.title}>{city} 지역 {myRank}위</Text>
        <View style={styles.badge}>
          <Text type="barlowHard" style={styles.badgeText}>TOP {topPercent}%</Text>
        </View>
      </View>

      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${Math.max(fillPercent, 2)}%` }]} />
      </View>

      <Text type="barlowLight" style={styles.subtitle}>
        {totalMembers}명 중 {myRank}위 · 상위 {topPercent}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(18),
    borderWidth: moderateScale(0.5),
    borderColor: "#1F5A40",
    backgroundColor: "#080F0C",
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(18),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  title: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.lg),
  },
  badge: {
    borderRadius: moderateScale(999),
    borderWidth: moderateScale(1),
    borderColor: "#1F5A40",
    backgroundColor: "#0A1F16",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
  },
  badgeText: {
    color: "#49C895",
    fontSize: moderateScale(FONT.xs),
  },
  progressBarTrack: {
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: "#1A2E24",
    overflow: "hidden",
    marginBottom: moderateScale(12),
  },
  progressBarFill: {
    height: "100%",
    width: "100%",
    borderRadius: moderateScale(3),
    backgroundColor: "#49C895",
  },
  subtitle: {
    color: "#7A8E85",
    fontSize: moderateScale(FONT.xxs),
  },
});

export default RegionalRankComponent;
