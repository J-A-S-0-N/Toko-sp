import { db } from '@/config/firebase';
import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';

export type EventStatus = 'ongoing' | 'upcoming' | 'ended';

export interface EventItem {
  id: string;
  status: EventStatus;
  title: string;
  subtitle: string;
  description: string;
  prize: string;
  participationMethod: string;
  startAt: Date | null;
  endAt: Date | null;
  resultSummary: string;
  winnerText: string;
  participantCount: number;
}

const EVENT_COLLECTIONS: Record<EventStatus, string> = {
  ongoing: 'EventsOngoing',
  upcoming: 'EventsUpcoming',
  ended: 'EventsEnded',
};

function toDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    const seconds = (value as { seconds?: unknown }).seconds;
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000);
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeEvent(id: string, raw: Record<string, unknown>, status: EventStatus): EventItem | null {
  if (raw.isPublished === false) {
    return null;
  }

  const participantCountRaw = raw.participantCount;
  const participantCount =
    typeof participantCountRaw === 'number' && Number.isFinite(participantCountRaw)
      ? participantCountRaw
      : 0;

  return {
    id,
    status,
    title: toString(raw.title, '이벤트 준비 중'),
    subtitle: toString(raw.subtitle),
    description: toString(raw.description, '이벤트 정보를 준비 중입니다.'),
    prize: toString(raw.prize, '-'),
    participationMethod: toString(raw.participationMethod, '-'),
    startAt: toDate(raw.startAt),
    endAt: toDate(raw.endAt),
    resultSummary: toString(raw.resultSummary, '결과 정보가 없습니다.'),
    winnerText: toString(raw.winnerText, '-'),
    participantCount,
  };
}

function sortByStartAt(items: EventItem[]): EventItem[] {
  return [...items].sort((a, b) => {
    const aTime = a.startAt?.getTime() ?? 0;
    const bTime = b.startAt?.getTime() ?? 0;
    return aTime - bTime;
  });
}

export async function fetchEventsByStatus(status: EventStatus): Promise<EventItem[]> {
  const snapshot = await getDocs(collection(db, EVENT_COLLECTIONS[status]));
  const events = snapshot.docs
    .map((eventDoc) => normalizeEvent(eventDoc.id, eventDoc.data(), status))
    .filter((event): event is EventItem => event !== null);

  return sortByStartAt(events);
}

export async function fetchPublishedEventsByStatus(): Promise<Record<EventStatus, EventItem[]>> {
  const [ongoing, upcoming, ended] = await Promise.all([
    fetchEventsByStatus('ongoing'),
    fetchEventsByStatus('upcoming'),
    fetchEventsByStatus('ended'),
  ]);

  return { ongoing, upcoming, ended };
}

export async function fetchEventById(eventId: string): Promise<EventItem | null> {
  const statuses: EventStatus[] = ['ongoing', 'upcoming', 'ended'];

  for (const status of statuses) {
    const eventRef = doc(db, EVENT_COLLECTIONS[status], eventId);
    const eventSnapshot = await getDoc(eventRef);
    if (!eventSnapshot.exists()) {
      continue;
    }

    const normalized = normalizeEvent(eventSnapshot.id, eventSnapshot.data(), status);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}
