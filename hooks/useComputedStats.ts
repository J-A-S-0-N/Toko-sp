import { useMemo } from 'react';
import { RoundData } from './useRounds';

export interface TrendPoint {
  month: string;
  value: number | null;
}

export interface ComputedStats {
  totalRounds: number;
  averageScore: number | null;
  bestRound: number | null;
  averageDelta: number | null;
  totalBirdies: number;
  longestStreak: number;
  currentStreak: number;
}

export interface ScoreCountItem {
  label: string;
  count: number;
  prevMonthCount: number;
  delta: number;
  valueColor: string;
}

export interface PerCourseRound {
  sourceId: string;
  course: "A" | "B" | "single";
  score: number;
  par: number;
  delta: number;
  birdies: number;
  holeScores: { hole: number; score: number; par: number }[];
  playedAt: string;
}

// Expand each round into one entry per 9-hole course.
// 9-hole rounds yield 1 entry (course: "single").
// 18-hole rounds yield 2 entries (course "A" for holes 1–9, "B" for holes 10–18).
export const expandToPerCourseRounds = (rounds: RoundData[]): PerCourseRound[] => {
  const out: PerCourseRound[] = [];
  for (const r of rounds) {
    const holes = r.holeScores ?? [];
    if (r.holesCount === 18) {
      const a = holes.filter((h) => h.hole <= 9);
      const b = holes.filter((h) => h.hole >= 10);
      const aScore = a.reduce((s, h) => s + h.score, 0);
      const aPar = a.reduce((s, h) => s + h.par, 0);
      const bScore = b.reduce((s, h) => s + h.score, 0);
      const bPar = b.reduce((s, h) => s + h.par, 0);
      out.push({
        sourceId: r.id,
        course: "A",
        score: aScore,
        par: aPar,
        delta: aScore - aPar,
        birdies: a.filter((h) => h.score < h.par).length,
        holeScores: a,
        playedAt: r.playedAt,
      });
      out.push({
        sourceId: r.id,
        course: "B",
        score: bScore,
        par: bPar,
        delta: bScore - bPar,
        birdies: b.filter((h) => h.score < h.par).length,
        holeScores: b,
        playedAt: r.playedAt,
      });
    } else {
      const totalPar = holes.reduce((s, h) => s + h.par, 0) || r.appliedPar;
      out.push({
        sourceId: r.id,
        course: "single",
        score: r.totalScore,
        par: totalPar,
        delta: r.totalScore - totalPar,
        birdies: holes.filter((h) => h.score < h.par).length,
        holeScores: holes,
        playedAt: r.playedAt,
      });
    }
  }
  return out;
};

export const useComputedStats = (rounds: RoundData[]) => {
  const perCourseRounds = useMemo(() => expandToPerCourseRounds(rounds), [rounds]);

  const stats = useMemo<ComputedStats>(() => {
    const totalRounds = rounds.length;
    const perCourseCount = perCourseRounds.length;

    if (totalRounds === 0) {
      return {
        totalRounds: 0,
        averageScore: null,
        bestRound: null,
        averageDelta: null,
        totalBirdies: 0,
        longestStreak: 0,
        currentStreak: 0,
      };
    }

    // Per-course average score (each Course A or Course B is one entry)
    const avgScore = perCourseCount > 0
      ? Math.round(
          (perCourseRounds.reduce((a, r) => a + r.score, 0) / perCourseCount) * 10
        ) / 10
      : null;

    // Best per-course score across all rounds
    const bestRound = perCourseCount > 0
      ? Math.min(...perCourseRounds.map((r) => r.score))
      : null;

    // Per-course average delta
    const avgDelta = perCourseCount > 0
      ? Math.round(
          (perCourseRounds.reduce((a, r) => a + r.delta, 0) / perCourseCount) * 10
        ) / 10
      : null;

    // Total birdies across all courses
    const totalBirdies = perCourseRounds.reduce((sum, r) => sum + r.birdies, 0);

    // Streak calculation
    const uniqueDays = [...new Set(rounds.map((r) => r.playedAt.slice(0, 10)).filter(Boolean))].sort();
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

    // Current streak (consecutive days ending today or yesterday)
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let currentStreak = 0;
    if (uniqueDays.includes(today)) {
      currentStreak = 1;
      for (let i = uniqueDays.length - 2; i >= 0; i--) {
        const curr = new Date(uniqueDays[i + 1]);
        const prev = new Date(uniqueDays[i]);
        if (curr.getTime() - prev.getTime() === 86400000) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else if (uniqueDays.includes(yesterday)) {
      currentStreak = 1;
      for (let i = uniqueDays.length - 2; i >= 0; i--) {
        const curr = new Date(uniqueDays[i + 1]);
        const prev = new Date(uniqueDays[i]);
        if (curr.getTime() - prev.getTime() === 86400000) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      totalRounds,
      averageScore: avgScore,
      bestRound,
      averageDelta: avgDelta,
      totalBirdies,
      longestStreak,
      currentStreak,
    };
  }, [rounds, perCourseRounds]);

  const trend = useMemo<TrendPoint[]>(() => {
    if (perCourseRounds.length === 0) return [];

    // Group per-course scores by month (each course A/B counts as its own data point)
    const byMonth: Record<string, { scores: number[]; label: string }> = {};
    perCourseRounds.forEach((r) => {
      const date = new Date(r.playedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getMonth() + 1}월`;
      if (!byMonth[key]) byMonth[key] = { scores: [], label };
      byMonth[key].scores.push(r.score);
    });

    // Find date range
    const dates = perCourseRounds.map((r) => new Date(r.playedAt));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Generate all months in range, fill gaps with null
    const points: TrendPoint[] = [];
    let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const monthData = byMonth[key];

      points.push({
        month: monthData?.label || `${current.getMonth() + 1}월`,
        value: monthData
          ? Math.round(monthData.scores.reduce((a, b) => a + b, 0) / monthData.scores.length)
          : null,
      });

      current.setMonth(current.getMonth() + 1);
    }

    // Return last 6 months (or fewer if less data)
    return points.slice(-6);
  }, [perCourseRounds]);

  // Score counts (birdies, pars, bogeys, doubles) with month-over-month comparison
  const parAnalysis = useMemo<ScoreCountItem[]>(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const prevMonth = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 7);

    // Count scores by month
    const countByMonth: Record<string, { birdies: number; pars: number; bogeys: number; doubles: number }> = {};

    rounds.forEach((r) => {
      const month = r.playedAt.slice(0, 7);
      if (!countByMonth[month]) {
        countByMonth[month] = { birdies: 0, pars: 0, bogeys: 0, doubles: 0 };
      }

      r.holeScores?.forEach((h) => {
        const diff = h.score - h.par;
        if (diff <= -1) countByMonth[month].birdies++;
        else if (diff === 0) countByMonth[month].pars++;
        else if (diff === 1) countByMonth[month].bogeys++;
        else countByMonth[month].doubles++;
      });
    });

    const current = countByMonth[currentMonth] || { birdies: 0, pars: 0, bogeys: 0, doubles: 0 };
    const previous = countByMonth[prevMonth] || { birdies: 0, pars: 0, bogeys: 0, doubles: 0 };

    const items = [
      { label: '버디', count: current.birdies, prev: previous.birdies, color: '#45D07F' },
      { label: '파', count: current.pars, prev: previous.pars, color: '#B7BCB9' },
      { label: '보기', count: current.bogeys, prev: previous.bogeys, color: '#55BE96' },
      { label: '더블+', count: current.doubles, prev: previous.doubles, color: '#FF4F5F' },
    ];

    return items.map((item) => ({
      label: item.label,
      count: item.count,
      prevMonthCount: item.prev,
      delta: item.count - item.prev,
      valueColor: item.color,
    }));
  }, [rounds]);

  // Score distribution per 9-hole course (par-36 scale)
  const scoreDistribution = useMemo(() => {
    const buckets: Record<string, number> = {
      '<33': 0,
      '33': 0,
      '34-35': 0,
      '36': 0,
      '37+': 0,
    };

    perCourseRounds.forEach((r) => {
      const s = r.score;
      if (s < 33) buckets['<33']++;
      else if (s === 33) buckets['33']++;
      else if (s <= 35) buckets['34-35']++;
      else if (s === 36) buckets['36']++;
      else buckets['37+']++;
    });

    const maxCount = Math.max(...Object.values(buckets), 1);
    const colors = ['#4B5452', '#44BE74', '#54B387', '#4A5050', '#404746'];

    return Object.entries(buckets).map(([label, count], i) => ({
      label,
      count,
      barColor: colors[i],
      height: count > 0 ? Math.max((count / maxCount) * 78, 10) : 10,
    }));
  }, [perCourseRounds]);

  // Per-course stats (birdies, pars, bogeys, doubles per 9-hole course)
  const perRoundStats = useMemo(() => {
    if (perCourseRounds.length === 0) return [];

    const totals = perCourseRounds.reduce(
      (acc, r) => {
        r.holeScores.forEach((h) => {
          const diff = h.score - h.par;
          if (diff <= -1) acc.birdies++;
          else if (diff === 0) acc.pars++;
          else if (diff === 1) acc.bogeys++;
          else acc.doubles++;
        });
        return acc;
      },
      { birdies: 0, pars: 0, bogeys: 0, doubles: 0 }
    );

    const courseCount = perCourseRounds.length;

    return [
      {
        label: '코스당 버디',
        value: courseCount > 0 ? (totals.birdies / courseCount) : 0,
        max: 2,
        color: '#45D07F',
      },
      {
        label: '코스당 파',
        value: courseCount > 0 ? (totals.pars / courseCount) : 0,
        max: 8,
        color: '#B7BCB9',
      },
      {
        label: '코스당 보기',
        value: courseCount > 0 ? (totals.bogeys / courseCount) : 0,
        max: 6,
        color: '#55BE96',
      },
      {
        label: '코스당 더블보기+',
        value: courseCount > 0 ? (totals.doubles / courseCount) : 0,
        max: 3,
        color: '#FF4F5F',
      },
    ];
  }, [perCourseRounds]);

  // Birdie trend: monthly birdie counts over last 6 months
  const birdieTrend = useMemo<TrendPoint[]>(() => {
    if (perCourseRounds.length === 0) return [];

    // Group birdies by month (counting all birdies across courses)
    const byMonth: Record<string, { count: number; label: string }> = {};
    perCourseRounds.forEach((r) => {
      const date = new Date(r.playedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getMonth() + 1}월`;
      if (!byMonth[key]) byMonth[key] = { count: 0, label };
      byMonth[key].count += r.birdies;
    });

    // Find date range
    const dates = perCourseRounds.map((r) => new Date(r.playedAt));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Generate all months in range, fill gaps with null
    const points: TrendPoint[] = [];
    let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const monthData = byMonth[key];

      points.push({
        month: monthData?.label || `${current.getMonth() + 1}월`,
        value: monthData ? monthData.count : null,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return points.slice(-6);
  }, [perCourseRounds]);

  return { stats, trend, birdieTrend, parAnalysis, scoreDistribution, perRoundStats, perCourseRounds };
};
