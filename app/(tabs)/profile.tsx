import { ThemedText as Text } from '@/components/themed-text';
import { db } from '@/config/firebase';
import { FONT } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useComputedStats } from '@/hooks/useComputedStats';
import { useRounds } from '@/hooks/useRounds';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';

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
    animValue.setValue(0);
    setDisplayValue(isDecimal ? '0.0' : '0');

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

  if (typeof value === 'string' && isNaN(parseFloat(value))) {
    return <Text type="barlowHard" style={style}>{value}</Text>;
  }

  return <Text type="barlowHard" style={style}>{displayValue}</Text>;
};

export default function ProfileScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { user, username } = useAuth();
  const initial = (username ?? '').slice(0, 1);
  const isFocused = useIsFocused();
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const [memberSince, setMemberSince] = useState<string | null>(null);
  
  // Use cached rounds
  const { rounds, loading: roundsLoading, clearRounds } = useRounds();
  const { stats } = useComputedStats(rounds);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchMemberSince = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'Users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const ts = data?.createdAt;
          if (ts?.toDate) {
            const d = ts.toDate() as Date;
            setMemberSince(`${d.getFullYear()}년 ${d.getMonth() + 1}월부터 회원`);
          } else if (typeof ts === 'string') {
            const d = new Date(ts);
            setMemberSince(`${d.getFullYear()}년 ${d.getMonth() + 1}월부터 회원`);
          }
        }
      } catch (e) {
        console.error('Failed to fetch member since:', e);
      }
    };

    fetchMemberSince();
  }, [user?.uid]);

  // Compute profile-specific stats from rounds
  const profileStats = useMemo(() => {
    const roundCount = rounds.length;
    const uniqueCourses = new Set(rounds.map((r) => r.courseName).filter(Boolean)).size;

    const eighteenHoleScores = rounds
      .filter((r) => r.holesCount === 18)
      .map((r) => r.totalScore);
    const bestRound = eighteenHoleScores.length > 0 ? Math.min(...eighteenHoleScores) : null;

    const avgScore = stats.averageScore;

    return { roundCount, uniqueCourses, bestRound, avgScore, totalBirdies: stats.totalBirdies, longestStreak: stats.longestStreak };
  }, [rounds, stats]);

  useEffect(() => {
    if (isFocused) {
      setAnimationTrigger(prev => prev + 1);
    }
  }, [isFocused]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + moderateScale(48) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Ionicons name="flag-outline" size={moderateScale(18)} color="#49C895" />
            <Text type="barlowHard" style={styles.brandText}>
              CADDIE
            </Text>
          </View>

          <Pressable
            style={styles.logoutChip}
            onPress={() =>
              Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
                { text: '취소', style: 'cancel' },
                {
                  text: '로그아웃',
                  style: 'destructive',
                  onPress: async () => {
                    if (user?.uid) {
                      await clearRounds();
                    }
                    await signOut(getAuth());
                    router.replace('/(auth)');
                  },
                },
              ])
            }
          >
            <Text type="barlowLight" style={styles.logoutChipText}>
              로그아웃
            </Text>
          </Pressable>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            <Text type="barlowHard" style={styles.avatarInitials}>
              {initial}
            </Text>
          </View>

          <Text type="barlowHard" style={styles.nameText}>
            {username ?? ''}
          </Text>

          <Text type="barlowLight" style={styles.memberSinceText}>
            {memberSince ?? ''}
          </Text>

          <View style={styles.handicapChip}>
            <Ionicons name="flag-outline" size={moderateScale(16)} color="#49C895" />
            <Text type="barlowLight" style={styles.handicapText}>
              {stats.averageDelta != null ? `${stats.averageDelta >= 0 ? '+' : ''}${stats.averageDelta} 평타` : '- 평타'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <AnimatedNumber
              style={styles.roundStatValue}
              value={profileStats.roundCount}
              delay={0}
              duration={1000}
              trigger={animationTrigger}
            />
            <Text type="barlowLight" style={styles.statLabel}>
              라운드 수
            </Text>
          </View>

          <View style={styles.statCard}>
            <AnimatedNumber
              style={styles.statValue}
              value={profileStats.uniqueCourses}
              delay={100}
              duration={1000}
              trigger={animationTrigger}
            />
            <Text type="barlowLight" style={styles.statLabel}>
              코스
            </Text>
          </View>

          <View style={styles.statCard}>
            <AnimatedNumber
              style={styles.statValue}
              value={profileStats.bestRound ?? '-'}
              delay={200}
              duration={1000}
              trigger={animationTrigger}
            />
            <Text type="barlowLight" style={styles.statLabel}>
              최저타 라운드
            </Text>
          </View>

          <View style={styles.statCard}>
            <AnimatedNumber
              style={styles.statValue}
              value={profileStats.avgScore ?? '-'}
              delay={300}
              duration={1000}
              trigger={animationTrigger}
            />
            <Text type="barlowLight" style={styles.statLabel}>
              평균 스코어
            </Text>
          </View>

          <View style={styles.statCard}>
            <AnimatedNumber
              style={styles.statValue}
              value={profileStats.totalBirdies}
              delay={400}
              duration={1000}
              trigger={animationTrigger}
            />
            <Text type="barlowLight" style={styles.statLabel}>
              총 버디
            </Text>
          </View>

          <View style={styles.statCard}>
            <AnimatedNumber
              style={styles.statValue}
              value={profileStats.longestStreak}
              delay={500}
              duration={1000}
              trigger={animationTrigger}
            />
            <Text type="barlowLight" style={styles.statLabel}>
              최장 연속
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1010',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F1010',
  },
  content: {
    paddingHorizontal: moderateScale(18),
    paddingBottom: moderateScale(22),
  },
  topBar: {
    marginTop: moderateScale(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  brandText: {
    color: '#E5E7E7',
    fontSize: moderateScale(FONT.xl),
    letterSpacing: moderateScale(0.5),
  },
  logoutChip: {
    borderWidth: moderateScale(0.5),
    borderColor: '#453030',
    backgroundColor: '#2A1F1F',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(5),
  },
  logoutChipText: {
    color: '#E83F40',
    fontSize: moderateScale(FONT.xs),
  },
  heroSection: {
    marginTop: moderateScale(28),
    alignItems: 'center',
  },
  avatarCircle: {
    width: moderateScale(86),
    height: moderateScale(86),
    borderRadius: moderateScale(43),
    backgroundColor: '#48B68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT.xl),
  },
  nameText: {
    marginTop: moderateScale(16),
    color: '#F2F3F3',
    fontSize: moderateScale(FONT.xl),
  },
  memberSinceText: {
    marginTop: moderateScale(8),
    color: '#656B70',
    fontSize: moderateScale(FONT.xs),
  },
  handicapChip: {
    marginTop: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    borderWidth: 1,
    borderColor: '#1B6F56',
    backgroundColor: '#0F2620',
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
  },
  handicapText: {
    color: '#49C895',
    fontSize: moderateScale(FONT.xs),
  },
  divider: {
    marginTop: moderateScale(30),
    height: 1,
    backgroundColor: '#2B3230',
  },
  statsGrid: {
    marginTop: moderateScale(18),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: moderateScale(12),
  },
  statCard: {
    width: '48.5%',
    minHeight: moderateScale(86),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: '#2B3230',
    backgroundColor: '#1F2222',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(15),
    justifyContent: 'space-between',
  },
  statValue: {
    color: '#F3F4F4',
    fontSize: moderateScale(FONT.xl),
  },
  roundStatValue: {
    color: '#D4AF37',
    fontSize: moderateScale(FONT.xl),
  },
  statLabel: {
    color: '#6D7377',
    fontSize: moderateScale(FONT.xxs),
  },
});
