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

// Normalize 9-hole score to 18-hole equivalent
const normalizeTo18Holes = (score: number, holesCount: number): number => {
  if (holesCount === 9) {
    return Math.round(score * 2 * 10) / 10; // Double and round to 1 decimal
  }
  return score;
};

export const useComputedStats = (rounds: RoundData[]) => {
  const stats = useMemo<ComputedStats>(() => {
    const totalRounds = rounds.length;

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

    // Average score (all rounds, normalized to 18 holes)
    const normalizedScores = rounds.map((r) => normalizeTo18Holes(r.totalScore, r.holesCount));
    const avgScore = Math.round(
      (normalizedScores.reduce((a, b) => a + b, 0) / totalRounds) * 10
    ) / 10;

    // Best round (18-hole only)
    const eighteenHoleRounds = rounds.filter((r) => r.holesCount === 18);
    const bestRound =
      eighteenHoleRounds.length > 0
        ? Math.min(...eighteenHoleRounds.map((r) => r.totalScore))
        : null;

    // Average delta
    const deltas = rounds.map((r) => {
      const totalPar = r.holeScores?.reduce((s, h) => s + h.par, 0) || r.appliedPar;
      return r.totalScore - totalPar;
    });
    const avgDelta =
      Math.round((deltas.reduce((a, b) => a + b, 0) / totalRounds) * 10) / 10;

    // Total birdies
    const totalBirdies = rounds.reduce(
      (sum, r) => sum + (r.holeScores?.filter((h) => h.score < h.par).length || 0),
      0
    );

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
  }, [rounds]);

  const trend = useMemo<TrendPoint[]>(() => {
    if (rounds.length === 0) return [];

    // Group by month using YYYY-MM format for proper sorting (with normalized scores)
    const byMonth: Record<string, { scores: number[]; label: string }> = {};
    rounds.forEach((r) => {
      const date = new Date(r.playedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getMonth() + 1}월`;
      if (!byMonth[key]) byMonth[key] = { scores: [], label };
      byMonth[key].scores.push(normalizeTo18Holes(r.totalScore, r.holesCount));
    });

    // Find date range
    const dates = rounds.map((r) => new Date(r.playedAt));
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
  }, [rounds]);

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

  // Score distribution (all rounds normalized to 18 holes)
  const scoreDistribution = useMemo(() => {
    const buckets: Record<string, number> = {
      '<66': 0,
      '66': 0,
      '67-69': 0,
      '70-72': 0,
      '73+': 0,
    };

    rounds.forEach((r) => {
      const normalizedScore = normalizeTo18Holes(r.totalScore, r.holesCount);
      if (normalizedScore < 66) buckets['<66']++;
      else if (normalizedScore === 66) buckets['66']++;
      else if (normalizedScore <= 69) buckets['67-69']++;
      else if (normalizedScore <= 72) buckets['70-72']++;
      else buckets['73+']++;
    });

    const maxCount = Math.max(...Object.values(buckets), 1);
    const colors = ['#4B5452', '#44BE74', '#54B387', '#4A5050', '#404746'];

    return Object.entries(buckets).map(([label, count], i) => ({
      label,
      count,
      barColor: colors[i],
      height: count > 0 ? Math.max((count / maxCount) * 78, 10) : 10,
    }));
  }, [rounds]);

  // Per-round stats (birdies, pars, bogeys, doubles per round)
  const perRoundStats = useMemo(() => {
    if (rounds.length === 0) return [];

    const totals = rounds.reduce(
      (acc, r) => {
        r.holeScores?.forEach((h) => {
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

    const totalHoles = rounds.reduce((s, r) => s + (r.holeScores?.length || 0), 0);

    return [
      {
        label: '라운드당 버디',
        value: totalHoles > 0 ? (totals.birdies / rounds.length) : 0,
        max: 3,
        color: '#45D07F',
      },
      {
        label: '라운드당 파',
        value: totalHoles > 0 ? (totals.pars / rounds.length) : 0,
        max: 15,
        color: '#B7BCB9',
      },
      {
        label: '라운드당 보기',
        value: totalHoles > 0 ? (totals.bogeys / rounds.length) : 0,
        max: 12,
        color: '#55BE96',
      },
      {
        label: '라운드당 더블보기+',
        value: totalHoles > 0 ? (totals.doubles / rounds.length) : 0,
        max: 5,
        color: '#FF4F5F',
      },
    ];
  }, [rounds]);

  // Birdie trend: monthly birdie counts over last 6 months
  const birdieTrend = useMemo<TrendPoint[]>(() => {
    if (rounds.length === 0) return [];

    // Group birdies by month
    const byMonth: Record<string, { count: number; label: string }> = {};
    rounds.forEach((r) => {
      const date = new Date(r.playedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getMonth() + 1}월`;
      if (!byMonth[key]) byMonth[key] = { count: 0, label };
      byMonth[key].count += r.holeScores?.filter((h) => h.score < h.par).length || 0;
    });

    // Find date range
    const dates = rounds.map((r) => new Date(r.playedAt));
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
  }, [rounds]);

  return { stats, trend, birdieTrend, parAnalysis, scoreDistribution, perRoundStats };
};
