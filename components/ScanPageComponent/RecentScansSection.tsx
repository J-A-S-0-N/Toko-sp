import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from '@/constants/theme';
import { useAuth } from "@/context/AuthContext";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type RecentScan = {
  id: string;
  date: string;
  course: string;
  score: number;
  diff: string;
  holeCount: number;
};

type RecentScansSectionProps = {
  scans?: RecentScan[];
};

const RecentScansSection = ({ scans: propScans }: RecentScansSectionProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [scans, setScans] = useState<RecentScan[]>(propScans ?? []);
  const [loading, setLoading] = useState(!propScans);

  useEffect(() => {
    if (propScans) return;

    const fetchRecentScans = async () => {
      try {
        const scansRef = collection(db, "Scans");
        const q = query(
          scansRef,
          where("userId", "==", user?.uid ?? ""),
          where("status", "==", "completed"),
          orderBy("playedAt", "desc"),
          limit(6)
        );
        const snapshot = await getDocs(q);

        const fetched: RecentScan[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const playedAt = data.playedAt ? new Date(data.playedAt) : new Date();
          const formattedDate = `${playedAt.getMonth() + 1}월 ${playedAt.getDate()}일`;
          const diff = data.diff ?? 0;

          return {
            id: doc.id,
            date: formattedDate,
            course: data.courseName ?? "코스명 없음",
            score: data.totalScore ?? 0,
            diff: diff > 0 ? `+${diff}` : `${diff}`,
            holeCount: data.holesCount ?? 18,
          };
        });

        setScans(fetched);
      } catch (error) {
        console.error("Failed to fetch recent scans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentScans();
  }, [user?.uid, propScans]);

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text type="barlowHard" style={styles.sectionTitle}>
          최근 스캔
        </Text>
        <TouchableOpacity onPress={() => router.push("/(modals)/allRoundsModal")}>
          <Text type="barlowLight" style={styles.sectionAction}>
            전체 보기
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#45BF8F" />
        </View>
      ) : scans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="camera" size={moderateScale(20)} color="#636A6C" />
            </View>
            <Text type="barlowHard" style={styles.emptyTitle}>
              아직 스캔 기록이 없어요
            </Text>
            <Text type="barlowLight" style={styles.emptySubtitle}>
              첫 번째 스코어카드를 스캔해보세요
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
          style={styles.recentContainer}
        >
          {scans.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recentCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/(modals)/activityModal?id=${item.id}`)}
            >
              <Text type="barlowLight" style={styles.recentDate}>
                {item.date}
              </Text>
              <Text type="barlowHard" style={styles.recentCourse}>
                {item.course}
              </Text>
              <View style={styles.scoreRow}>
                <View style={styles.scoreLeft}>
                  <Text type="barlowHard" style={styles.recentScore}>
                    {item.score}
                  </Text>
                  <Text type="barlowLight" style={styles.recentDiff}>
                    {item.diff}
                  </Text>
                </View>
                <Text type="barlowLight" style={styles.holeCount}>
                  {item.holeCount}홀
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: moderateScale(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#E5E9E6",
    fontSize: moderateScale(FONT.md),
  },
  sectionAction: {
    color: "#45BF8F",
    fontSize: moderateScale(FONT.xs),
  },
  recentContainer: {
    paddingLeft: moderateScale(10),
  },
  recentList: {
    gap: moderateScale(10),
    paddingRight: moderateScale(8),
  },
  recentCard: {
    width: moderateScale(140),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#292E31",
    backgroundColor: "#1F2222",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    gap: moderateScale(5),
  },
  recentDate: {
    color: "#636A6C",
    fontSize: moderateScale(FONT.xs),
  },
  recentCourse: {
    color: "#EDF0ED",
    fontSize: moderateScale(FONT.md),
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  scoreLeft: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: moderateScale(4),
  },
  holeCount: {
    color: "#636A6C",
    fontSize: moderateScale(FONT.xs),
    paddingBottom: moderateScale(6),
  },
  recentScore: {
    color: "#FF4E57",
    fontSize: moderateScale(FONT.h2),
  },
  recentDiff: {
    color: "#D9474F",
    fontSize: moderateScale(FONT.md),
    paddingBottom: moderateScale(6),
  },
  emptyContainer: {
    paddingHorizontal: moderateScale(10),
  },
  emptyCard: {
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#292E31",
    borderStyle: "dashed",
    paddingVertical: moderateScale(28),
    alignItems: "center",
    gap: moderateScale(8),
  },
  emptyIconCircle: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#292E31",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(4),
  },
  emptyTitle: {
    color: "#636A6C",
    fontSize: moderateScale(FONT.sm),
  },
  emptySubtitle: {
    color: "#454B4D",
    fontSize: moderateScale(FONT.xs),
  },
  loadingContainer: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
});

export default RecentScansSection;
