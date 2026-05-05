import { db } from '@/config/firebase';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

export interface RankingRow {
  uid: string;
  username: string;
  averageDelta: number;
  averageScore: number;
  rank: number;
  isMe: boolean;
}

interface FetchNearbyParams {
  uid: string;
  city: string;
  myDelta: number;
  myRank: number;
  myUsername: string;
  myAverageScore: number;
  range: number;
}

export async function fetchNearbyRanking({
  uid,
  city,
  myDelta,
  myRank,
  myUsername,
  myAverageScore,
  range,
}: FetchNearbyParams): Promise<RankingRow[]> {
  // Query users with better (lower) averageDelta than me
  const aboveQuery = query(
    collection(db, 'RankingEntries'),
    where('city', '==', city),
    where('averageDelta', '<', myDelta),
    orderBy('averageDelta', 'desc'),
    limit(range)
  );

  // Query users with worse (higher) averageDelta than me
  const belowQuery = query(
    collection(db, 'RankingEntries'),
    where('city', '==', city),
    where('averageDelta', '>', myDelta),
    orderBy('averageDelta', 'asc'),
    limit(range)
  );

  const [aboveSnap, belowSnap] = await Promise.all([
    getDocs(aboveQuery),
    getDocs(belowQuery),
  ]);

  // Above results come in desc order, reverse to ascending
  const above: RankingRow[] = aboveSnap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        username: d.username ?? '',
        averageDelta: d.averageDelta ?? 0,
        averageScore: d.averageScore ?? 0,
        rank: 0,
        isMe: false,
      };
    })
    .reverse();

  // Me
  const me: RankingRow = {
    uid,
    username: myUsername,
    averageDelta: myDelta,
    averageScore: myAverageScore,
    rank: myRank,
    isMe: true,
  };

  // Below results already in ascending order
  const below: RankingRow[] = belowSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      uid: doc.id,
      username: d.username ?? '',
      averageDelta: d.averageDelta ?? 0,
      averageScore: d.averageScore ?? 0,
      rank: 0,
      isMe: false,
    };
  });

  // Combine and assign rank numbers
  const combined = [...above, me, ...below];
  const startRank = myRank - above.length;

  return combined.map((row, index) => ({
    ...row,
    rank: startRank + index,
  }));
}
