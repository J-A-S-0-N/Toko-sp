import { db } from '@/config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

interface RoundData {
  totalScore: number;
  playedAt: string;
  holeScores: { hole: number; score: number; par: number }[];
}

interface StatsData {
  averageScore: number;
  bestScore: number;
  roundsPlayed: number;
  totalStrokes: number;
  averageDelta: number;
  lastUpdated: ReturnType<typeof serverTimestamp>;
  weekStartDate?: Date;
  weekEndDate?: Date;
  month?: Date;
}

export interface RankingContext {
  city: string | null;
  username: string;
}

function isSameWeek(date1: Date, date2: Date): boolean {
  const weekStart1 = new Date(date1);
  weekStart1.setDate(date1.getDate() - date1.getDay());
  weekStart1.setHours(0, 0, 0, 0);

  const weekStart2 = new Date(date2);
  weekStart2.setDate(date2.getDate() - date2.getDay());
  weekStart2.setHours(0, 0, 0, 0);

  return weekStart1.getTime() === weekStart2.getTime();
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

function calculateIncrementalAverage(oldAvg: number, oldCount: number, newScore: number): number {
  if (oldCount === 0) return newScore;
  const totalStrokes = oldAvg * oldCount + newScore;
  return Math.round((totalStrokes / (oldCount + 1)) * 10) / 10;
}

function calculateAverageDeltaIncremental(
  oldAverageDelta: number,
  oldRounds: number,
  newRound: RoundData
): number {
  const totalPar = newRound.holeScores.reduce((sum, h) => sum + h.par, 0);
  const newDelta = newRound.totalScore - totalPar;

  if (oldRounds === 0) return newDelta;

  const totalDeltaSum = oldAverageDelta * oldRounds + newDelta;
  return Math.round((totalDeltaSum / (oldRounds + 1)) * 10) / 10;
}

export async function incrementUserStats(userId: string, newRound: RoundData, rankingContext: RankingContext): Promise<void> {
  // Get current stats - direct document paths
  const [allTimeSnap, weeklySnap, monthlySnap] = await Promise.all([
    getDoc(doc(db, 'Users', userId, 'Stats', 'AllTimeScore')),
    getDoc(doc(db, 'Users', userId, 'Stats', 'WeeklyScore')),
    getDoc(doc(db, 'Users', userId, 'Stats', 'MonthlyScore')),
  ]);

  const now = new Date();
  const roundDate = new Date(newRound.playedAt);

  // Update AllTimeScore
  const allTimeStats = allTimeSnap.data() as StatsData | undefined;
  const allTimeRounds = allTimeStats?.roundsPlayed ?? 0;
  const allTimeAvg = allTimeStats?.averageScore ?? 0;
  const allTimeBest = allTimeStats?.bestScore ?? Infinity;

  const newAllTimeStats: StatsData = {
    averageScore: calculateIncrementalAverage(allTimeAvg, allTimeRounds, newRound.totalScore),
    bestScore: Math.min(allTimeBest, newRound.totalScore),
    roundsPlayed: allTimeRounds + 1,
    totalStrokes: (allTimeStats?.totalStrokes ?? 0) + newRound.totalScore,
    averageDelta: calculateAverageDeltaIncremental(allTimeStats?.averageDelta ?? 0, allTimeRounds, newRound),
    lastUpdated: serverTimestamp(),
  };

  // Update WeeklyScore
  const weeklyStats = weeklySnap.data() as StatsData | undefined;
  const weeklyRounds = weeklyStats?.roundsPlayed ?? 0;
  const weeklyAvg = weeklyStats?.averageScore ?? 0;
  const weeklyBest = weeklyStats?.bestScore ?? Infinity;

  let newWeeklyStats: StatsData;
  const weeklyWeekStart = weeklyStats?.weekStartDate;

  if (weeklyWeekStart && isSameWeek(new Date(weeklyWeekStart), roundDate)) {
    // Same week - increment
    newWeeklyStats = {
      averageScore: calculateIncrementalAverage(weeklyAvg, weeklyRounds, newRound.totalScore),
      bestScore: Math.min(weeklyBest, newRound.totalScore),
      roundsPlayed: weeklyRounds + 1,
      totalStrokes: (weeklyStats?.totalStrokes ?? 0) + newRound.totalScore,
      averageDelta: calculateAverageDeltaIncremental(weeklyStats?.averageDelta ?? 0, weeklyRounds, newRound),
      lastUpdated: serverTimestamp(),
      weekStartDate: weeklyStats?.weekStartDate,
      weekEndDate: weeklyStats?.weekEndDate,
    };
  } else {
    // New week - reset
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const totalPar = newRound.holeScores.reduce((sum, h) => sum + h.par, 0);
    const initialDelta = newRound.totalScore - totalPar;

    newWeeklyStats = {
      averageScore: newRound.totalScore,
      bestScore: newRound.totalScore,
      roundsPlayed: 1,
      totalStrokes: newRound.totalScore,
      averageDelta: initialDelta,
      lastUpdated: serverTimestamp(),
      weekStartDate: weekStart,
      weekEndDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    };
  }

  // Update MonthlyScore
  const monthlyStats = monthlySnap.data() as StatsData | undefined;
  const monthlyRounds = monthlyStats?.roundsPlayed ?? 0;
  const monthlyAvg = monthlyStats?.averageScore ?? 0;
  const monthlyBest = monthlyStats?.bestScore ?? Infinity;

  let newMonthlyStats: StatsData;
  const monthlyMonth = monthlyStats?.month;

  if (monthlyMonth && isSameMonth(new Date(monthlyMonth), roundDate)) {
    // Same month - increment
    newMonthlyStats = {
      averageScore: calculateIncrementalAverage(monthlyAvg, monthlyRounds, newRound.totalScore),
      bestScore: Math.min(monthlyBest, newRound.totalScore),
      roundsPlayed: monthlyRounds + 1,
      totalStrokes: (monthlyStats?.totalStrokes ?? 0) + newRound.totalScore,
      averageDelta: calculateAverageDeltaIncremental(monthlyStats?.averageDelta ?? 0, monthlyRounds, newRound),
      lastUpdated: serverTimestamp(),
      month: monthlyStats?.month,
    };
  } else {
    // New month - reset
    const totalPar = newRound.holeScores.reduce((sum, h) => sum + h.par, 0);
    const initialDelta = newRound.totalScore - totalPar;

    newMonthlyStats = {
      averageScore: newRound.totalScore,
      bestScore: newRound.totalScore,
      roundsPlayed: 1,
      totalStrokes: newRound.totalScore,
      averageDelta: initialDelta,
      lastUpdated: serverTimestamp(),
      month: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }

  // Write all updates - direct document paths
  const writes: Promise<void>[] = [
    setDoc(doc(db, 'Users', userId, 'Stats', 'AllTimeScore'), newAllTimeStats),
    setDoc(doc(db, 'Users', userId, 'Stats', 'WeeklyScore'), newWeeklyStats),
    setDoc(doc(db, 'Users', userId, 'Stats', 'MonthlyScore'), newMonthlyStats),
  ];

  // Write ranking entry (only if user has a city set)
  if (rankingContext.city) {
    writes.push(
      setDoc(doc(db, 'RankingEntries', userId), {
        uid: userId,
        username: rankingContext.username,
        city: rankingContext.city,
        averageDelta: newAllTimeStats.averageDelta,
        averageScore: newAllTimeStats.averageScore,
        gamesPlayed: newAllTimeStats.roundsPlayed,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    );
  }

  await Promise.all(writes);
}
