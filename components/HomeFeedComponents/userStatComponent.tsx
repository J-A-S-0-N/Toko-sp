import { db } from "@/config/firebase";
import { FONT } from '@/constants/theme';
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { ThemedText as Text } from "../themed-text";

interface RoundRow {
  totalScore: number;
  holesCount: number;
  playedAt: string;
}

const UserStatComponent = () => {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<RoundRow[]>([]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetch = async () => {
      try {
        const q = query(
          collection(db, "Scans"),
          where("userId", "==", user.uid),
          where("status", "==", "completed"),
          orderBy("playedAt", "desc")
        );
        const snap = await getDocs(q);
        setRounds(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              totalScore: data.totalScore ?? 0,
              holesCount: data.holesCount ?? 18,
              playedAt: data.playedAt ?? "",
            };
          })
        );
      } catch (e) {
        console.error("Failed to fetch user stats:", e);
      }
    };

    fetch();
  }, [user?.uid]);

  const { best, avg, delta, deltaLabel } = useMemo(() => {
    if (rounds.length === 0) {
      return { best: "-", avg: "-", delta: "-", deltaLabel: "저번달 대비 -/+" };
    }

    // Lowest score among 18-hole rounds
    const eighteenHoleScores = rounds
      .filter((r) => r.holesCount === 18)
      .map((r) => r.totalScore);

    const bestVal =
      eighteenHoleScores.length > 0
        ? Math.min(...eighteenHoleScores)
        : "-";

    // Overall average
    const avgVal =
      Math.round(
        (rounds.reduce((s, r) => s + r.totalScore, 0) / rounds.length) * 10
      ) / 10;

    // Month-over-month delta
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthScores = rounds.filter((r) => {
      const d = new Date(r.playedAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const lastMonthScores = rounds.filter((r) => {
      const d = new Date(r.playedAt);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    let deltaVal: string;
    let dLabel = "저번달 대비 -/+";

    if (thisMonthScores.length === 0 && lastMonthScores.length === 0) {
      deltaVal = "-";
    } else if (lastMonthScores.length === 0) {
      // Fresh or single-month user – no previous month to compare
      deltaVal = "-";
      dLabel = "저번달 기록 없음";
    } else if (thisMonthScores.length === 0) {
      deltaVal = "-";
      dLabel = "이번달 기록 없음";
    } else {
      const thisAvg =
        thisMonthScores.reduce((s, r) => s + r.totalScore, 0) /
        thisMonthScores.length;
      const lastAvg =
        lastMonthScores.reduce((s, r) => s + r.totalScore, 0) /
        lastMonthScores.length;
      const diff = Math.round((thisAvg - lastAvg) * 10) / 10;
      deltaVal = diff > 0 ? `+${diff}` : diff === 0 ? "E" : `${diff}`;
    }

    return { best: bestVal, avg: avgVal, delta: deltaVal, deltaLabel: dLabel };
  }, [rounds]);

  const deltaColor =
    typeof delta === "string" && delta.startsWith("-")
      ? "#3DBF6E"
      : typeof delta === "string" && delta.startsWith("+")
        ? "#E83F40"
        : "white";

  return (
    <View style={styles.container}>
      {/*best*/}
      <View style={styles.statBlock}>
        <Text type="barlowHard" style={styles.valueBest}>
          {best}
        </Text>
        <Text style={styles.label}>최저 (18홀 기준)</Text>
      </View>
      <View style={styles.separator} />
      {/*avg*/}
      <View style={styles.statBlock}>
        <Text type="barlowHard" style={styles.valueAvg}>
          {avg}
        </Text>
        <Text style={styles.label}>AVG (평균)</Text>
      </View>
      <View style={styles.separator} />
      {/*monthly round count*/}
      <View style={styles.statBlock}>
        <Text type="barlowHard" style={[styles.valueMonthly, { color: deltaColor }]}>
          {delta}
        </Text>
        <Text style={styles.label}>{deltaLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(0.5),
    borderColor: "#2E3131",
  },
  statBlock: {
    alignItems: "center",
  },
  valueBest: {
    fontSize: moderateScale(FONT.xxl),
    color: "#3DBF6E",
  },
  valueAvg: {
    fontSize: moderateScale(FONT.xxl),
    color: "white",
  },
  valueMonthly: {
    fontSize: moderateScale(FONT.xxl),
    color: "#3DBF6E",
  },
  label: {
    fontSize: moderateScale(FONT.xxs),
    color: "#6E7171",
  },
  separator: {
    width: 1,
    height: moderateScale(30),
    backgroundColor: "#2A2D2D",
  },
});

export default UserStatComponent;