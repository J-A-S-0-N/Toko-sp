import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

export interface RoundData {
  id: string;
  courseName: string;
  totalScore: number;
  holesCount: number;
  playedAt: string;
  appliedPar: number;
  diff: number;
  holeScores: { hole: number; score: number; par: number }[];
  birdieCount: number;
  doubleCount: number;
}

const getCacheKey = (uid: string) => `rounds_${uid}`;

export const useRounds = () => {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRounds = useCallback(async () => {
    if (!user?.uid) {
      setRounds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const cacheKey = getCacheKey(user.uid);

    // Try cache first
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      setRounds(JSON.parse(cached));
      setLoading(false);
      return;
    }

    // Cache miss - fetch from Firestore
    try {
      const q = query(
        collection(db, 'Scans'),
        where('userId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('playedAt', 'asc')
      );
      const snap = await getDocs(q);
      const fetchedRounds: RoundData[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          courseName: data.courseName ?? '',
          totalScore: data.totalScore ?? 0,
          holesCount: data.holesCount ?? 18,
          playedAt: data.playedAt ?? '',
          appliedPar: data.appliedPar ?? 0,
          diff: data.diff ?? 0,
          holeScores: data.holeScores ?? [],
          birdieCount: data.birdieCount ?? 0,
          doubleCount: data.doubleCount ?? 0,
        };
      });

      setRounds(fetchedRounds);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(fetchedRounds));
    } catch (e) {
      console.error('Failed to fetch rounds:', e);
    }
    setLoading(false);
  }, [user?.uid]);

  const addRound = useCallback(
    async (round: RoundData) => {
      if (!user?.uid) return;
      const cacheKey = getCacheKey(user.uid);
      const updated = [...rounds, round];
      setRounds(updated);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(updated));
    },
    [user?.uid, rounds]
  );

  const clearRounds = useCallback(async () => {
    if (!user?.uid) return;
    const cacheKey = getCacheKey(user.uid);
    await AsyncStorage.removeItem(cacheKey);
    setRounds([]);
  }, [user?.uid]);

  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    const cacheKey = getCacheKey(user.uid);
    await AsyncStorage.removeItem(cacheKey);
    await loadRounds();
  }, [user?.uid, loadRounds]);

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  return { rounds, loading, addRound, clearRounds, refresh };
};
