import AnimatedNumber from "@/components/AnimatedNumber";
import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from '@/constants/theme';
import { useAuth } from "@/context/AuthContext";
import { expandToPerCourseRounds } from "@/hooks/useComputedStats";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

interface RoundRow {
  id: string;
  totalScore: number;
  holesCount: number;
  playedAt: string;
  appliedPar: number;
  holeScores: { hole: number; score: number; par: number }[];
}

/** Monday 00:00 of the week containing `date` */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // shift so Mon=0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatMonthDay(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const WeeklySummaryComponent = () => {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const isFocused = useIsFocused();
  const [animationTrigger, setAnimationTrigger] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchRounds = async () => {
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
              id: d.id,
              totalScore: data.totalScore ?? 0,
              holesCount: data.holesCount ?? 18,
              playedAt: data.playedAt ?? "",
              appliedPar: data.appliedPar ?? 0,
              holeScores: data.holeScores ?? [],
            };
          })
        );
      } catch (e) {
        console.error("Failed to fetch weekly summary:", e);
      }
    };

    fetchRounds();
  }, [user?.uid]);

  const {
    weekLabel,
    roundCount,
    avg,
    best,
    deltaLabel,
    badgeText,
    compLabel,
  } = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const wLabel = `${formatMonthDay(thisWeekStart)} - ${formatMonthDay(thisWeekEnd)}`;

    const thisWeekRounds = rounds.filter((r) => {
      const d = new Date(r.playedAt);
      return d >= thisWeekStart && d <= now;
    });
    const lastWeekRounds = rounds.filter((r) => {
      const d = new Date(r.playedAt);
      return d >= lastWeekStart && d <= lastWeekEnd;
    });

    if (thisWeekRounds.length === 0) {
      return {
        weekLabel: wLabel,
        roundCount: "0",
        avg: "-",
        best: "-",
        deltaLabel: "지난주 기록 없음",
        badgeText: "-",
        compLabel: "지난주\n대비",
      };
    }

    // Expand each scan into per-course (9-hole) entries so averages and "best"
    // are comparable across 1-course and 2-course scans.
    const toRoundData = (r: RoundRow) => ({
      id: r.id,
      courseName: "",
      totalScore: r.totalScore,
      holesCount: r.holesCount,
      playedAt: r.playedAt,
      appliedPar: r.appliedPar,
      diff: 0,
      holeScores: r.holeScores,
      birdieCount: 0,
      doubleCount: 0,
    });

    const thisWeekCourses = expandToPerCourseRounds(thisWeekRounds.map(toRoundData));
    const lastWeekCourses = expandToPerCourseRounds(lastWeekRounds.map(toRoundData));

    const scores = thisWeekCourses.map((c) => c.score);
    const avgVal = scores.length > 0
      ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
      : 0;
    const bestVal = scores.length > 0 ? Math.min(...scores) : 0;

    let dLabel: string;
    let badge: string;

    if (lastWeekCourses.length === 0) {
      dLabel = "지난주 기록 없음";
      badge = "-";
    } else {
      const lastAvg =
        lastWeekCourses.reduce((s, c) => s + c.score, 0) /
        lastWeekCourses.length;
      const diff = Math.round((avgVal - lastAvg) * 10) / 10;
      if (diff > 0) {
        dLabel = `+${diff}타`;
        badge = `↓ ${diff}타`;
      } else if (diff < 0) {
        dLabel = `${diff}타`;
        badge = `↑ ${Math.abs(diff)}타`;
      } else {
        dLabel = "동일";
        badge = "±0";
      }
    }

    return {
      weekLabel: wLabel,
      roundCount: String(thisWeekRounds.length),
      avg: String(avgVal),
      best: String(bestVal),
      deltaLabel: dLabel,
      badgeText: badge,
      compLabel: "지난주\n대비",
    };
  }, [rounds]);

  // Trigger animation when tab is focused
  useEffect(() => {
    if (isFocused) {
      setAnimationTrigger(prev => prev + 1);
    }
  }, [isFocused]);

  return (
    <LinearGradient
      colors={["#082017", "#062016", "#0E2E20"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerLabel}>이번 주 요약</Text>
          <Text type="barlowHard" style={styles.weekRange}>
            {weekLabel}
          </Text>
        </View>

        <View style={styles.deltaBadge}>
          <Text type="barlowLight" style={styles.deltaBadgeText}>
            {badgeText}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <AnimatedNumber 
            style={styles.statValue}
            value={roundCount}
            delay={0}
            duration={1000}
            trigger={animationTrigger}
          />
          <Text style={styles.statLabel}>라운드</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.statItem}>
          <AnimatedNumber 
            style={styles.statValue}
            value={avg}
            delay={150}
            duration={1000}
            trigger={animationTrigger}
          />
          <Text style={styles.statLabel}>평균</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.statItem}>
          <AnimatedNumber 
            style={styles.statValueAccent}
            value={best}
            delay={300}
            duration={1000}
            trigger={animationTrigger}
          />
          <Text style={styles.statLabel}>최고</Text>
        </View>

        <View style={styles.separator} />

        <View style={[styles.statItem, styles.comparisonStatItem]}>
          <Text type="barlowLight" style={styles.statValueAccentKor}>
            {compLabel}
          </Text>
          <Text style={styles.statLabel}>{deltaLabel}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(18),
    borderWidth: moderateScale(0.5),
    borderColor: "#1F5A40",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLabel: {
    color: "#53D39A",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(6),
  },
  weekRange: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.lg),
  },
  deltaBadge: {
    backgroundColor: "#174D37",
    borderColor: "#2C7453",
    borderWidth: moderateScale(0.5),
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
  },
  deltaBadgeText: {
    color: "#56E6A5",
    fontSize: moderateScale(FONT.sm),
  },
  statsRow: {
    marginTop: moderateScale(16),
    flexDirection: "row",
    alignItems: "stretch",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  comparisonStatItem: {
    flex: 1.15,
    minWidth: moderateScale(50),
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.xl),
  },
  statValueAccent: {
    color: "#45DB96",
    fontSize: moderateScale(FONT.xl),
  },
  statValueAccentKor: {
    color: "#45DB96",
    fontSize: moderateScale(FONT.lg),
  },
  statLabel: {
    marginTop: moderateScale(4),
    color: "#83968C",
    fontSize: moderateScale(FONT.xxs),
  },
  separator: {
    width: moderateScale(1),
    backgroundColor: "#245740",
    marginHorizontal: moderateScale(8),
  },
});

export default WeeklySummaryComponent;
