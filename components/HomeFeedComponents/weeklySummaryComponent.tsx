import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from '@/constants/theme';
import { useAuth } from "@/context/AuthContext";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

interface RoundRow {
  totalScore: number;
  playedAt: string;
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

interface AnimatedNumberProps {
  value: string | number;
  style?: object;
  delay?: number;
  duration?: number;
  trigger: number;
}

const AnimatedNumber = ({ value, style, delay = 0, duration = 1000, trigger }: AnimatedNumberProps) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState('0');
  
  const numericValue = useMemo(() => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  }, [value]);
  
  const isDecimal = useMemo(() => {
    return numericValue % 1 !== 0;
  }, [numericValue]);

  useEffect(() => {
    // Always reset first
    animValue.setValue(0);
    setDisplayValue(isDecimal ? '0.0' : '0');
    
    // Small timeout to ensure reset is applied before animation starts
    const timeoutId = setTimeout(() => {
      if (trigger > 0) {
        Animated.timing(animValue, {
          toValue: numericValue,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished) {
            setDisplayValue(String(value));
          }
        });
      }
    }, 10);
    
    return () => clearTimeout(timeoutId);
  }, [trigger, numericValue, delay, duration, isDecimal, value, animValue]);

  useEffect(() => {
    const listener = animValue.addListener(({ value: v }) => {
      if (isDecimal) {
        setDisplayValue(v.toFixed(1));
      } else {
        setDisplayValue(Math.round(v).toString());
      }
    });
    
    return () => animValue.removeListener(listener);
  }, [animValue, isDecimal]);

  // Handle non-numeric values (like "-")
  if (typeof value === 'string' && isNaN(parseFloat(value))) {
    return <Text type="barlowLight" style={style}>{value}</Text>;
  }

  return <Text type="barlowLight" style={style}>{displayValue}</Text>;
};

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
              totalScore: data.totalScore ?? 0,
              playedAt: data.playedAt ?? "",
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

    const scores = thisWeekRounds.map((r) => r.totalScore);
    const avgVal = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10;
    const bestVal = Math.min(...scores);

    let dLabel: string;
    let badge: string;

    if (lastWeekRounds.length === 0) {
      dLabel = "지난주 기록 없음";
      badge = "-";
    } else {
      const lastAvg =
        lastWeekRounds.reduce((s, r) => s + r.totalScore, 0) /
        lastWeekRounds.length;
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
