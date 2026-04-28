import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from '@/constants/theme';
import { useAuth } from "@/context/AuthContext";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from 'react-native-size-matters';

// ── Types ──────────────────────────────────────────────────

interface Round {
  id: string;
  courseName: string;
  date: string;
  score: number;
  delta: number;
  players?: number;
  starred?: boolean;
  streakCount?: number;
  holes: number;
}

interface MonthGroup {
  label: string;
  roundCount: number;
  rounds: Round[];
}

const FILTERS = ["전체", "이번 달", "지난 달", "베스트", "코스별"] as const;

// ── Formatting helpers ─────────────────────────────────────

function formatDayLabel(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function groupByMonth(rounds: Round[]): MonthGroup[] {
  const map = new Map<string, Round[]>();

  for (const round of rounds) {
    const parsed = new Date(round.date);
    const key = `${parsed.getFullYear()}-${parsed.getMonth()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({ ...round, date: formatDayLabel(parsed) });
  }

  return Array.from(map.entries()).map(([key, groupRounds]) => {
    const [year, month] = key.split("-").map(Number);
    return {
      label: `${year}년 ${month + 1}월`,
      roundCount: groupRounds.length,
      rounds: groupRounds,
    };
  });
}

// ── Helpers ────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score <= 79) return "#4CAE82";
  if (score <= 82) return "#D4A74A";
  return "#E83F40";
}

function getDeltaColor(delta: number): string {
  if (delta <= 6) return "#4CAE82";
  if (delta <= 9) return "#D4A74A";
  return "#E83F40";
}

function getScoreBg(score: number): string {
  if (score <= 79) return "#162E24";
  if (score <= 82) return "#2E2A18";
  return "#2E1818";
}

// ── Component ──────────────────────────────────────────────

export default function AllRoundsModal() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState(0);
  const [sortByScore, setSortByScore] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const scansRef = collection(db, "Scans");
        const q = query(
          scansRef,
          where("userId", "==", user?.uid ?? ""),
          where("status", "==", "completed"),
          orderBy("playedAt", "desc")
        );
        const snapshot = await getDocs(q);

        const fetched: Round[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            courseName: data.courseName ?? "코스명 없음",
            date: data.playedAt ?? new Date().toISOString(),
            score: data.totalScore ?? 0,
            delta: data.diff ?? 0,
            holes: data.holesCount ?? 18,
          };
        });

        setRounds(fetched);
      } catch (error) {
        console.error("Failed to fetch rounds:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRounds();
  }, [user?.uid]);

  const filteredGroups = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const applySortAndGroup = (list: Round[]) => {
      const sorted = sortByScore ? [...list].sort((a, b) => a.score - b.score) : list;
      return groupByMonth(sorted);
    };

    switch (activeFilter) {
      case 0: // 전체
        return applySortAndGroup(rounds);

      case 1: { // 이번 달
        const filtered = rounds.filter((r) => {
          const d = new Date(r.date);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });
        return applySortAndGroup(filtered);
      }

      case 2: { // 지난 달
        const filtered = rounds.filter((r) => {
          const d = new Date(r.date);
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });
        return applySortAndGroup(filtered);
      }

      case 3: { // 베스트 – one best score per month
        const monthMap = new Map<string, Round>();
        for (const round of rounds) {
          const d = new Date(round.date);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const existing = monthMap.get(key);
          if (!existing || round.score < existing.score) {
            monthMap.set(key, round);
          }
        }
        return applySortAndGroup(Array.from(monthMap.values()));
      }

      case 4: { // 코스별 – best score per course
        const courseMap = new Map<string, Round[]>();
        for (const round of rounds) {
          if (!courseMap.has(round.courseName)) courseMap.set(round.courseName, []);
          courseMap.get(round.courseName)!.push(round);
        }

        const groups: MonthGroup[] = [];
        for (const [courseName, courseRounds] of courseMap.entries()) {
          const best = courseRounds.reduce((a, b) => (a.score <= b.score ? a : b));
          const parsed = new Date(best.date);
          groups.push({
            label: courseName,
            roundCount: courseRounds.length,
            rounds: [{ ...best, date: formatDayLabel(parsed) }],
          });
        }

        if (sortByScore) groups.sort((a, b) => a.rounds[0].score - b.rounds[0].score);
        return groups;
      }

      default:
        return applySortAndGroup(rounds);
    }
  }, [rounds, activeFilter, sortByScore]);

  const totalRounds = rounds.length;
  const avgScore = rounds.length > 0
    ? Math.round((rounds.reduce((sum, r) => sum + r.score, 0) / rounds.length) * 10) / 10
    : 0;
  const bestScore = rounds.length > 0
    ? Math.min(...rounds.map((r) => r.score))
    : 0;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { backgroundColor: "#0F1010" }]}
      entering={FadeInDown.duration(200)}
    >
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Fixed header area */}
        <Animated.View style={styles.fixedHeader} onLayout={onHeaderLayout} entering={FadeInDown.delay(80).duration(350)}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="chevron-left" size={moderateScale(FONT.md)} color="#B8BEC1" />
            </Pressable>
            <Text type="barlowLight" style={styles.backLabel}>피드</Text>
          </View>

          {/* Title row */}
          <View style={styles.titleRow}>
            <View>
              <Text type="barlowHard" style={styles.title}>전체 라운드</Text>
              <Text type="barlowLight" style={styles.subtitle}>{totalRounds}개의 라운드 기록</Text>
            </View>
            <Pressable style={styles.sortButton} onPress={() => setSortByScore((prev) => !prev)}>
              <Feather name="sliders" size={moderateScale(FONT.xxs)} color="#A2AAAE" />
              <Text type="barlowLight" style={styles.sortButtonText}>{sortByScore ? "스코어순" : "날짜순"}</Text>
            </Pressable>
          </View>

          {/* Stat cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text type="barlowHard" style={styles.statValue}>{totalRounds}</Text>
              <Text type="barlowLight" style={styles.statLabel}>라운드</Text>
            </View>
            <View style={styles.statCard}>
              <Text type="barlowHard" style={styles.statValue}>{avgScore}</Text>
              <Text type="barlowLight" style={styles.statLabel}>평균</Text>
            </View>
            <View style={[styles.statCard, styles.statCardBest]}>
              <Text type="barlowHard" style={[styles.statValue, styles.statValueBest]}>{bestScore}</Text>
              <Text type="barlowLight" style={styles.statLabel}>최고</Text>
            </View>
          </View>

          {/* Filter tabs */}
          <View style={styles.filterRow}>
            {FILTERS.map((label, i) => (
              <Pressable
                key={label}
                style={[styles.filterTab, activeFilter === i && styles.filterTabActive]}
                onPress={() => setActiveFilter(i)}
              >
                <Text
                  type="barlowLight"
                  style={[styles.filterTabText, activeFilter === i && styles.filterTabTextActive]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Scrollable round list */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4CAE82" />
            </View>
          ) : filteredGroups.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text type="barlowLight" style={{ color: "#6E7171", fontSize: moderateScale(FONT.xxs) }}>기록된 라운드가 없습니다</Text>
            </View>
          ) : filteredGroups.map((group) => (
            <View key={group.label} style={styles.monthGroup}>
              <View style={styles.monthHeaderRow}>
                <Text type="barlowLight" style={styles.monthLabel}>{group.label}</Text>
                <Text type="barlowLight" style={styles.monthCount}>{group.roundCount}라운드</Text>
              </View>

              {group.rounds.map((round) => (
                <Pressable key={round.id} style={styles.roundRow} onPress={() => router.push(`/(modals)/activityModal?id=${round.id}`)}>
                  {/* Score circle */}
                  <View style={[styles.scoreCircle, { backgroundColor: getScoreBg(round.score) }]}>
                    <Text type="barlowHard" style={[styles.scoreCircleText, { color: getScoreColor(round.score) }]}>
                      {round.score}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={styles.roundInfo}>
                    <Text type="barlowHard" style={styles.roundCourseName}>{round.courseName}</Text>
                    <View style={styles.roundMeta}>
                      <Text type="barlowLight" style={styles.roundDate}>{round.date}</Text>
                      {round.starred && <Text style={styles.starIcon}>⭐</Text>}
                    </View>
                  </View>

                  {/* Right side */}
                  <View style={styles.roundRight}>
                    <Text type="barlowHard" style={[styles.roundDelta, { color: getDeltaColor(round.delta) }]}>
                      +{round.delta}
                    </Text>
                    <View style={styles.roundBadges}>
                      {round.streakCount != null && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeIcon}>🔥</Text>
                          <Text type="barlowLight" style={styles.badgeText}>{round.streakCount}</Text>
                        </View>
                      )}
                      <View style={styles.badge}>
                        <Text type="barlowLight" style={styles.badgeText}>{round.holes}홀</Text>
                      </View>
                    </View>
                  </View>

                  <Feather name="chevron-right" size={moderateScale(FONT.sm)} color="#4A5053" style={styles.chevron} />
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Fade overlay on top of scroll */}
        {headerHeight > 0 && (
          <LinearGradient
            colors={["#0F1010", "rgba(15,16,16,0)"]}
            style={[styles.fadeOverlay, { top: headerHeight }]}
            pointerEvents="none"
          />
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  fixedHeader: {
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(15),
    zIndex: 1,
  },
  fadeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    height: moderateScale(28),
    zIndex: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(14),
    paddingBottom: moderateScale(30),
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(16),
  },
  backButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E2122",
  },
  backLabel: {
    color: "#7B8083",
    fontSize: moderateScale(FONT.xs),
  },

  /* Title */
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(16),
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
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#2C3032",
    backgroundColor: "#1A1D1E",
  },
  sortButtonText: {
    color: "#A2AAAE",
    fontSize: moderateScale(FONT.xxs),
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginBottom: moderateScale(14),
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#2C3032",
    backgroundColor: "#1A1D1E",
  },
  statCardBest: {
    borderColor: "#265E45",
    backgroundColor: "#132E22",
  },
  statValue: {
    color: "#F2F4F5",
    fontSize: moderateScale(FONT.xl),
    marginBottom: moderateScale(2),
  },
  statValueBest: {
    color: "#4CAE82",
  },
  statLabel: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.xxs),
  },

  /* Filters */
  filterRow: {
    flexDirection: "row",
    gap: moderateScale(6),
    marginBottom: moderateScale(20),
  },
  filterTab: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#2C3032",
    backgroundColor: "#1A1D1E",
  },
  filterTabActive: {
    borderColor: "#4CAE82",
    backgroundColor: "#162E24",
  },
  filterTabText: {
    color: "#7B8083",
    fontSize: moderateScale(FONT.xs),
  },
  filterTabTextActive: {
    color: "#4CAE82",
  },

  /* Month group */
  monthGroup: {
    marginBottom: moderateScale(8),
  },
  monthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(10),
    paddingTop: moderateScale(6),
  },
  monthLabel: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.xs),
  },
  monthCount: {
    color: "#4A5053",
    fontSize: moderateScale(FONT.xxs),
  },

  /* Round row */
  roundRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1D1E",
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#252829",
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  scoreCircle: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(23),
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
  },
  scoreCircleText: {
    fontSize: moderateScale(FONT.md),
  },
  roundInfo: {
    flex: 1,
    gap: moderateScale(2),
  },
  roundCourseName: {
    color: "#F2F4F5",
    fontSize: moderateScale(FONT.sm),
  },
  roundMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  roundDate: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.xxs),
  },
  starIcon: {
    fontSize: moderateScale(FONT.xxs),
  },

  /* Right side */
  roundRight: {
    alignItems: "flex-end",
    marginRight: moderateScale(4),
    gap: moderateScale(4),
  },
  roundDelta: {
    fontSize: moderateScale(FONT.sm),
  },
  roundBadges: {
    flexDirection: "row",
    gap: moderateScale(4),
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(2),
    backgroundColor: "#252829",
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
  },
  badgeIcon: {
    fontSize: moderateScale(FONT.xxs),
  },
  badgeText: {
    color: "#7B8083",
    fontSize: moderateScale(FONT.xxs),
  },
  chevron: {
    marginLeft: moderateScale(2),
  },
  loadingContainer: {
    paddingVertical: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
});
