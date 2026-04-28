import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from '@/constants/theme';
import { useAuth } from "@/context/AuthContext";
import { newRoundSignal } from "@/store/newRoundSignal";
import { router } from "expo-router";
import { collection, limit as fsLimit, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { moderateScale } from "react-native-size-matters";




interface Round {
  id: string;
  date: string;
  score: number;
  coursePar: number;
  courseName: string;
  location: string;
  birdiesCnt: number;
  parsCnt: number;
  bogeyCnt: number;
  holeCnt: number;

}

export default function RecentRoundComponent() {
  const { user } = useAuth();
  const [recentRounds, setRecentRounds] = useState<Round[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(() => {
    const id = newRoundSignal.id;
    newRoundSignal.id = null;
    return id;
  });
  const [revealedId, setRevealedId] = useState<string | null>(null);

  useEffect(() => {
    if (loadingId) {
      const timer = setTimeout(() => {
        setRevealedId(loadingId);
        setLoadingId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loadingId]);

  useEffect(() => {
    const fetchRecentRounds = async () => {
      try {
        const scansRef = collection(db, "Scans");
        const q = query(
          scansRef,
          where("userId", "==", user?.uid ?? ""),
          where("status", "==", "completed"),
          orderBy("playedAt", "desc"),
          fsLimit(3)
        );
        const snapshot = await getDocs(q);

        const fetched: Round[] = snapshot.docs.map((d) => {
          const data = d.data();
          const holeScores: { hole: number; score: number; par: number }[] = data.holeScores ?? [];

          let birdies = 0, pars = 0, bogeys = 0;
          for (const h of holeScores) {
            const diff = h.score - h.par;
            if (diff <= -1) birdies++;
            else if (diff === 0) pars++;
            else if (diff >= 1) bogeys++;
          }

          return {
            id: d.id,
            date: data.playedAt ?? new Date().toISOString(),
            score: data.totalScore ?? 0,
            coursePar: data.appliedPar ?? 0,
            courseName: data.courseName ?? "코스명 없음",
            location: data.location ?? "",
            birdiesCnt: birdies,
            parsCnt: pars,
            bogeyCnt: bogeys,
            holeCnt: data.holesCount ?? 18,
          };
        });

        setRecentRounds(fetched);
      } catch (error) {
        console.error("Failed to fetch recent rounds:", error);
      }
    };

    fetchRecentRounds();
  }, [user?.uid]);

  const getScoreDelta = (score: number, coursePar: number) => {
    return score - coursePar;
  }

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderRecentRound = (round: Round) => {
    if (round.id === loadingId) {
      return (
        <View style={[styles.roundContainer, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#4CAE82" />
        </View>
      );
    }

    return (
      <Animated.View entering={round.id === revealedId ? FadeIn.duration(400) : undefined}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => router.push(`/activityModal?id=${round.id}`)}
          style={styles.roundContainer}
        >
          {/* Height 1 */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            {/* Left Side */}
            <View>
              <Text type="barlowHard" style={{ fontSize: moderateScale(FONT.lg), color: "white" }}>{round.courseName}</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: moderateScale(5),
                }}
              >
                {/* <ThemedText type="barlowLight" style={{ fontSize: moderateScale(11), color: "#6E7171" }}>{round.location}</ThemedText> */}
                <Text style={{ fontSize: moderateScale(FONT.xs), color: "#6E7171" }}>{round.location}</Text>
                <View
                  style={{ width: moderateScale(2), height: moderateScale(2), borderRadius: moderateScale(5), backgroundColor: "#6E7171" }}
                />
                <Text style={{ fontSize: moderateScale(FONT.xs), color: "#6E7171" }}>{formatDate(round.date)}</Text>
              </View>
            </View>

            {/* Right Side */}
            <Text type="barlowHard" style={{ fontSize: moderateScale(FONT.hero), color: "#E83F40" }}>{round.score}</Text>
          </View>
          {/* Height 2 */}
          {/* Score Delta */}
          <View style={{ alignItems: "flex-end" }}>
            <Text type="barlowLight" style={{ fontSize: moderateScale(FONT.xs), color: "#E83F40" }}>{getScoreDelta(round.score, round.coursePar) > 0 ? "+" : ""}{getScoreDelta(round.score, round.coursePar)}</Text>
          </View>
          {/* Separator */}
          <View
            style={{ width: "100%", height: moderateScale(1), backgroundColor: "#353838", marginVertical: moderateScale(10) }}
          />
          {/* Stats */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            {[
              { value: round.birdiesCnt, label: "버디" },
              { value: round.parsCnt, label: "파" },
              { value: round.bogeyCnt, label: "보기" },
              { value: round.holeCnt, label: "총홀수" },
            ].map((stat, index) => (
              <View key={stat.label} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                {index > 0 && (
                  <View
                    style={{
                      width: moderateScale(0.5),
                      height: moderateScale(30),
                      backgroundColor: "#353838",
                      marginHorizontal: moderateScale(4),
                    }}
                  />
                )}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text type="barlowHard" style={{ fontSize: moderateScale(FONT.xxl), color: "white" }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: moderateScale(FONT.sm), color: "#6E7171", marginTop: moderateScale(2) }}>
                    {stat.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text type="barlowLight" style={styles.title}>최근 라운드</Text>
        <Pressable onPress={() => router.push("/(modals)/allRoundsModal")}>
          <Text type="barlowLight" style={styles.viewAllLink}>전체 보기 →</Text>
        </Pressable>
      </View>
      <FlatList
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        data={recentRounds}
        renderItem={({ item }) => renderRecentRound(item)}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  roundContainer: {
    backgroundColor: "#1F2222",
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(15),
    borderWidth: moderateScale(0.5),
    borderColor: "#353838",
    //alignItems: "center",
  },
  loadingContainer: {
    minHeight: moderateScale(120),
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  title: {
    fontSize: moderateScale(FONT.sm),
    color: "#6E7171",
  },
  viewAllLink: {
    fontSize: moderateScale(FONT.xs),
    color: "#4CAE82",
  },
});
