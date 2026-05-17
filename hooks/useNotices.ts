import { db } from '@/config/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

export type NoticeType = "pinned" | "update" | "maintenance" | "event" | string;

export interface Notice {
  id: string;
  type: NoticeType;
  title: string;
  description: string;
  date: string;
  body: string[];
  highlight?: { label: string; content: string };
  hasGiveaway?: boolean;
}

interface UseNoticesReturn {
  notices: Notice[];
  loading: boolean;
  error: string | null;
  pinnedNotice: Notice | null;
  recentNotices: Notice[];
}

export const useNotices = (): UseNoticesReturn => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'Notices'),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      const fetchedNotices: Notice[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type ?? 'update',
          title: data.title ?? '',
          description: data.description ?? '',
          date: data.date ?? '',
          body: Array.isArray(data.body) ? data.body : [],
          highlight: data.highlight,
          hasGiveaway: data.hasGiveaway ?? false,
        };
      });

      setNotices(fetchedNotices);
    } catch (e) {
      console.error('Failed to fetch notices:', e);
      setError('Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, []);

  const pinnedNotice = notices.find((n) => n.type === "pinned") ?? null;
  const recentNotices = notices.filter((n) => n.type !== "pinned");

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  return { notices, loading, error, pinnedNotice, recentNotices };
};
