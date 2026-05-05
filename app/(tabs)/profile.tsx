import { ThemedText as Text } from '@/components/themed-text';
import { db } from '@/config/firebase';
import { FONT } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';

interface RoundData {
  totalScore: number;
  holesCount: number;
  courseName: string;
  playedAt: string;
  holeScores: { hole: number; score: number; par: number }[];
}

export default function ProfileScreen() {
  const { user, username } = useAuth();
  const initial = (username ?? '').slice(0, 1);

  const [averageDelta, setAverageDelta] = useState<number | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [rounds, setRounds] = useState<RoundData[]>([]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchData = async () => {
      try {
        // Fetch user doc
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

        // Fetch averageDelta from Stats
        const statsDoc = await getDoc(doc(db, 'Users', user.uid, 'Stats', 'AllTimeScore'));
        if (statsDoc.exists()) {
          const statsData = statsDoc.data();
          setAverageDelta(statsData?.averageDelta ?? null);
        }

        // Fetch completed rounds
        const q = query(
          collection(db, 'Scans'),
          where('userId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('playedAt', 'desc'),
        );
        const snap = await getDocs(q);
        setRounds(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              totalScore: data.totalScore ?? 0,
              holesCount: data.holesCount ?? 18,
              courseName: data.courseName ?? '',
              playedAt: data.playedAt ?? '',
              holeScores: data.holeScores ?? [],
            };
          }),
        );
      } catch (e) {
        console.error('Failed to fetch profile data:', e);
      }
    };

    fetchData();
  }, [user?.uid]);

  const stats = useMemo(() => {
    const roundCount = rounds.length;
    const uniqueCourses = new Set(rounds.map((r) => r.courseName).filter(Boolean)).size;

    const eighteenHoleScores = rounds
      .filter((r) => r.holesCount === 18)
      .map((r) => r.totalScore);
    const bestRound = eighteenHoleScores.length > 0 ? Math.min(...eighteenHoleScores) : null;

    const avgScore =
      roundCount > 0
        ? Math.round((rounds.reduce((s, r) => s + r.totalScore, 0) / roundCount) * 10) / 10
        : null;

    const totalBirdies = rounds.reduce((sum, r) => {
      return sum + r.holeScores.filter((h) => h.score < h.par).length;
    }, 0);

    // Longest streak: consecutive unique days with rounds
    const uniqueDays = [
      ...new Set(
        rounds
          .map((r) => r.playedAt.slice(0, 10))
          .filter(Boolean),
      ),
    ].sort();
    let longestStreak = uniqueDays.length > 0 ? 1 : 0;
    let current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diffMs = curr.getTime() - prev.getTime();
      if (diffMs === 86400000) {
        current++;
        if (current > longestStreak) longestStreak = current;
      } else {
        current = 1;
      }
    }

    return { roundCount, uniqueCourses, bestRound, avgScore, totalBirdies, longestStreak };
  }, [rounds]);
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
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
              {averageDelta != null ? `${averageDelta >= 0 ? '+' : ''}${averageDelta} 평타` : '- 평타'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.roundStatValue}>
              {stats.roundCount}
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              라운드 수
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.statValue}>
              {stats.uniqueCourses}
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              코스
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.statValue}>
              {stats.bestRound ?? '-'}
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              최저타 라운드
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.statValue}>
              {stats.avgScore ?? '-'}
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              평균 스코어
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.statValue}>
              {stats.totalBirdies}
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              총 버디
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.statValue}>
              {stats.longestStreak}
            </Text>
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
    backgroundColor: '#090B0C',
  },
  container: {
    flex: 1,
    backgroundColor: '#090B0C',
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
    backgroundColor: '#1A1F22',
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
    borderColor: '#2A2F33',
    backgroundColor: '#1A1E20',
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
