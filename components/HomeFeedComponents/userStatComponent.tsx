import { db } from "@/config/firebase";
import { FONT } from '@/constants/theme';
import { useAuth } from "@/context/AuthContext";
import { useIsFocused } from "@react-navigation/native";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { ThemedText as Text } from "../themed-text";

interface RoundRow {
  totalScore: number;
  holesCount: number;
  playedAt: string;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const DIGIT_HEIGHT = moderateScale(28);

interface RollingDigitProps {
  targetDigit: string;
  delay: number;
  trigger: number;
}

const RollingDigit = ({ targetDigit, delay, trigger }: RollingDigitProps) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const targetIndex = DIGITS.indexOf(targetDigit);
  const validTarget = targetIndex !== -1;

  useEffect(() => {
    if (!validTarget) return;
    
    // Reset to start position
    animValue.setValue(0);
    
    if (trigger > 0) {
      Animated.timing(animValue, {
        toValue: targetIndex,
        duration: 800,
        delay,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [trigger, targetIndex, delay, validTarget]);

  if (!validTarget) {
    return <Text style={styles.rollingText}>{targetDigit}</Text>;
  }

  const translateY = animValue.interpolate({
    inputRange: [0, DIGITS.length - 1],
    outputRange: [0, -(DIGITS.length - 1) * DIGIT_HEIGHT],
  });

  return (
    <View style={styles.digitContainer}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {DIGITS.map((d, i) => (
          <Text key={i} type="barlowHard" style={styles.rollingText}>{d}</Text>
        ))}
      </Animated.View>
    </View>
  );
};

interface RollingNumberProps {
  value: string | number;
  style?: object;
  delay?: number;
  trigger: number;
}

const RollingNumber = ({ value, style, delay = 0, trigger }: RollingNumberProps) => {
  const strValue = String(value);
  const chars = strValue.split('');
  
  // Check if it's a numeric value or contains special chars
  const hasOnlyDigitsAndDecimal = /^[0-9.]+$/.test(strValue);
  
  if (!hasOnlyDigitsAndDecimal) {
    return <Text type="barlowHard" style={[styles.rollingText, style]}>{value}</Text>;
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {chars.map((char, index) => {
        if (char === '.') {
          return <Text key={`dot-${index}`} type="barlowHard" style={[styles.rollingText, style]}>.</Text>;
        }
        return (
          <RollingDigit
            key={`digit-${index}`}
            targetDigit={char}
            delay={delay + index * 80}
            trigger={trigger}
          />
        );
      })}
    </View>
  );
};

const UserStatComponent = () => {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const isFocused = useIsFocused();
  const [animationTrigger, setAnimationTrigger] = useState(0);

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

  // Trigger animation when tab is focused
  useEffect(() => {
    if (isFocused) {
      setAnimationTrigger(prev => prev + 1);
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      {/*best*/}
      <View style={styles.statBlock}>
        <View style={styles.valueRow}>
          <RollingNumber 
            value={best} 
            style={styles.valueBest} 
            delay={0} 
            trigger={animationTrigger}
          />
        </View>
        <Text style={styles.label}>최저 (18홀 기준)</Text>
      </View>
      <View style={styles.separator} />
      {/*avg*/}
      <View style={styles.statBlock}>
        <View style={styles.valueRow}>
          <RollingNumber 
            value={avg} 
            style={styles.valueAvg} 
            delay={120} 
            trigger={animationTrigger}
          />
        </View>
        <Text style={styles.label}>AVG (평균)</Text>
      </View>
      <View style={styles.separator} />
      {/*monthly round count*/}
      <View style={styles.statBlock}>
        <View style={styles.valueRow}>
          <RollingNumber 
            value={delta} 
            style={[styles.valueMonthly, { color: deltaColor }]} 
            delay={240} 
            trigger={animationTrigger}
          />
        </View>
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
  valueRow: {
    height: DIGIT_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitContainer: {
    height: DIGIT_HEIGHT,
    overflow: 'hidden',
  },
  rollingText: {
    fontSize: moderateScale(FONT.xxl),
    lineHeight: DIGIT_HEIGHT,
    height: DIGIT_HEIGHT,
    textAlign: 'center',
    color: '#ECEDEE',
  },
  separator: {
    width: 1,
    height: moderateScale(30),
    backgroundColor: "#2A2D2D",
  },
});

export default UserStatComponent;