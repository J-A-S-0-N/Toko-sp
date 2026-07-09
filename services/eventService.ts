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

export interface EventYoutubeVideoItem {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  order: number;
}

export const DEFAULT_YOUTUBE_CHANNEL_ID = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';

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

function decodeXmlEntities(input: string): string {
  return input
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function extractTagValue(xml: string, tagName: string): string {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  if (!match?.[1]) return '';
  return decodeXmlEntities(match[1].trim());
}

function parseYoutubeFeedEntries(xmlText: string): EventYoutubeVideoItem[] {
  const entries = [...xmlText.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => match[1]);

  return entries
    .map((entryXml) => {
      const videoId = extractTagValue(entryXml, 'yt:videoId');
      const title = extractTagValue(entryXml, 'title');
      const publishedAt = extractTagValue(entryXml, 'published');

      if (!videoId || !title) return null;

      return {
        id: videoId,
        title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        order: 0,
        publishedAt,
      };
    })
    .filter((item): item is EventYoutubeVideoItem & { publishedAt: string } => item !== null)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function fetchLatestYoutubeVideosByChannelId(
  channelId: string = DEFAULT_YOUTUBE_CHANNEL_ID,
  limit: number = 5,
): Promise<EventYoutubeVideoItem[]> {
  const trimmedChannelId = channelId.trim();
  if (!trimmedChannelId) return [];

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(trimmedChannelId)}`;
  const response = await fetch(feedUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube feed (${response.status}).`);
  }

  const xmlText = await response.text();
  return parseYoutubeFeedEntries(xmlText)
    .slice(0, Math.max(0, limit))
    .map((item, index) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      order: index + 1,
    }));
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
