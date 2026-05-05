import { fetchNearbyRanking, RankingRow } from "@/app/(auth)/functions/fetchNearbyRanking";
import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

export default function RankingModal() {
  const router = useRouter();
  const { user } = useAuth();

  const [myRank, setMyRank] = useState<number | null>(null);
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState("");
  const [myAvgScore, setMyAvgScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const fetchRanking = async () => {
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
        setMyUsername(myEntry.username ?? "");
        setMyAvgScore(myEntry.averageScore ?? 0);

        // My rank
        const betterQuery = query(
          collection(db, "RankingEntries"),
          where("city", "==", userCity),
          where("averageDelta", "<", myDelta)
        );
        const betterSnap = await getCountFromServer(betterQuery);
        const rank = betterSnap.data().count + 1;
        setMyRank(rank);

        // Total members
        const totalQuery = query(
          collection(db, "RankingEntries"),
          where("city", "==", userCity)
        );
        const totalSnap = await getCountFromServer(totalQuery);
        setTotalMembers(totalSnap.data().count);

        // Fetch ±10 users around me
        const nearby = await fetchNearbyRanking({
          uid: user.uid,
          city: userCity,
          myDelta,
          myRank: rank,
          myUsername: myEntry.username ?? "",
          myAverageScore: myEntry.averageScore ?? 0,
          range: 10,
        });
        setLeaderboard(nearby);
      } catch (error) {
        console.error("Failed to fetch ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [user?.uid]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { backgroundColor: "#0F1010" }]}
      entering={FadeInDown.duration(220)}
    >
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Fixed header */}
        <View style={styles.fixedHeader}>
          <View style={styles.titleRow}>
            <View>
              <Text type="barlowHard" style={styles.title}>{city ?? "지역"} 전체 랭킹</Text>
              <Text style={styles.subtitle}>{totalMembers != null ? `${totalMembers}명 참가 중` : "로딩 중..."}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={10}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {/* My rank sticky row */}
          {myRank != null && (
            <>
              <View style={styles.myRankRow}>
                <Text type="barlowHard" style={styles.myRankNumber}>{myRank}</Text>
                <View style={styles.myRankNameBlock}>
                  <Text type="barlowHard" style={styles.myRankName}>{myUsername} (나)</Text>
                </View>
                <Text type="barlowHard" style={styles.myRankAvg}>{myAvgScore.toFixed(1)}</Text>
                <View style={styles.myRankBadge}>
                  <Text style={styles.myRankBadgeText}>내 순위</Text>
                </View>
              </View>
              <View style={styles.myRankDivider} />
            </>
          )}

          {/* Column header */}
          <View style={styles.columnHeader}>
            <Text style={styles.columnHash}>#</Text>
            <Text style={[styles.columnLabel, { flex: 1 }]}>이름</Text>
            <Text style={styles.columnLabel}>평균 · 델타</Text>
          </View>
          <View style={styles.divider} />
        </View>

        {/* Scrollable list */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color="#3CC06E" style={{ paddingVertical: moderateScale(40) }} />
          ) : leaderboard.length === 0 ? (
            <Text style={{ color: "#6E7171", textAlign: "center", paddingVertical: moderateScale(40) }}>
              랭킹 데이터가 없습니다
            </Text>
          ) : (
            leaderboard.map((item, index) => (
              <View key={item.uid}>
                <View style={[styles.rowItem, item.isMe && styles.rowItemMe]}>
                  {item.isMe && <View style={styles.meSidebar} />}
                  <Text
                    type={item.isMe ? "barlowHard" : "barlowLight"}
                    style={[styles.rowRank, item.isMe && styles.rowRankMe]}
                  >
                    {item.rank}
                  </Text>
                  <View style={styles.rowNameBlock}>
                    <Text
                      type={item.isMe ? "barlowHard" : undefined}
                      style={[styles.rowName, item.isMe && styles.rowNameMe]}
                    >
                      {item.isMe ? `${item.username} (나)` : item.username}
                    </Text>
                  </View>
                  <View style={styles.rowScoreBlock}>
                    <Text type="barlowHard" style={[styles.rowAvg, item.isMe && styles.rowAvgMe]}>
                      {item.averageScore.toFixed(1)}
                    </Text>
                    <Text style={styles.rowHcp}>{item.averageDelta >= 0 ? "+" : ""}{item.averageDelta.toFixed(1)}</Text>
                  </View>
                </View>
                {index < leaderboard.length - 1 && (
                  <View style={styles.rowDivider} />
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  fixedHeader: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(10),
    zIndex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(14),
  },
  title: {
    color: "#F2F4F5",
    fontSize: moderateScale(FONT.xxl),
    marginBottom: moderateScale(2),
  },
  subtitle: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.xs),
  },
  closeButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: "#2A2E2E",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    color: "#8A9491",
    fontSize: moderateScale(FONT.xs),
  },
  /* My rank sticky */
  myRankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#162418",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: "#1E3D2A",
  },
  myRankNumber: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.md),
    width: moderateScale(32),
  },
  myRankNameBlock: {
    flex: 1,
  },
  myRankName: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.sm),
  },
  myRankDistrict: {
    color: "#4D7A5F",
    fontSize: moderateScale(FONT.xxs),
    marginTop: moderateScale(1),
  }, // kept for potential future use
  myRankAvg: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.md),
    marginRight: moderateScale(10),
  },
  myRankBadge: {
    backgroundColor: "#3CC06E",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
  },
  myRankBadgeText: {
    color: "#0F1010",
    fontSize: moderateScale(FONT.xxs),
    fontFamily: "Pretendard-Bold",
  },
  myRankDivider: {
    height: 1,
    backgroundColor: "#1E3D2A",
    marginBottom: moderateScale(8),
  },
  /* Column header */
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(4),
    paddingBottom: moderateScale(6),
  },
  columnHash: {
    color: "#4A5150",
    fontSize: moderateScale(FONT.xxs),
    width: moderateScale(32),
  },
  columnLabel: {
    color: "#4A5150",
    fontSize: moderateScale(FONT.xxs),
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: "#2B3230",
  },
  /* List */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(30),
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(4),
    position: "relative",
  },
  rowItemMe: {
    backgroundColor: "#162418",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(8),
  },
  meSidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: moderateScale(3),
    backgroundColor: "#3CC06E",
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: moderateScale(8),
    borderBottomLeftRadius: moderateScale(8),
  },
  rowRank: {
    color: "#4A5150",
    fontSize: moderateScale(FONT.sm),
    width: moderateScale(32),
  },
  rowRankMe: {
    color: "#3CC06E",
  },
  rowNameBlock: {
    flex: 1,
  },
  rowName: {
    color: "#C8CEC9",
    fontSize: moderateScale(FONT.sm),
  },
  rowNameMe: {
    color: "#3CC06E",
  },
  rowDistrict: {
    color: "#5A6260",
    fontSize: moderateScale(FONT.xxs),
    marginTop: moderateScale(2),
  },
  rowScoreBlock: {
    alignItems: "flex-end",
  },
  rowAvg: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.md),
  },
  rowAvgMe: {
    color: "#3CC06E",
  },
  rowHcp: {
    color: "#5A6260",
    fontSize: moderateScale(FONT.xxs),
    marginTop: moderateScale(2),
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#1C2120",
  },
});
