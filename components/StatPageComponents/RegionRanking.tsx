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
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

export default function RegionRanking() {
  const router = useRouter();
  const { user } = useAuth();

  const [myRank, setMyRank] = useState<number | null>(null);
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const fetchRankingSummary = async () => {
      try {
        // 1. Get current user's ranking entry
        const myEntrySnap = await getDoc(doc(db, "RankingEntries", user.uid));
        if (!myEntrySnap.exists()) {
          setLoading(false);
          return;
        }

        const myEntry = myEntrySnap.data();
        const userCity = myEntry.city as string;
        const myDelta = myEntry.averageDelta as number;
        setCity(userCity);

        // 2. Count users with lower (better) averageDelta → my rank
        const betterQuery = query(
          collection(db, "RankingEntries"),
          where("city", "==", userCity),
          where("averageDelta", "<", myDelta)
        );
        const betterSnap = await getCountFromServer(betterQuery);
        setMyRank(betterSnap.data().count + 1);

        // 3. Count total members in same city
        const totalQuery = query(
          collection(db, "RankingEntries"),
          where("city", "==", userCity)
        );
        const totalSnap = await getCountFromServer(totalQuery);
        setTotalMembers(totalSnap.data().count);

        // 4. Fetch ±2 users around me for leaderboard preview
        const rank = betterSnap.data().count + 1;
        const nearby = await fetchNearbyRanking({
          uid: user.uid,
          city: userCity,
          myDelta: myDelta,
          myRank: rank,
          myUsername: myEntry.username ?? "",
          myAverageScore: myEntry.averageScore ?? 0,
          range: 2,
        });
        setLeaderboard(nearby);
      } catch (error) {
        console.error("Failed to fetch ranking summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingSummary();
  }, [user?.uid]);

  const topPercent =
    myRank != null && totalMembers != null && totalMembers > 0
      ? Math.round((myRank / totalMembers) * 1000) / 10
      : null;

  const hasRankingData = myRank != null && totalMembers != null && city != null;

  return (
    <View style={styles.wrapper}>
      <Text type="barlowLight" style={styles.sectionTitle}>
        지역 랭킹
      </Text>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        {loading ? (
          <ActivityIndicator color="#3CC06E" style={{ paddingVertical: moderateScale(20) }} />
        ) : !hasRankingData ? (
          <Text style={styles.regionText}>라운드를 완료하면 랭킹이 표시됩니다</Text>
        ) : (
          <>
            <View style={styles.summaryTopRow}>
              <Text style={styles.regionText}>{city}</Text>
              <Text style={styles.topLabel}>상위</Text>
            </View>

            <View style={styles.summaryMidRow}>
              <View style={styles.rankRow}>
                <Text type="barlowHard" style={styles.rankNumber}>
                  #{myRank}
                </Text>
                <Text style={styles.totalMembers}> / {totalMembers}명</Text>
              </View>

              <View style={styles.percentBlock}>
                <Text type="barlowHard" style={styles.percentValue}>
                  {topPercent}%
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min((topPercent ?? 0) * 2, 100)}%` }]} />
            </View>
            <Text style={styles.progressLabel}>상위 {topPercent}%</Text>
          </>
        )}
      </View>

      {/* Leaderboard card */}
      <View style={styles.leaderCard}>
        <View style={styles.leaderHeader}>
          <Text type="barlowHard" style={styles.leaderTitle}>{city ?? "지역"} 랭킹</Text>
          {totalMembers != null && (
            <View style={styles.memberPill}>
              <Text style={styles.memberPillText}>{totalMembers}명</Text>
            </View>
          )}
        </View>

        <View style={styles.columnHeader}>
          <Text style={styles.columnHashText}>#</Text>
          <Text style={[styles.columnLabelText, { flex: 1 }]}>이름</Text>
          <Text style={styles.columnLabelText}>평균 · HCP</Text>
        </View>

        <View style={styles.divider} />

        {leaderboard.map((item, index) => (
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
                <Text
                  type="barlowHard"
                  style={[styles.rowAvg, item.isMe && styles.rowAvgMe]}
                >
                  {item.averageScore.toFixed(1)}
                </Text>
                <Text style={styles.rowHcp}>{item.averageDelta >= 0 ? "+" : ""}{item.averageDelta.toFixed(1)}</Text>
              </View>
            </View>
            {index < leaderboard.length - 1 && <View style={styles.rowDivider} />}
          </View>
        ))}

        <TouchableOpacity
          style={styles.viewAllButton}
          activeOpacity={0.7}
          onPress={() => router.push("/(modals)/rankingModal")}
        >
          <Text style={styles.viewAllText}>전체 랭킹 보기 ↓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: moderateScale(4),
  },
  sectionTitle: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.sm),
    letterSpacing: 1.2,
    marginBottom: moderateScale(8),
  },
  /* Summary card */
  summaryCard: {
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#2B3230",
    padding: moderateScale(16),
    marginBottom: moderateScale(10),
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(4),
  },
  regionText: {
    color: "#8A9491",
    fontSize: moderateScale(FONT.xs),
    letterSpacing: 0.5,
  },
  topLabel: {
    color: "#8A9491",
    fontSize: moderateScale(FONT.xs),
    letterSpacing: 0.5,
  },
  summaryMidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: moderateScale(12),
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  rankNumber: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.hero),
    lineHeight: moderateScale(FONT.hero) * 1.05,
  },
  totalMembers: {
    color: "#8A9491",
    fontSize: moderateScale(FONT.md),
    marginBottom: moderateScale(8),
    marginLeft: moderateScale(4),
  },
  percentBlock: {
    alignItems: "flex-end",
  },
  percentValue: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.xxl),
    lineHeight: moderateScale(FONT.xxl) * 1.1,
  },
  deltaText: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.xs),
    marginTop: moderateScale(2),
  },
  progressTrack: {
    height: moderateScale(6),
    backgroundColor: "#2B3230",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: moderateScale(4),
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3CC06E",
    borderRadius: 999,
  },
  progressLabel: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.xxs),
    textAlign: "right",
  },
  /* Leaderboard */
  leaderCard: {
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#2B3230",
    overflow: "hidden",
  },
  leaderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
  },
  leaderTitle: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.md),
    letterSpacing: 0.5,
  },
  memberPill: {
    backgroundColor: "#2B3230",
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
  },
  memberPillText: {
    color: "#8A9491",
    fontSize: moderateScale(FONT.xxs),
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(6),
  },
  columnHashText: {
    color: "#4A5150",
    fontSize: moderateScale(FONT.xxs),
    width: moderateScale(28),
  },
  columnLabelText: {
    color: "#4A5150",
    fontSize: moderateScale(FONT.xxs),
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#2B3230",
    marginHorizontal: moderateScale(16),
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    position: "relative",
  },
  rowItemMe: {
    backgroundColor: "#162418",
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
  },
  rowRank: {
    color: "#4A5150",
    fontSize: moderateScale(FONT.sm),
    width: moderateScale(28),
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
    backgroundColor: "#232727",
    marginHorizontal: moderateScale(16),
  },
  viewAllButton: {
    alignItems: "center",
    paddingVertical: moderateScale(14),
    borderTopWidth: 1,
    borderTopColor: "#2B3230",
    marginTop: moderateScale(4),
  },
  viewAllText: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.sm),
    letterSpacing: 0.5,
  },
});
