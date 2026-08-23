import { db } from "@/config/firebase";
import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

type CreateSwingVideoRecordParams = {
  userId: string;
  originalVideoUri: string;
  trimStartSec: number;
  trimEndSec: number;
  sourceDurationSec: number;
};

type CreateSwingVideoRecordResult = {
  swingVideoId: string;
};

type ScreenshotMeta = {
  index: number;
  sec: number;
  url: string;
  storagePath: string;
};

type SwingMetricFields = {
  addressAngleScore: number;
  headUpScore: number;
  backswingAngleScore: number;
  takebackScore: number;
};

type ParsedSwingSnapshotDoc = {
  status: string;
  analysisTitle: string;
  overallScore: number;
  metrics: SwingMetricFields;
  captureUsable: boolean;
  preferredMillis: number;
};

export type LatestSwingCoachData = {
  title: string;
  reason: string;
  oneLineCue: string;
};

export type RecentSwingSnapshotData = {
  score: number;
  points: number;
  label: string;
  subtitle: string;
  aiCoach: LatestSwingCoachData | null;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry<T>(action: () => Promise<T>, maxRetryCount: number) {
  let attempt = 0;
  while (attempt <= maxRetryCount) {
    try {
      return await action();
    } catch (error) {
      if (attempt === maxRetryCount) {
        throw error;
      }
      attempt += 1;
      await sleep(400 * attempt);
    }
  }

  throw new Error("Unexpected retry flow error");
}

async function uploadFileToStorage(storagePath: string, fileUri: string, contentType: string) {
  const storage = getStorage();
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}

async function uploadImageToStorage(storagePath: string, fileUri: string) {
  return uploadFileToStorage(storagePath, fileUri, "image/jpeg");
}

function getCaptureTimestamps(trimStartSec: number, trimEndSec: number) {
  const trimDurationSec = Math.max(0.1, trimEndSec - trimStartSec);
  const boundaries = [0, 0.25, 0.5, 0.75, 1];
  return boundaries.map((ratio) => Number((trimStartSec + trimDurationSec * ratio).toFixed(2)));
}

export async function createSwingVideoRecord(
  params: CreateSwingVideoRecordParams
): Promise<CreateSwingVideoRecordResult> {
  const storage = getStorage();
  const swingVideoRef = doc(collection(db, "SwingVideos"));
  const captureTimes = getCaptureTimestamps(params.trimStartSec, params.trimEndSec);
  const temporaryThumbnailUris: string[] = [];
  const uploadedStoragePaths: string[] = [];
  const screenshots: ScreenshotMeta[] = [];
  const trimmedDurationSec = Math.max(0.1, params.trimEndSec - params.trimStartSec);
  const trimmedVideoStoragePath = `swing-videos/${params.userId}/${swingVideoRef.id}/trimmed.mp4`;
  let trimmedVideoUrl = "";

  try {
    trimmedVideoUrl = await runWithRetry(
      () => uploadFileToStorage(trimmedVideoStoragePath, params.originalVideoUri, "video/mp4"),
      2
    );
    uploadedStoragePaths.push(trimmedVideoStoragePath);

    for (let i = 0; i < captureTimes.length; i += 1) {
      const captureSec = captureTimes[i];
      const { uri } = await VideoThumbnails.getThumbnailAsync(params.originalVideoUri, {
        time: Math.max(0, Math.round(captureSec * 1000)),
        quality: 0.8,
      });

      temporaryThumbnailUris.push(uri);

      const storagePath = `swing-screenshots/${params.userId}/${swingVideoRef.id}/frame-${i + 1}.jpg`;
      const url = await runWithRetry(() => uploadImageToStorage(storagePath, uri), 2);
      uploadedStoragePaths.push(storagePath);

      screenshots.push({
        index: i,
        sec: captureSec,
        url,
        storagePath,
      });
    }

    await setDoc(swingVideoRef, {
      userId: params.userId,
      trimStartSec: Number(params.trimStartSec.toFixed(1)),
      trimEndSec: Number(params.trimEndSec.toFixed(1)),
      sourceDurationSec: Number(params.sourceDurationSec.toFixed(1)),
      trimmedDurationSec: Number(trimmedDurationSec.toFixed(1)),
      trimmedVideoUrl,
      trimmedVideoStoragePath,
      playbackReady: true,
      videoUploadedAt: serverTimestamp(),
      screenshots,
      screenshotCount: screenshots.length,
      status: "uploaded",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    await Promise.all(
      uploadedStoragePaths.map((path) =>
        deleteObject(ref(storage, path)).catch(() => undefined)
      )
    );
    throw error;
  } finally {
    await Promise.all(
      temporaryThumbnailUris.map((uri) =>
        FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined)
      )
    );
  }

  return {
    swingVideoId: swingVideoRef.id,
  };
}

export type RankingSwingItem = {
  id: string;
  userId: string;
  userName: string;
  userLocation: string;
  overallScore: number;
  metricScore: number;
  metricLabel: string;
  title: string;
  periodLabel: string;
  thumbnailUrl: string;
  videoUrl: string;
  createdAt: any;
};

type RankingMetricField =
  | "overallScore"
  | "addressAngleScore"
  | "takebackScore"
  | "headUpScore";

type RankingCategory = {
  field: RankingMetricField;
  label: string;
  title: string;
};

type RankingCandidate = {
  id: string;
  userId: string;
  overallScore: number;
  addressAngleScore: number;
  takebackScore: number;
  headUpScore: number;
  thumbnailUrl: string;
  videoUrl: string;
  createdAt: any;
};

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKLY_RANKING_FETCH_CAP = 500;
const DEFAULT_RANKING_USER_NAME = "토코 회원";
const DEFAULT_RANKING_USER_LOCATION = "지역 정보 없음";

// Assignment order matters: the first entry becomes the headline 1위 card and
// claims its swing before the category rows are filled.
const RANKING_CATEGORIES: RankingCategory[] = [
  { field: "overallScore", label: "총점", title: "만점에 가까운 스윙" },
  { field: "addressAngleScore", label: "밸런스", title: "흔들림 없는 스윙" },
  { field: "takebackScore", label: "템포", title: "리듬이 좋은 스윙" },
  { field: "headUpScore", label: "안정성", title: "안정적인 스윙" },
];

async function fetchDoneSwingsBetween(
  startDate: Date,
  endDate: Date | null
): Promise<RankingCandidate[]> {
  const constraints: QueryConstraint[] = [
    where("status", "==", "done"),
    where("createdAt", ">=", startDate),
    ...(endDate ? [where("createdAt", "<", endDate)] : []),
    orderBy("createdAt", "desc"),
    limit(WEEKLY_RANKING_FETCH_CAP),
  ];

  const snapshot = await getDocs(query(collection(db, "SwingVideos"), ...constraints));

  if (snapshot.docs.length >= WEEKLY_RANKING_FETCH_CAP) {
    console.warn(
      `[Rankings] Hit the ${WEEKLY_RANKING_FETCH_CAP}-document fetch cap; rankings may be incomplete. Move to a precomputed weekly leaderboard.`
    );
  }

  return snapshot.docs.map((swingDoc) => {
    const data = swingDoc.data();
    return {
      id: swingDoc.id,
      userId: typeof data.userId === "string" ? data.userId : "",
      overallScore: toScore(data.overallScore),
      addressAngleScore: toScore(data.addressAngleScore),
      takebackScore: toScore(data.takebackScore),
      headUpScore: toScore(data.headUpScore),
      thumbnailUrl: data.screenshots?.[0]?.url || "",
      videoUrl: data.trimmedVideoUrl || "",
      createdAt: data.createdAt,
    } satisfies RankingCandidate;
  });
}

// Greedy assignment so one swing never wins more than one card. Ties resolve to
// the more recent swing because the input is already ordered by createdAt desc
// and Array.prototype.sort is stable.
function selectRankingWinners(candidates: RankingCandidate[]) {
  const claimedIds = new Set<string>();
  const winners: { candidate: RankingCandidate; category: RankingCategory }[] = [];

  for (const category of RANKING_CATEGORIES) {
    const best = candidates
      .filter((candidate) => !claimedIds.has(candidate.id))
      .sort((a, b) => b[category.field] - a[category.field])[0];

    if (!best) break;

    claimedIds.add(best.id);
    winners.push({ candidate: best, category });
  }

  return winners;
}

async function fetchRankingUserProfiles(userIds: string[]) {
  const profiles = new Map<string, { userName: string; userLocation: string }>();
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));

  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const userDoc = await getDoc(doc(db, "Users", userId));
        if (!userDoc.exists()) return;
        const userData = userDoc.data();
        profiles.set(userId, {
          userName: userData.name || DEFAULT_RANKING_USER_NAME,
          userLocation: userData.location || DEFAULT_RANKING_USER_LOCATION,
        });
      } catch (error) {
        console.error("Failed to fetch user for ranking", error);
      }
    })
  );

  return profiles;
}

export async function fetchWeeklyRankings(): Promise<{
  bestOverall: RankingSwingItem | null;
  categorized: RankingSwingItem[];
}> {
  try {
    const now = new Date();
    const currentWeekStart = new Date(now.getTime() - WEEK_IN_MS);
    const previousWeekStart = new Date(now.getTime() - WEEK_IN_MS * 2);

    // Sequential on purpose: the previous-week window is only queried when the
    // current week has no completed swings.
    let periodLabel = "이번 주";
    let candidates = await fetchDoneSwingsBetween(currentWeekStart, null);

    if (candidates.length === 0) {
      periodLabel = "지난주";
      candidates = await fetchDoneSwingsBetween(previousWeekStart, currentWeekStart);
    }

    if (candidates.length === 0) {
      return { bestOverall: null, categorized: [] };
    }

    const winners = selectRankingWinners(candidates);
    const profiles = await fetchRankingUserProfiles(
      winners.map((winner) => winner.candidate.userId)
    );

    const items = winners.map(({ candidate, category }) => {
      const profile = profiles.get(candidate.userId);
      return {
        id: candidate.id,
        userId: candidate.userId,
        userName: profile?.userName ?? DEFAULT_RANKING_USER_NAME,
        userLocation: profile?.userLocation ?? DEFAULT_RANKING_USER_LOCATION,
        overallScore: candidate.overallScore,
        metricScore: candidate[category.field],
        metricLabel: category.label,
        title: category.title,
        periodLabel,
        thumbnailUrl: candidate.thumbnailUrl,
        videoUrl: candidate.videoUrl,
        createdAt: candidate.createdAt,
      } satisfies RankingSwingItem;
    });

    const [bestOverall, ...categorized] = items;

    return {
      bestOverall: bestOverall ?? null,
      categorized,
    };
  } catch (error) {
    if ((error as { code?: string })?.code === "failed-precondition") {
      console.error(
        "[Rankings] Missing composite index on SwingVideos (status ASC, createdAt DESC). Run: firebase deploy --only firestore:indexes",
        error
      );
    } else {
      console.error("[Rankings] Failed to fetch weekly rankings:", error);
    }
    return { bestOverall: null, categorized: [] };
  }
}

function toScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toTimestampMillis(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  if ("toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  return 0;
}

function toDayLabel(millis: number) {
  if (!millis) return "날짜 정보 없음";
  const date = new Date(millis);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function standardDeviation(values: number[]) {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function deriveSwingTypeLabel(analysisTitle: string, metrics: SwingMetricFields) {
  if (analysisTitle.includes("리듬형") || analysisTitle.includes("스윙형")) {
    return analysisTitle;
  }

  const metricValues = Object.values(metrics);
  const stdDev = standardDeviation(metricValues);
  const minMetric = Math.min(...metricValues);
  const powerAvg = (metrics.backswingAngleScore + metrics.takebackScore) / 2;
  const setupAvg = (metrics.addressAngleScore + metrics.headUpScore) / 2;

  if (stdDev <= 7 && minMetric >= 65) {
    return "안정적인 리듬형";
  }

  if (powerAvg - setupAvg >= 8) {
    return "파워 백스윙형";
  }

  if (setupAvg - powerAvg >= 8) {
    return "정교한 셋업형";
  }

  if (metrics.headUpScore < 55) {
    return "헤드업 교정형";
  }

  return "밸런스 조정형";
}

function toParsedSnapshotDoc(data: Record<string, unknown>): ParsedSwingSnapshotDoc {
  const metrics: SwingMetricFields = {
    addressAngleScore: toScore(data.addressAngleScore),
    headUpScore: toScore(data.headUpScore),
    backswingAngleScore: toScore(data.backswingAngleScore),
    takebackScore: toScore(data.takebackScore),
  };

  const analysisCompletedAtMillis = toTimestampMillis(data.analysisCompletedAt);
  const createdAtMillis = toTimestampMillis(data.createdAt);
  const captureQuality =
    data.captureQuality && typeof data.captureQuality === "object"
      ? (data.captureQuality as Record<string, unknown>)
      : null;

  return {
    status: typeof data.status === "string" ? data.status : "",
    analysisTitle: typeof data.analysisTitle === "string" ? data.analysisTitle : "",
    overallScore: toScore(data.overallScore),
    metrics,
    captureUsable: Boolean(captureQuality?.usable),
    preferredMillis: analysisCompletedAtMillis || createdAtMillis,
  };
}

function toText(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed;
}

function toLatestSwingCoachData(data: Record<string, unknown>): LatestSwingCoachData | null {
  if (!data.practicePlan || typeof data.practicePlan !== "object") return null;
  const practicePlan = data.practicePlan as Record<string, unknown>;
  const title = toText(practicePlan.title);
  const reason = toText(practicePlan.reason);
  const oneLineCue = toText(practicePlan.oneLineCue);

  if (!title || !reason || !oneLineCue) {
    return null;
  }

  return {
    title,
    reason,
    oneLineCue,
  };
}

function getBestMetricLabel(metrics: SwingMetricFields) {
  const metricEntries: [string, number][] = [
    ["어드레스", metrics.addressAngleScore],
    ["헤드업", metrics.headUpScore],
    ["백스윙", metrics.backswingAngleScore],
    ["테이크백", metrics.takebackScore],
  ];

  metricEntries.sort((a, b) => b[1] - a[1]);
  return metricEntries[0][0];
}

function calculateSwingPoints(latest: ParsedSwingSnapshotDoc, previous: ParsedSwingSnapshotDoc | null) {
  const metricValues = Object.values(latest.metrics);
  const consistency = Math.max(0, 12 - standardDeviation(metricValues));
  const improvement = previous ? Math.max(0, latest.overallScore - previous.overallScore) * 2 : 0;
  const qualityBonus = latest.captureUsable ? 5 : 0;
  return Math.round(20 + consistency + improvement + qualityBonus);
}

export type RecentSwingHistoryRow = {
  id: string;
  title: string;
  summary: string;
  score: string;
  delta: string;
  thumbnailUrl: string;
};

const RECENT_SWING_HISTORY_LIMIT = 3;

function toNullableScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getHistorySummary(data: Record<string, unknown>) {
  const pieces = (
    [
      ["어드레스", toNullableScore(data.addressAngleScore)],
      ["헤드업", toNullableScore(data.headUpScore)],
      ["백스윙", toNullableScore(data.backswingAngleScore)],
      ["테이크백", toNullableScore(data.takebackScore)],
    ] as [string, number | null][]
  )
    .filter(([, score]) => score !== null)
    .map(([label, score]) => `${label} ${score}`);

  if (pieces.length === 0) return "세부 점수 준비 중";
  return pieces.slice(0, 3).join(" · ");
}

function getHistoryDelta(current: number | null, previous: number | null) {
  if (previous === null) return "첫 분석";
  if (current === null) return "비교 불가";
  const delta = current - previous;
  if (delta === 0) return "변화 없음";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export async function fetchRecentSwingHistory(
  userId: string
): Promise<RecentSwingHistoryRow[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, "SwingVideos"), where("userId", "==", userId))
    );

    const doneItems = snapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        const screenshots = Array.isArray(data.screenshots) ? data.screenshots : [];
        const firstScreenshot = screenshots[0] as { url?: unknown } | undefined;

        return {
          id: docSnapshot.id,
          status: typeof data.status === "string" ? data.status : "",
          overallScore: toNullableScore(data.overallScore),
          summary: getHistorySummary(data),
          thumbnailUrl: typeof firstScreenshot?.url === "string" ? firstScreenshot.url : "",
          preferredMillis:
            toTimestampMillis(data.analysisCompletedAt) || toTimestampMillis(data.createdAt),
        };
      })
      .filter((item) => item.status === "done" && item.preferredMillis > 0)
      .sort((a, b) => b.preferredMillis - a.preferredMillis);

    return doneItems.slice(0, RECENT_SWING_HISTORY_LIMIT).map((item, index) => ({
      id: item.id,
      title: `${toDayLabel(item.preferredMillis)} 스윙`,
      summary: item.summary,
      score: item.overallScore === null ? "--점" : `${item.overallScore}점`,
      delta: getHistoryDelta(item.overallScore, doneItems[index + 1]?.overallScore ?? null),
      thumbnailUrl: item.thumbnailUrl,
    }));
  } catch (error) {
    console.error("Failed to fetch recent swing history:", error);
    return [];
  }
}

export async function fetchRecentSwingSnapshot(
  userId: string
): Promise<RecentSwingSnapshotData | null> {
  let snapshot;
  try {
    // Keep reads small: only fetch the newest completed swings needed for
    // current score + previous comparison (+ AI coach from latest).
    snapshot = await getDocs(
      query(
        collection(db, "SwingVideos"),
        where("userId", "==", userId),
        where("status", "==", "done"),
        orderBy("createdAt", "desc"),
        limit(3)
      )
    );
  } catch {
    // Index might be missing in some environments; keep UX working with
    // a broader fallback query.
    snapshot = await getDocs(
      query(collection(db, "SwingVideos"), where("userId", "==", userId))
    );
  }

  const doneItems = snapshot.docs
    .map((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      return {
        parsed: toParsedSnapshotDoc(data),
        coach: toLatestSwingCoachData(data),
      };
    })
    .filter((item) => item.parsed.status === "done" && item.parsed.preferredMillis > 0)
    .sort((a, b) => b.parsed.preferredMillis - a.parsed.preferredMillis);

  const latest = doneItems[0]?.parsed;
  if (!latest) {
    return null;
  }

  const previous = doneItems[1]?.parsed ?? null;
  const bestMetricLabel = getBestMetricLabel(latest.metrics);

  return {
    score: latest.overallScore,
    points: calculateSwingPoints(latest, previous),
    label: deriveSwingTypeLabel(latest.analysisTitle, latest.metrics),
    subtitle: `${bestMetricLabel}가 가장 좋아요 · ${toDayLabel(latest.preferredMillis)}`,
    aiCoach: doneItems[0]?.coach ?? null,
  };
}
