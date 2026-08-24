import SwingAngleAnalysisPanel from "@/components/SwingComponents/SwingAngleAnalysisPanel";
import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import Feather from "@expo/vector-icons/Feather";
import { ResizeMode, Video, type AVPlaybackStatus } from "expo-av";
import { useRouter } from "expo-router";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    AppState,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

// SWING_REPLAY_REDESIGN_BEGIN: typed analysis/memo/practice models and parser helpers
type MetricKey = "addressAngle" | "headUp" | "backswingAngle" | "takeback";
type SwingPhase = "address" | "takeback" | "backswingTop" | "impact" | "finish";
type KeyMomentType = "strength" | "improvement" | "neutral";
type CameraAngle = "face_on" | "down_the_line" | "unknown";

interface SwingPoint {
  metricKey: MetricKey;
  title: string;
  explanation: string;
  actionCue: string;
  screenshotIndex: number;
  confidence: number;
}

interface KeyMoment {
  screenshotIndex: number;
  phase: SwingPhase;
  title: string;
  observation: string;
  type: KeyMomentType;
  relatedMetric: MetricKey;
  confidence: number;
}

interface PracticePlan {
  relatedMetric: MetricKey;
  targetPhase: SwingPhase;
  title: string;
  reason: string;
  oneLineCue: string;
  setup: string;
  steps: string[];
  attemptCount: number;
  successCriteria: string;
  commonMistake: string;
}

interface CaptureQuality {
  usable: boolean;
  cameraAngle: CameraAngle;
  fullBodyVisible: boolean;
  lightingAdequate: boolean;
  majorOcclusion: boolean;
  issues: string[];
  confidence: number;
}

interface SwingAnalysis {
  overallScore: number;
  addressAngleScore: number;
  headUpScore: number;
  backswingAngleScore: number;
  takebackScore: number;
  addressAngleFeedback: string;
  headUpFeedback: string;
  backswingAngleFeedback: string;
  takebackFeedback: string;
  summary: string;
  analysisTitle: string;
  strongestPoint: SwingPoint | null;
  primaryFocus: SwingPoint | null;
  keyMoments: KeyMoment[];
  practicePlan: PracticePlan | null;
  captureQuality: CaptureQuality | null;
  isBest: boolean;
  ownerId: string;
}

interface SwingScreenshot {
  sec?: number;
  storagePath?: string;
  url?: string;
}

interface TimestampNote {
  id: string;
  frameSec: number;
  phase: string;
  text: string;
}

type SwingImageViewerModalProps = {
  visible: boolean;
  swingVideoId?: string;
  analysisDocument?: Record<string, unknown> | null;
  selectedImageUrl: string | null;
  screenshots: SwingScreenshot[];
  summary: string;
  takebackFeedback: string;
  trimmedVideoUrl: string;
  trimStartSec: number;
  trimEndSec: number;
  playbackReady: boolean;
  onRequestClose: () => void;
  onSelectImage: (url: string) => void;
  onShare?: () => void;
};

const SWING_SPEED_OPTIONS = ["0.25x", "0.5x", "1x", "2x"];
const MEMO_MAX_LENGTH = 1000;
const EXIT_SAVE_MIN_LOADING_MS = 1500;
const screenshotUrlCache = new Map<string, string>();

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function toMetricKey(value: unknown): MetricKey | null {
  return value === "addressAngle" || value === "headUp" || value === "backswingAngle" || value === "takeback"
    ? value
    : null;
}

function toPhase(value: unknown): SwingPhase | null {
  return value === "address" ||
    value === "takeback" ||
    value === "backswingTop" ||
    value === "impact" ||
    value === "finish"
    ? value
    : null;
}

function toMomentType(value: unknown): KeyMomentType | null {
  return value === "strength" || value === "improvement" || value === "neutral" ? value : null;
}

function clampConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function getScoreBandLabel(score: number) {
  if (score >= 93) return "뛰어남";
  if (score >= 88) return "매우 좋음";
  if (score >= 82) return "안정적";
  return "우선 확인";
}

function getMetricLabel(metric: MetricKey) {
  if (metric === "addressAngle") return "어드레스 자세";
  if (metric === "takeback") return "테이크백 안정성";
  if (metric === "backswingAngle") return "백스윙 크기";
  return "시선 유지";
}

function getPhaseLabel(phase: SwingPhase) {
  if (phase === "address") return "어드레스";
  if (phase === "takeback") return "테이크백";
  if (phase === "backswingTop") return "백스윙 탑";
  if (phase === "impact") return "임팩트";
  return "피니시";
}

function getMomentTypeLabel(type: KeyMomentType) {
  if (type === "strength") return "강점";
  if (type === "improvement") return "개선";
  return "확인";
}

function getCameraAngleLabel(angle: CameraAngle) {
  if (angle === "face_on") return "정면 촬영";
  if (angle === "down_the_line") return "후면 촬영";
  return "촬영 각도 확인 어려움";
}

function formatClock(sec: number) {
  const mins = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const secs = (sec % 60).toFixed(2).padStart(5, "0");
  return `${mins}:${secs}`;
}

function parsePoint(value: unknown): SwingPoint | null {
  if (!value || typeof value !== "object") return null;
  const point = value as Record<string, unknown>;
  const metricKey = toMetricKey(point.metricKey);
  if (!metricKey) return null;
  const screenshotIndex = Number(point.screenshotIndex);
  return {
    metricKey,
    title: toText(point.title, "핵심 포인트"),
    explanation: toText(point.explanation, "설명을 불러오지 못했습니다."),
    actionCue: toText(point.actionCue, "관련 장면을 다시 확인해 보세요."),
    screenshotIndex: Number.isFinite(screenshotIndex) ? Math.max(0, Math.round(screenshotIndex)) : 0,
    confidence: clampConfidence(point.confidence),
  };
}

function parseKeyMoments(value: unknown) {
  if (!Array.isArray(value)) return [] as KeyMoment[];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const moment = item as Record<string, unknown>;
      const phase = toPhase(moment.phase);
      const type = toMomentType(moment.type);
      const relatedMetric = toMetricKey(moment.relatedMetric);
      const screenshotIndex = Number(moment.screenshotIndex);
      if (!phase || !type || !relatedMetric || !Number.isFinite(screenshotIndex)) return null;
      return {
        screenshotIndex: Math.max(0, Math.round(screenshotIndex)),
        phase,
        title: toText(moment.title, "장면"),
        observation: toText(moment.observation, "관찰 내용을 불러오지 못했습니다."),
        type,
        relatedMetric,
        confidence: clampConfidence(moment.confidence),
      } satisfies KeyMoment;
    })
    .filter((item): item is KeyMoment => item !== null);
}

function parsePracticePlan(value: unknown): PracticePlan | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const relatedMetric = toMetricKey(raw.relatedMetric);
  const targetPhase = toPhase(raw.targetPhase);
  if (!relatedMetric || !targetPhase) return null;
  const rawSteps = Array.isArray(raw.steps) ? raw.steps : [];
  const steps = rawSteps.map((step) => toText(step, "")).filter(Boolean);
  const attemptCountRaw = Number(raw.attemptCount);
  return {
    relatedMetric,
    targetPhase,
    title: toText(raw.title, "추천 연습"),
    reason: toText(raw.reason, "연습 이유를 불러오지 못했습니다."),
    oneLineCue: toText(raw.oneLineCue, "핵심 큐를 불러오지 못했습니다."),
    setup: toText(raw.setup, "준비 설명을 불러오지 못했습니다."),
    steps,
    attemptCount:
      Number.isFinite(attemptCountRaw) && attemptCountRaw > 0 ? Math.round(attemptCountRaw) : 3,
    successCriteria: toText(raw.successCriteria, "성공 기준을 불러오지 못했습니다."),
    commonMistake: toText(raw.commonMistake, "주의 문구를 불러오지 못했습니다."),
  };
}

function parseCaptureQuality(value: unknown): CaptureQuality | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const cameraAngleValue = raw.cameraAngle;
  const cameraAngle: CameraAngle =
    cameraAngleValue === "face_on" || cameraAngleValue === "down_the_line" || cameraAngleValue === "unknown"
      ? cameraAngleValue
      : "unknown";
  return {
    usable: Boolean(raw.usable),
    cameraAngle,
    fullBodyVisible: Boolean(raw.fullBodyVisible),
    lightingAdequate: Boolean(raw.lightingAdequate),
    majorOcclusion: Boolean(raw.majorOcclusion),
    issues: Array.isArray(raw.issues)
      ? raw.issues.map((issue) => toText(issue, "")).filter(Boolean)
      : [],
    confidence: clampConfidence(raw.confidence),
  };
}

function parseScreenshots(
  analysisDocument: Record<string, unknown> | null,
  fallbackScreenshots: SwingScreenshot[]
) {
  const source = Array.isArray(analysisDocument?.screenshots)
    ? analysisDocument.screenshots
    : fallbackScreenshots;
  return source.map((item) => {
    if (!item || typeof item !== "object") return {} as SwingScreenshot;
    const shot = item as Record<string, unknown>;
    return {
      sec: typeof shot.sec === "number" && Number.isFinite(shot.sec) ? shot.sec : undefined,
      storagePath: typeof shot.storagePath === "string" ? shot.storagePath : undefined,
      url: typeof shot.url === "string" ? shot.url : undefined,
    } satisfies SwingScreenshot;
  });
}

function parseAnalysis(
  analysisDocument: Record<string, unknown> | null,
  fallbackSummary: string,
  fallbackTakebackFeedback: string
): SwingAnalysis {
  return {
    overallScore: toScore(analysisDocument?.overallScore),
    addressAngleScore: toScore(analysisDocument?.addressAngleScore),
    headUpScore: toScore(analysisDocument?.headUpScore),
    backswingAngleScore: toScore(analysisDocument?.backswingAngleScore),
    takebackScore: toScore(analysisDocument?.takebackScore),
    addressAngleFeedback: toText(
      analysisDocument?.addressAngleFeedback,
      "세부 피드백을 불러오지 못했습니다."
    ),
    headUpFeedback: toText(analysisDocument?.headUpFeedback, "세부 피드백을 불러오지 못했습니다."),
    backswingAngleFeedback: toText(
      analysisDocument?.backswingAngleFeedback,
      "세부 피드백을 불러오지 못했습니다."
    ),
    takebackFeedback: toText(
      analysisDocument?.takebackFeedback,
      fallbackTakebackFeedback || "세부 피드백을 불러오지 못했습니다."
    ),
    summary: toText(analysisDocument?.summary, fallbackSummary),
    analysisTitle: toText(analysisDocument?.analysisTitle, "오늘의 스윙 분석"),
    strongestPoint: parsePoint(analysisDocument?.strongestPoint),
    primaryFocus: parsePoint(analysisDocument?.primaryFocus),
    keyMoments: parseKeyMoments(analysisDocument?.keyMoments),
    practicePlan: parsePracticePlan(analysisDocument?.practicePlan),
    captureQuality: parseCaptureQuality(analysisDocument?.captureQuality),
    isBest: Boolean(analysisDocument?.isBest),
    ownerId: toText(analysisDocument?.userId, ""),
  };
}

function toTimestampNotes(analysisDocument: Record<string, unknown> | null) {
  const userReview =
    analysisDocument?.userReview && typeof analysisDocument.userReview === "object"
      ? (analysisDocument.userReview as Record<string, unknown>)
      : null;
  const notes = Array.isArray(userReview?.timestampNotes) ? userReview?.timestampNotes : [];
  return notes
    .map((note) => {
      if (!note || typeof note !== "object") return null;
      const entry = note as Record<string, unknown>;
      const frameSec = Number(entry.frameSec);
      if (!Number.isFinite(frameSec)) return null;
      return {
        id: toText(entry.id, `${Date.now()}-${Math.random()}`),
        frameSec,
        phase: toText(entry.phase, "확인"),
        text: toText(entry.text, ""),
      } satisfies TimestampNote;
    })
    .filter((note): note is TimestampNote => note !== null);
}
// SWING_REPLAY_REDESIGN_END: typed analysis/memo/practice models and parser helpers

export default function SwingImageViewerModal({
  visible,
  swingVideoId = "",
  analysisDocument = null,
  selectedImageUrl,
  screenshots,
  summary,
  takebackFeedback,
  trimmedVideoUrl,
  trimStartSec,
  trimEndSec,
  playbackReady,
  onRequestClose,
  onSelectImage,
  onShare,
}: SwingImageViewerModalProps) {
  const router = useRouter();
  const videoRef = React.useRef<Video>(null);
  const scrollRef = React.useRef<ScrollView>(null);
  const [playerY, setPlayerY] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(0.5);
  const [currentSec, setCurrentSec] = React.useState(0);
  const [progressTrackWidth, setProgressTrackWidth] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<"analysis" | "memo" | "practice">("analysis");
  const [resolvedScreenshotUrls, setResolvedScreenshotUrls] = React.useState<Record<number, string>>({});
  const [floatingMessage, setFloatingMessage] = React.useState<string | null>(null);
  const [memoDraft, setMemoDraft] = React.useState("");
  const [lastSyncedMemo, setLastSyncedMemo] = React.useState("");
  const [memoStatus, setMemoStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isExitSavingModalVisible, setIsExitSavingModalVisible] = React.useState(false);
  const [timestampNotes, setTimestampNotes] = React.useState<TimestampNote[]>([]);
  const [isAttachSheetVisible, setIsAttachSheetVisible] = React.useState(false);
  const [selectedMetricDetail, setSelectedMetricDetail] = React.useState<{
    label: string;
    score: number;
    feedback: string;
    metricKey: MetricKey;
  } | null>(null);
  const [attachNoteText, setAttachNoteText] = React.useState("");
  const memoDraftRef = React.useRef("");
  const lastSyncedMemoRef = React.useRef("");
  const visibleRef = React.useRef(visible);
  const isPersistingMemoRef = React.useRef(false);
  const previousVisibleRef = React.useRef(visible);
  const hydratedMemoKeyRef = React.useRef("");
  const appStateRef = React.useRef(AppState.currentState);
  const isClosingWithSaveRef = React.useRef(false);
  const { user } = useAuth();

  // SWING_REPLAY_REDESIGN_BEGIN: Firestore-driven tab state and interaction handlers
  const analysis = React.useMemo(
    () => parseAnalysis(analysisDocument, summary, takebackFeedback),
    [analysisDocument, summary, takebackFeedback]
  );

  const parsedScreenshots = React.useMemo(
    () => parseScreenshots(analysisDocument, screenshots),
    [analysisDocument, screenshots]
  );

  const selectedFrameIndex = React.useMemo(() => {
    if (!selectedImageUrl) return 0;
    const index = parsedScreenshots.findIndex((shot, shotIndex) => {
      const resolvedUrl = resolvedScreenshotUrls[shotIndex] ?? "";
      return shot.url === selectedImageUrl || resolvedUrl === selectedImageUrl;
    });
    return index >= 0 ? index : 0;
  }, [parsedScreenshots, resolvedScreenshotUrls, selectedImageUrl]);

  const effectiveTrimStart = Math.max(0, trimStartSec || 0);
  const effectiveTrimEnd = Math.max(effectiveTrimStart + 0.1, trimEndSec || effectiveTrimStart + 0.1);
  const trimDuration = Math.max(0.1, effectiveTrimEnd - effectiveTrimStart);

  const frameTimes = React.useMemo(() => {
    if (!parsedScreenshots.length) return [effectiveTrimStart];
    const validSecs = parsedScreenshots
      .map((shot) => (typeof shot.sec === "number" ? shot.sec : null))
      .filter((sec): sec is number => sec !== null);
    if (validSecs.length === parsedScreenshots.length) return validSecs;
    return parsedScreenshots.map((_, idx) =>
      Number((effectiveTrimStart + (idx / Math.max(parsedScreenshots.length - 1, 1)) * trimDuration).toFixed(2))
    );
  }, [effectiveTrimStart, parsedScreenshots, trimDuration]);

  const tabItems = React.useMemo(
    () => [
      { key: "analysis" as const, label: "분석" },
      { key: "memo" as const, label: "내 메모" },
      { key: "practice" as const, label: "다음 연습" },
    ],
    []
  );

  const currentRelativeSec = Math.max(0, currentSec - effectiveTrimStart);
  const progressRatio = Math.max(0, Math.min(currentRelativeSec / trimDuration, 1));

  const isOwner = user?.uid === analysis.ownerId;

  const seekToSec = React.useCallback(
    async (targetSec: number) => {
      if (!playbackReady || !trimmedVideoUrl) return;
      const clampedSec = Math.max(effectiveTrimStart, Math.min(targetSec, effectiveTrimEnd));
      await videoRef.current?.setPositionAsync(Math.round(clampedSec * 1000));
      await videoRef.current?.pauseAsync();
      setIsPlaying(false);
      setCurrentSec(clampedSec);
    },
    [effectiveTrimEnd, effectiveTrimStart, playbackReady, trimmedVideoUrl]
  );

  const scrollToPlayer = React.useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, playerY - moderateScale(10)),
      animated: true,
    });
  }, [playerY]);

  const showFloatingMessage = React.useCallback((message: string) => {
    setFloatingMessage(message);
    setTimeout(() => {
      setFloatingMessage((prev) => (prev === message ? null : prev));
    }, 1700);
  }, []);

  const getMomentScreenshot = React.useCallback(
    (screenshotIndex: number) => {
      if (screenshotIndex < 0 || screenshotIndex >= parsedScreenshots.length) return null;
      return parsedScreenshots[screenshotIndex] ?? null;
    },
    [parsedScreenshots]
  );

  const seekByScreenshotIndex = React.useCallback(
    async (screenshotIndex: number, pillMessage?: string, skipScroll?: boolean) => {
      const shot = getMomentScreenshot(screenshotIndex);
      if (!shot || typeof shot.sec !== "number") {
        showFloatingMessage("영상 위치 정보 없음");
        return;
      }
      await seekToSec(shot.sec);
      if (!skipScroll) scrollToPlayer();
      if (pillMessage) showFloatingMessage(pillMessage);
    },
    [getMomentScreenshot, scrollToPlayer, seekToSec, showFloatingMessage]
  );

  const handleTogglePlayback = React.useCallback(async () => {
    if (!playbackReady || !trimmedVideoUrl) return;
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (currentSec >= effectiveTrimEnd - 0.05 || currentSec < effectiveTrimStart) {
      await seekToSec(effectiveTrimStart);
    }

    await videoRef.current?.playAsync();
    setIsPlaying(true);
  }, [currentSec, effectiveTrimEnd, effectiveTrimStart, isPlaying, playbackReady, seekToSec, trimmedVideoUrl]);

  const handlePickSpeed = React.useCallback(async (speed: number) => {
    setPlaybackRate(speed);
    await videoRef.current?.setRateAsync(speed, true);
  }, []);

  const handleSeekByDelta = React.useCallback(
    async (deltaSec: number) => {
      const baseSec = currentSec || effectiveTrimStart;
      await seekToSec(baseSec + deltaSec);
    },
    [currentSec, effectiveTrimStart, seekToSec]
  );

  const handleProgressPress = React.useCallback(
    async (locationX: number) => {
      if (!playbackReady || !trimmedVideoUrl) return;
      const ratio = Math.max(0, Math.min(locationX / Math.max(progressTrackWidth, 1), 1));
      await seekToSec(effectiveTrimStart + ratio * trimDuration);
    },
    [effectiveTrimStart, playbackReady, progressTrackWidth, seekToSec, trimDuration, trimmedVideoUrl]
  );

  const inferCurrentPhase = React.useCallback(() => {
    const withSec = analysis.keyMoments
      .map((moment) => {
        const shot = getMomentScreenshot(moment.screenshotIndex);
        return {
          phase: moment.phase,
          sec: shot?.sec,
        };
      })
      .filter((item): item is { phase: SwingPhase; sec: number } => typeof item.sec === "number");

    if (!withSec.length) return "확인";

    const nearest = withSec.reduce((best, item) => {
      if (!best) return item;
      return Math.abs(item.sec - currentSec) < Math.abs(best.sec - currentSec) ? item : best;
    }, withSec[0]);

    return getPhaseLabel(nearest.phase);
  }, [analysis.keyMoments, currentSec, getMomentScreenshot]);

  const persistMemo = React.useCallback(
    async (nextMemo: string) => {
      if (!swingVideoId) return;
      setMemoStatus("saving");
      try {
        await updateDoc(doc(db, "SwingVideos", swingVideoId), {
          "userReview.memo": nextMemo,
          "userReview.updatedAt": serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setMemoStatus("saved");
        setLastSyncedMemo(nextMemo);
      } catch {
        setMemoStatus("error");
      }
    },
    [swingVideoId]
  );

  const flushMemoOnExit = React.useCallback(async () => {
    if (!swingVideoId) return;
    const nextMemo = memoDraftRef.current;
    if (nextMemo === lastSyncedMemoRef.current) return;
    if (isPersistingMemoRef.current) return;

    isPersistingMemoRef.current = true;
    try {
      await persistMemo(nextMemo);
    } finally {
      isPersistingMemoRef.current = false;
    }
  }, [persistMemo, swingVideoId]);

  const handleRequestClose = React.useCallback(() => {
    if (isClosingWithSaveRef.current) return;

    const shouldFlushOnClose = Boolean(swingVideoId) && memoDraftRef.current !== lastSyncedMemoRef.current;
    if (!shouldFlushOnClose) {
      onRequestClose();
      return;
    }

    isClosingWithSaveRef.current = true;
    setIsExitSavingModalVisible(true);

    void (async () => {
      const startedAt = Date.now();
      await flushMemoOnExit();
      const elapsed = Date.now() - startedAt;
      if (elapsed < EXIT_SAVE_MIN_LOADING_MS) {
        await sleep(EXIT_SAVE_MIN_LOADING_MS - elapsed);
      }
      setIsExitSavingModalVisible(false);
      isClosingWithSaveRef.current = false;
      onRequestClose();
    })();
  }, [flushMemoOnExit, onRequestClose, swingVideoId]);

  const persistTimestampNotes = React.useCallback(
    async (nextNotes: TimestampNote[]) => {
      if (!swingVideoId) return;
      await updateDoc(doc(db, "SwingVideos", swingVideoId), {
        "userReview.timestampNotes": nextNotes,
        "userReview.updatedAt": serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    [swingVideoId]
  );

  React.useEffect(() => {
    memoDraftRef.current = memoDraft;
  }, [memoDraft]);

  React.useEffect(() => {
    lastSyncedMemoRef.current = lastSyncedMemo;
  }, [lastSyncedMemo]);

  React.useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  React.useEffect(() => {
    if (!visible) {
      hydratedMemoKeyRef.current = "";
      return;
    }

    const hydrationKey = swingVideoId ? `swing:${swingVideoId}` : "swing:none";
    if (hydratedMemoKeyRef.current === hydrationKey) return;

    const review =
      analysisDocument?.userReview && typeof analysisDocument.userReview === "object"
        ? (analysisDocument.userReview as Record<string, unknown>)
        : null;
    const fallbackMemo = toText(review?.memo, "");
    setMemoDraft(fallbackMemo);
    setLastSyncedMemo(fallbackMemo);
    setMemoStatus("idle");
    setTimestampNotes(toTimestampNotes(analysisDocument));
    hydratedMemoKeyRef.current = hydrationKey;
  }, [analysisDocument, swingVideoId, visible]);

  React.useEffect(() => {
    if (!visible || !swingVideoId) return;

    const fallbackReview =
      analysisDocument?.userReview && typeof analysisDocument.userReview === "object"
        ? (analysisDocument.userReview as Record<string, unknown>)
        : null;
    const fallbackMemo = toText(fallbackReview?.memo, "");

    const swingVideoRef = doc(db, "SwingVideos", swingVideoId);
    const unsubscribe = onSnapshot(
      swingVideoRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as Record<string, unknown>;
        const userReview =
          data?.userReview && typeof data.userReview === "object"
            ? (data.userReview as Record<string, unknown>)
            : null;

        const hasRemoteMemo = typeof userReview?.memo === "string";
        const remoteMemo = hasRemoteMemo ? toText(userReview?.memo, "") : fallbackMemo;
        const canApplyRemoteMemo = memoDraftRef.current === lastSyncedMemoRef.current;

        if (canApplyRemoteMemo) {
          setMemoDraft(remoteMemo);
          setLastSyncedMemo(remoteMemo);
        }
      },
      () => undefined
    );

    return () => unsubscribe();
  }, [analysisDocument, swingVideoId, visible]);

  React.useEffect(() => {
    if (previousVisibleRef.current && !visible) {
      void flushMemoOnExit();
    }
    previousVisibleRef.current = visible;
  }, [flushMemoOnExit, visible]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const shouldFlush =
        visibleRef.current &&
        appStateRef.current === "active" &&
        (nextState === "inactive" || nextState === "background");

      if (shouldFlush) {
        void flushMemoOnExit();
      }

      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [flushMemoOnExit]);

  React.useEffect(() => {
    return () => {
      void flushMemoOnExit();
    };
  }, [flushMemoOnExit]);

  React.useEffect(() => {
    if (!visible) {
      void videoRef.current?.pauseAsync().catch(() => undefined);
      setIsPlaying(false);
      setCurrentSec(0);
      setActiveTab("analysis");
      return;
    }

    const initialSec =
      selectedFrameIndex >= 0 && selectedFrameIndex < frameTimes.length
        ? frameTimes[selectedFrameIndex]
        : effectiveTrimStart;
    setCurrentSec(initialSec);
    void (async () => {
      try {
        await videoRef.current?.pauseAsync();
        await seekToSec(initialSec);
      } catch {
        return;
      }
    })();
  }, [effectiveTrimStart, frameTimes, seekToSec, selectedFrameIndex, visible]);

  React.useEffect(() => {
    if (!visible || !playbackReady || !trimmedVideoUrl) return;
    if (selectedFrameIndex < 0 || selectedFrameIndex >= frameTimes.length) return;
    const nextSec = frameTimes[selectedFrameIndex];
    void seekToSec(nextSec);
  }, [frameTimes, playbackReady, seekToSec, selectedFrameIndex, trimmedVideoUrl, visible]);

  React.useEffect(() => {
    let isActive = true;
    const resolveUrls = async () => {
      const storage = getStorage();
      const nextMap: Record<number, string> = {};
      for (let i = 0; i < parsedScreenshots.length; i += 1) {
        const shot = parsedScreenshots[i];
        if (shot.url) {
          nextMap[i] = shot.url;
          continue;
        }
        if (!shot.storagePath) continue;
        if (screenshotUrlCache.has(shot.storagePath)) {
          nextMap[i] = screenshotUrlCache.get(shot.storagePath) as string;
          continue;
        }
        try {
          const url = await getDownloadURL(ref(storage, shot.storagePath));
          screenshotUrlCache.set(shot.storagePath, url);
          nextMap[i] = url;
        } catch {
          continue;
        }
      }
      if (isActive) {
        setResolvedScreenshotUrls(nextMap);
      }
    };

    void resolveUrls();

    return () => {
      isActive = false;
    };
  }, [parsedScreenshots]);

  const handlePlaybackStatusUpdate = React.useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      const sec = status.positionMillis / 1000;
      setCurrentSec(sec);
      setIsPlaying(status.isPlaying);

      if (sec >= effectiveTrimEnd - 0.02) {
        void (async () => {
          try {
            await videoRef.current?.pauseAsync();
            await seekToSec(effectiveTrimStart);
          } catch {
            return;
          }
        })();
      }
    },
    [effectiveTrimEnd, effectiveTrimStart, seekToSec]
  );

  const detailCards = React.useMemo(
    () => [
      {
        metricKey: "addressAngle" as MetricKey,
        label: "어드레스 자세",
        score: analysis.addressAngleScore,
        feedback: analysis.addressAngleFeedback,
      },
      {
        metricKey: "takeback" as MetricKey,
        label: "테이크백 안정성",
        score: analysis.takebackScore,
        feedback: analysis.takebackFeedback,
      },
      {
        metricKey: "backswingAngle" as MetricKey,
        label: "백스윙 크기",
        score: analysis.backswingAngleScore,
        feedback: analysis.backswingAngleFeedback,
      },
      {
        metricKey: "headUp" as MetricKey,
        label: "시선 유지",
        score: analysis.headUpScore,
        feedback: analysis.headUpFeedback,
      },
    ],
    [analysis]
  );

  const handleJumpMetricMoment = React.useCallback(
    async (metricKey: MetricKey, skipScroll?: boolean) => {
      const targetMoment = analysis.keyMoments.find((moment) => moment.relatedMetric === metricKey);
      if (!targetMoment) {
        showFloatingMessage("연결된 장면 정보가 없습니다");
        return;
      }
      await seekByScreenshotIndex(targetMoment.screenshotIndex, targetMoment.observation, skipScroll);
    },
    [analysis.keyMoments, seekByScreenshotIndex, showFloatingMessage]
  );

  const handleAttachCurrentMoment = React.useCallback(async () => {
    const trimmedText = attachNoteText.trim();
    if (!trimmedText) {
      Alert.alert("메모 입력", "첨부 메모를 입력해 주세요.");
      return;
    }
    const note: TimestampNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      frameSec: Number(currentSec.toFixed(2)),
      phase: inferCurrentPhase(),
      text: trimmedText,
    };
    const nextNotes = [note, ...timestampNotes];
    setTimestampNotes(nextNotes);
    setAttachNoteText("");
    setIsAttachSheetVisible(false);
    try {
      await persistTimestampNotes(nextNotes);
      showFloatingMessage("현재 장면이 첨부되었습니다");
    } catch {
      showFloatingMessage("장면 첨부 저장 실패");
    }
  }, [attachNoteText, currentSec, inferCurrentPhase, persistTimestampNotes, showFloatingMessage, timestampNotes]);

  const handleDeleteTimestampNote = React.useCallback(
    async (id: string) => {
      const nextNotes = timestampNotes.filter((note) => note.id !== id);
      setTimestampNotes(nextNotes);
      try {
        await persistTimestampNotes(nextNotes);
        showFloatingMessage("첨부 메모를 삭제했어요");
      } catch {
        showFloatingMessage("삭제에 실패했어요");
      }
    },
    [persistTimestampNotes, showFloatingMessage, timestampNotes]
  );

  const handleToggleBest = React.useCallback(async () => {
    if (!swingVideoId) return;
    const nextIsBest = !analysis.isBest;
    try {
      await updateDoc(doc(db, "SwingVideos", swingVideoId), {
        isBest: nextIsBest,
        updatedAt: serverTimestamp(),
      });
      showFloatingMessage(nextIsBest ? "베스트 스윙으로 등록되었습니다" : "베스트 스윙에서 해제되었습니다");
    } catch {
      showFloatingMessage("설정 변경에 실패했습니다");
    }
  }, [analysis.isBest, showFloatingMessage, swingVideoId]);

  const handleShare = React.useCallback(async () => {
    if (onShare) {
      onShare();
      return;
    }
    try {
      const message = `토코(Toko)에서 분석한 제 파크골프 스윙이에요!\n\n종합 점수: ${analysis.overallScore}점\n분석 결과: ${analysis.analysisTitle}\n\n${trimmedVideoUrl ? `영상 보기: ${trimmedVideoUrl}` : ""}`;
      await Share.share({
        message,
        title: "내 스윙 공유하기",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  }, [analysis.overallScore, analysis.analysisTitle, onShare, trimmedVideoUrl]);

  const handleStartPractice = React.useCallback(async () => {
    if (!analysis.practicePlan || !swingVideoId) return;
    try {
      await updateDoc(doc(db, "SwingVideos", swingVideoId), {
        practiceProgress: {
          relatedMetric: analysis.practicePlan.relatedMetric,
          completedAttempts: 0,
          attemptCount: analysis.practicePlan.attemptCount,
          startedAt: serverTimestamp(),
          completedAt: null,
        },
        updatedAt: serverTimestamp(),
      });

      router.push({
        pathname: "/(swing)",
        params: {
          practiceTitle: analysis.practicePlan.title,
          oneLineCue: analysis.practicePlan.oneLineCue,
          relatedMetric: analysis.practicePlan.relatedMetric,
          targetPhase: analysis.practicePlan.targetPhase,
          successCriteria: analysis.practicePlan.successCriteria,
          attemptCount: String(analysis.practicePlan.attemptCount),
        },
      });
    } catch {
      Alert.alert("저장 실패", "연습 목표 저장 중 문제가 발생했어요. 다시 시도해주세요.");
    }
  }, [analysis.practicePlan, router, swingVideoId]);

  const practicePlanHidden = !analysis.primaryFocus;
  // SWING_REPLAY_REDESIGN_END: Firestore-driven tab state and interaction handlers

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose}>
      <SafeAreaView edges={["top"]} style={styles.imageViewerOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleRequestClose} />
        <View style={styles.imageViewerPanel}>
          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.imageViewerContent}>
            <View style={styles.imageViewerTopRow}>
              <Pressable style={styles.imageViewerTopIconButton} onPress={handleRequestClose}>
                <Feather name="arrow-left" size={moderateScale(20)} color="#DDE4E2" />
              </Pressable>

              <View style={styles.imageViewerTopTextWrap}>
                <Text type="barlowLight" style={styles.imageViewerTopMetaText}>
                  스윙 재생
                </Text>
                <Text type="barlowHard" style={styles.imageViewerTopTitleText}>
                  분석 리플레이
                </Text>
              </View>

              <View style={styles.imageViewerTopActions}>
                {isOwner && (
                  <Pressable
                    style={[styles.imageViewerTopIconButton, analysis.isBest && { backgroundColor: "#D9F46A", borderColor: "#D9F46A" }]}
                    onPress={handleToggleBest}
                  >
                    <Feather name="heart" size={moderateScale(18)} color={analysis.isBest ? "#1A241D" : "#DDE4E2"} />
                  </Pressable>
                )}
                {isOwner && (
                  <Pressable style={styles.imageViewerTopIconButton} onPress={handleShare}>
                    <Feather name="upload" size={moderateScale(18)} color="#DDE4E2" />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.imageViewerStage} onLayout={(event) => setPlayerY(event.nativeEvent.layout.y)}>
              {playbackReady && trimmedVideoUrl ? (
                <Video
                  ref={videoRef}
                  source={{ uri: trimmedVideoUrl }}
                  style={styles.imageViewerStageImage}
                  resizeMode={ResizeMode.COVER}
                  isMuted
                  shouldPlay={false}
                  useNativeControls={false}
                  isLooping={false}
                  onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                />
              ) : selectedImageUrl ? (
                <Image source={{ uri: selectedImageUrl }} style={styles.imageViewerStageImage} resizeMode="cover" />
              ) : (
                <View style={styles.imageViewerStagePlaceholder}>
                  <Feather name="image" size={moderateScale(28)} color="#B7C8C2" />
                </View>
              )}

              <View style={styles.imageViewerSpeedPill}>
                <Text type="barlowHard" style={styles.imageViewerSpeedPillText}>
                  단면 보기 · {playbackRate.toFixed(playbackRate % 1 === 0 ? 0 : 1)}x
                </Text>
              </View>

              {floatingMessage ? (
                <View style={styles.playerFloatingPill}>
                  <Text type="barlowHard" style={styles.playerFloatingPillText}>
                    {floatingMessage}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.imageViewerTimelineCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageViewerFramesStrip}>
                {parsedScreenshots.map((shot, index) => {
                  const isActive = index === selectedFrameIndex;
                  const frameUrl = shot.url ?? resolvedScreenshotUrls[index];
                  return (
                    <Pressable
                      key={`viewer-shot-${index}`}
                      style={[styles.imageViewerFrameItem, isActive && styles.imageViewerFrameItemActive]}
                      onPress={() => {
                        if (!frameUrl) return;
                        onSelectImage(frameUrl);
                        const shotSec = typeof shot.sec === "number" ? shot.sec : null;
                        if (shotSec !== null) {
                          void seekToSec(shotSec);
                        }
                      }}
                    >
                      {frameUrl ? (
                        <Image source={{ uri: frameUrl }} style={styles.imageViewerFrameImage} />
                      ) : (
                        <View style={styles.imageViewerFramePlaceholder} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.imageViewerProgressTrack}>
                <Pressable
                  style={styles.imageViewerProgressTouchArea}
                  onPress={(event) => {
                    void handleProgressPress(event.nativeEvent.locationX);
                  }}
                  onLayout={(event) => setProgressTrackWidth(event.nativeEvent.layout.width)}
                >
                  <View style={[styles.imageViewerProgressFill, { width: `${progressRatio * 100}%` }]} />
                </Pressable>
              </View>

              <View style={styles.imageViewerTimeRow}>
                <Text type="barlowHard" style={styles.imageViewerTimeText}>
                  {formatClock(currentRelativeSec)}
                </Text>
                <Text type="barlowHard" style={styles.imageViewerTimeText}>
                  {formatClock(trimDuration)}
                </Text>
              </View>

              <View style={styles.imageViewerControlRow}>
                <Pressable
                  style={styles.imageViewerControlSmall}
                  onPress={() => {
                    void handleSeekByDelta(-0.25);
                  }}
                  disabled={!playbackReady || !trimmedVideoUrl}
                >
                  <Feather name="skip-back" size={moderateScale(24)} color="#E4ECE8" />
                </Pressable>
                <Pressable
                  style={styles.imageViewerControlPlay}
                  onPress={() => {
                    void handleTogglePlayback();
                  }}
                  disabled={!playbackReady || !trimmedVideoUrl}
                >
                  <Feather name={isPlaying ? "pause" : "play"} size={moderateScale(32)} color="#E4ECE8" />
                </Pressable>
                <Pressable
                  style={styles.imageViewerControlSmall}
                  onPress={() => {
                    void handleSeekByDelta(0.25);
                  }}
                  disabled={!playbackReady || !trimmedVideoUrl}
                >
                  <Feather name="skip-forward" size={moderateScale(24)} color="#E4ECE8" />
                </Pressable>
              </View>

              <View style={styles.imageViewerSpeedRow}>
                {SWING_SPEED_OPTIONS.map((speed) => {
                  const numericSpeed = Number(speed.replace("x", ""));
                  const isActive = playbackRate === numericSpeed;
                  return (
                    <Pressable
                      key={speed}
                      style={[styles.imageViewerSpeedOption, isActive && styles.imageViewerSpeedOptionActive]}
                      onPress={() => {
                        void handlePickSpeed(numericSpeed);
                      }}
                      disabled={!playbackReady || !trimmedVideoUrl}
                    >
                      <Text type="barlowHard" style={[styles.imageViewerSpeedOptionText, isActive && styles.imageViewerSpeedOptionTextActive]}>
                        {speed}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* SWING_REPLAY_REDESIGN_BEGIN: 3-tab layout (분석/내 메모/다음 연습) */}
            <View style={styles.imageViewerTabRow}>
              {tabItems.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    style={[styles.imageViewerTabItem, isActive && styles.imageViewerTabItemActive]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text type="barlowHard" style={[styles.imageViewerTabText, isActive && styles.imageViewerTabTextActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activeTab === "analysis" ? (
              <View style={styles.tabSectionWrap}>
                <View style={styles.analysisOverallCard}>
                  <Text type="barlowHard" style={styles.analysisEyebrow}>
                    오늘의 종합 분석
                  </Text>
                  <View style={styles.analysisOverallTopRow}>
                    <View style={styles.analysisOverallTextWrap}>
                      <Text type="barlowHard" style={styles.analysisTitleText}>
                        {analysis.analysisTitle}
                      </Text>
                      <Text type="barlowLight" style={styles.analysisSummaryText}>
                        {analysis.summary}
                      </Text>
                    </View>
                    <View style={styles.overallScoreTile}>
                      <Text type="barlowHard" style={styles.overallScoreTileValue}>
                        {analysis.overallScore}
                      </Text>
                      <Text type="barlowHard" style={styles.overallScoreTileMeta}>
                        OVERALL
                      </Text>
                      <Text type="barlowLight" style={styles.overallScoreBandText}>
                        {getScoreBandLabel(analysis.overallScore)}
                      </Text>
                    </View>
                  </View>
                </View>

                {analysis.keyMoments.length > 0 ? (
                  <View style={styles.keyMomentsWrap}>
                    <View style={styles.metricSectionHeader}>
                      <Text type="barlowHard" style={styles.metricSectionTitle}>
                        AI가 확인한 장면
                      </Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keyMomentScrollContent}>
                      {analysis.keyMoments.map((moment, index) => {
                        const shot = getMomentScreenshot(moment.screenshotIndex);
                        const thumbUrl =
                          shot?.url ??
                          (typeof moment.screenshotIndex === "number"
                            ? resolvedScreenshotUrls[moment.screenshotIndex]
                            : undefined);
                        const hasValidSec = typeof shot?.sec === "number";
                        return (
                          <Pressable
                            key={`${moment.title}-${index}`}
                            style={styles.keyMomentCard}
                            onPress={() => {
                              if (!hasValidSec) {
                                showFloatingMessage("영상 위치 정보 없음");
                                return;
                              }
                              void seekByScreenshotIndex(moment.screenshotIndex, moment.observation);
                            }}
                          >
                            <View style={styles.keyMomentThumbWrap}>
                              {thumbUrl ? (
                                <Image source={{ uri: thumbUrl }} style={styles.keyMomentThumbImage} />
                              ) : (
                                <View style={styles.keyMomentThumbPlaceholder}>
                                  <Feather name="image" size={moderateScale(16)} color="#95A89F" />
                                </View>
                              )}
                              <View style={styles.keyMomentTypePill}>
                                <Text type="barlowHard" style={styles.keyMomentTypePillText}>
                                  {getMomentTypeLabel(moment.type)}
                                </Text>
                              </View>
                            </View>
                            <Text type="barlowHard" style={styles.keyMomentPhaseText}>
                              {getPhaseLabel(moment.phase)}
                            </Text>
                            <Text type="barlowHard" style={styles.keyMomentTitleText}>
                              {moment.title}
                            </Text>
                            <Text type="barlowLight" style={styles.keyMomentObservationText}>
                              {moment.observation}
                            </Text>
                            <Text type="barlowLight" style={styles.keyMomentTimeText}>
                              {hasValidSec ? formatClock(shot.sec ?? 0) : "영상 위치 정보 없음"}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}

                {analysis.captureQuality ? (
                  <View style={[styles.captureQualityCard, !analysis.captureQuality.usable && styles.captureQualityCardWarning]}>
                    <View style={styles.captureQualityHeadRow}>
                      <Text type="barlowHard" style={styles.captureQualityTitle}>
                        {analysis.captureQuality.usable ? "이 영상은 분석에 적합해요" : "촬영 품질 확인이 필요해요"}
                      </Text>
                      <Text type="barlowHard" style={styles.captureQualityConfidence}>
                        {Math.round(analysis.captureQuality.confidence * 100)}%
                      </Text>
                    </View>
                    <Text type="barlowLight" style={styles.captureQualityBody}>
                      {[
                        getCameraAngleLabel(analysis.captureQuality.cameraAngle),
                        analysis.captureQuality.fullBodyVisible ? "전신 확인" : "전신 확인 어려움",
                        analysis.captureQuality.majorOcclusion ? "가림 있음" : "가림 없음",
                        analysis.captureQuality.lightingAdequate ? "밝기 충분" : "밝기 부족",
                      ].join(" · ")}
                    </Text>
                    {!analysis.captureQuality.usable && analysis.captureQuality.issues.length > 0 ? (
                      <Text type="barlowLight" style={styles.captureQualityIssueText}>
                        {`주의: ${analysis.captureQuality.issues.join(" · ")}`}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {analysis.strongestPoint || analysis.primaryFocus ? (
                  <View style={styles.pointGridRow}>
                    {analysis.strongestPoint ? (
                      <View style={[styles.pointCard, styles.strongPointCard]}>
                        <Text type="barlowHard" style={styles.pointLabelText}>
                          오늘의 강점
                        </Text>
                        <Text type="barlowHard" style={styles.pointTitleText}>
                          {analysis.strongestPoint.title}
                        </Text>
                        <Text type="barlowLight" style={styles.pointBodyText}>
                          {analysis.strongestPoint.explanation}
                        </Text>
                        <Text type="barlowHard" style={styles.pointCueText}>
                          {analysis.strongestPoint.actionCue}
                        </Text>
                        <Pressable
                          style={styles.pointActionButton}
                          onPress={() => {
                            void seekByScreenshotIndex(
                              analysis.strongestPoint?.screenshotIndex ?? -1,
                              analysis.strongestPoint?.explanation ?? ""
                            );
                          }}
                        >
                          <Text type="barlowHard" style={styles.pointActionButtonText}>
                            근거 장면 보기
                          </Text>
                        </Pressable>
                        <Text type="barlowLight" style={styles.pointConfidenceText}>
                          분석 신뢰도 {Math.round(analysis.strongestPoint.confidence * 100)}%
                        </Text>
                      </View>
                    ) : null}

                    {analysis.primaryFocus ? (
                      <View style={[styles.pointCard, styles.focusPointCard]}>
                        <Text type="barlowHard" style={styles.pointLabelText}>
                          우선 확인
                        </Text>
                        <Text type="barlowHard" style={styles.pointTitleText}>
                          {analysis.primaryFocus.title}
                        </Text>
                        <Text type="barlowLight" style={styles.pointBodyText}>
                          {analysis.primaryFocus.explanation}
                        </Text>
                        <Text type="barlowHard" style={styles.pointCueText}>
                          {analysis.primaryFocus.actionCue}
                        </Text>
                        <Pressable
                          style={styles.pointActionButton}
                          onPress={() => {
                            void seekByScreenshotIndex(
                              analysis.primaryFocus?.screenshotIndex ?? -1,
                              analysis.primaryFocus?.explanation ?? ""
                            );
                          }}
                        >
                          <Text type="barlowHard" style={styles.pointActionButtonText}>
                            근거 장면 보기
                          </Text>
                        </Pressable>
                        <Text type="barlowLight" style={styles.pointConfidenceText}>
                          분석 신뢰도 {Math.round(analysis.primaryFocus.confidence * 100)}%
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <SwingAngleAnalysisPanel
                  analysisDocument={analysisDocument}
                  mode="statsOnly"
                  showImage
                />

                <View style={styles.metricHeaderCard}>
                  <View style={styles.metricHeaderTextWrap}>
                    <Text type="barlowHard" style={styles.metricHeaderEyebrow}>
                      세부 점수
                    </Text>
                    <Text type="barlowHard" style={styles.metricHeaderTitle}>
                      네 가지 분석 항목
                    </Text>
                  </View>
                  <Text type="barlowHard" style={styles.metricHeaderMeta}>
                    78-100 긍정 코칭 척도
                  </Text>
                </View>

                <View style={styles.metricSectionWrap}>
                  <View style={styles.metricGrid}>
                    {detailCards.map((item) => (
                      <TouchableOpacity
                        key={item.metricKey}
                        activeOpacity={0.7}
                        style={styles.metricCard}
                        onPress={() => {
                          void handleJumpMetricMoment(item.metricKey, true);
                          setSelectedMetricDetail(item);
                        }}
                      >
                        <View style={styles.metricCardTopRow}>
                          <Text type="barlowHard" style={styles.metricCardTitle}>
                            {item.label}
                          </Text>
                          <Text type="barlowHard" style={styles.metricCardScore}>
                            {item.score}
                          </Text>
                        </View>
                        <View style={styles.metricBarTrack}>
                          <View style={[styles.metricBarFill, { width: `${item.score}%` }]} />
                        </View>
                        <Text type="barlowLight" style={styles.metricCardFeedback}>
                          {item.feedback || "세부 피드백을 불러오지 못했습니다."}
                        </Text>
                        <Text type="barlowHard" style={styles.metricCardStatus}>
                          {getScoreBandLabel(item.score)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {activeTab === "memo" ? (
              <View style={[styles.tabSectionWrap, styles.tabSectionWrapRelaxed]}>
                <View style={styles.memoMainCard}>
                  <View style={styles.memoHeaderRow}>
                    <Text type="barlowHard" style={styles.memoHeaderTitle}>
                      나만의 기록
                    </Text>
                    <Text type="barlowHard" style={styles.memoSaveStatus}>
                      {memoStatus === "saving"
                        ? "저장 중..."
                        : memoStatus === "saved"
                          ? "저장됨"
                          : memoStatus === "error"
                            ? "저장 실패"
                            : "자동 저장"}
                    </Text>
                  </View>

                  <Text type="barlowHard" style={styles.memoTitleText}>
                    이 스윙에서 느낀 점
                  </Text>
                  <Text type="barlowLight" style={styles.memoSubText}>
                    분석과 별개로 실제로 느낀 감각을 자유롭게 적어주세요.
                  </Text>

                  <TextInput
                    value={memoDraft}
                    onChangeText={(text) => {
                      const limited = text.slice(0, MEMO_MAX_LENGTH);
                      setMemoDraft(limited);
                    }}
                    placeholder={
                      "오늘 스윙에서 느낀 점을 자유롭게 적어보세요.\n\n예:\n오늘은 힘을 빼고 시작하니 테이크백이 더 편했다.\n임팩트 순간에는 고개가 먼저 움직인 느낌이 있었다.\n다음에는 공이 맞는 소리를 들은 뒤 고개를 들어보기."
                    }
                    placeholderTextColor="#98A7A0"
                    multiline
                    textAlignVertical="top"
                    style={styles.memoInput}
                  />

                  <View style={styles.memoHelperRow}>
                    {[
                      "잘 맞았던 느낌",
                      "불편했던 부분",
                      "다음 목표",
                    ].map((preset) => (
                      <Pressable
                        key={preset}
                        style={styles.memoHelperChip}
                        onPress={() => {
                          const prefix = memoDraft.trim().length ? "\n\n" : "";
                          setMemoDraft((prev) => `${prev}${prefix}${preset}: `);
                        }}
                      >
                        <Text type="barlowHard" style={styles.memoHelperChipText}>
                          {preset}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.memoActionRow}>
                    <Pressable
                      style={styles.attachCurrentSceneButton}
                      onPress={() => {
                        setAttachNoteText("");
                        setIsAttachSheetVisible(true);
                      }}
                    >
                      <Text type="barlowHard" style={styles.attachCurrentSceneButtonText}>
                        + 현재 장면 첨부
                      </Text>
                    </Pressable>
                    <Text type="barlowHard" style={styles.memoCountText}>
                      {memoDraft.length} / {MEMO_MAX_LENGTH}
                    </Text>
                  </View>
                </View>

                <View style={styles.timestampSectionWrap}>
                  <View style={styles.timestampHeaderRow}>
                    <Text type="barlowHard" style={styles.timestampSectionTitle}>
                      첨부한 장면
                    </Text>
                    <Text type="barlowLight" style={styles.timestampSectionMeta}>
                      시간을 누르면 바로 이동
                    </Text>
                  </View>

                  {timestampNotes.length ? (
                    timestampNotes.map((note) => (
                      <View key={note.id} style={styles.timestampItemCard}>
                        <Pressable
                          style={styles.timestampBadge}
                          onPress={() => {
                            void seekToSec(note.frameSec);
                            scrollToPlayer();
                          }}
                        >
                          <Text type="barlowHard" style={styles.timestampBadgeText}>
                            {formatClock(note.frameSec)}
                          </Text>
                        </Pressable>
                        <View style={styles.timestampTextWrap}>
                          <Text type="barlowHard" style={styles.timestampPhaseText}>
                            {note.phase}
                          </Text>
                          <Text type="barlowLight" style={styles.timestampBodyText}>
                            {note.text}
                          </Text>
                        </View>
                        <Pressable
                          style={styles.timestampDeleteButton}
                          onPress={() => {
                            void handleDeleteTimestampNote(note.id);
                          }}
                        >
                          <Feather name="trash-2" size={moderateScale(14)} color="#9DB0A7" />
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <View style={styles.timestampEmptyCard}>
                      <Text type="barlowLight" style={styles.timestampEmptyText}>
                        아직 첨부한 장면이 없습니다.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {activeTab === "practice" ? (
              <View style={[styles.tabSectionWrap, styles.tabSectionWrapRelaxed]}>
                {practicePlanHidden ? (
                  <View style={styles.practiceEmptyCard}>
                    <Text type="barlowHard" style={styles.practiceEmptyText}>
                      이 스윙에는 아직 추천 연습이 없습니다.
                    </Text>
                  </View>
                ) : !analysis.practicePlan ? (
                  <View style={styles.practiceEmptyCard}>
                    <Text type="barlowHard" style={styles.practiceEmptyText}>
                      이 스윙에는 아직 추천 연습이 없습니다.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.practiceHeroCard}>
                      <Text type="barlowHard" style={styles.practiceHeroMeta}>
                        {`${getMetricLabel(analysis.practicePlan.relatedMetric)} · ${getPhaseLabel(analysis.practicePlan.targetPhase)} 구간`}
                      </Text>
                      <Text type="barlowHard" style={styles.practiceHeroTitle}>
                        {analysis.practicePlan.title}
                      </Text>
                      <Text type="barlowLight" style={styles.practiceHeroBody}>
                        {analysis.practicePlan.reason}
                      </Text>
                      <View style={styles.practiceHeroCueCard}>
                        <Text type="barlowHard" style={styles.practiceHeroCueLabel}>
                          한 줄 핵심 큐
                        </Text>
                        <Text type="barlowHard" style={styles.practiceHeroCueText}>
                          “{analysis.practicePlan.oneLineCue}”
                        </Text>
                      </View>
                    </View>

                    <View style={styles.practiceContentCard}>
                      <View style={styles.practiceSetupRow}>
                        <Feather name="flag" size={moderateScale(16)} color="#2D8B67" />
                        <View style={styles.practiceSetupTextWrap}>
                          <Text type="barlowHard" style={styles.practiceSectionLabel}>
                            시작 준비
                          </Text>
                          <Text type="barlowLight" style={styles.practiceSectionBody}>
                            {analysis.practicePlan.setup}
                          </Text>
                        </View>
                      </View>

                      <Text type="barlowHard" style={styles.practiceStepsTitle}>
                        연습 방법
                      </Text>

                      {analysis.practicePlan.steps.map((step, index) => (
                        <View key={`${step}-${index}`} style={styles.practiceStepRow}>
                          <View style={styles.practiceStepBadge}>
                            <Text type="barlowHard" style={styles.practiceStepBadgeText}>
                              {index + 1}
                            </Text>
                          </View>
                          <Text type="barlowLight" style={styles.practiceStepText}>
                            {step}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.practiceCriteriaRow}>
                      <View style={styles.practiceSuccessCard}>
                        <Text type="barlowHard" style={styles.practiceCriteriaLabel}>
                          성공 기준
                        </Text>
                        <Text type="barlowLight" style={styles.practiceCriteriaBody}>
                          {analysis.practicePlan.successCriteria}
                        </Text>
                      </View>
                      <View style={styles.practiceWarningCard}>
                        <Text type="barlowHard" style={styles.practiceCriteriaLabel}>
                          과한 교정 주의
                        </Text>
                        <Text type="barlowLight" style={styles.practiceCriteriaBody}>
                          {analysis.practicePlan.commonMistake}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.practiceAttemptsCard}>
                      <View style={styles.practiceAttemptsHeader}>
                        <Text type="barlowHard" style={styles.practiceSectionLabelDark}>
                          {`${analysis.practicePlan.attemptCount}회 집중 연습`}
                        </Text>
                      </View>
                      <View style={styles.practiceAttemptsRow}>
                        {Array.from({ length: analysis.practicePlan.attemptCount }).map((_, index) => (
                          <View key={`attempt-${index}`} style={[styles.practiceAttemptPill, index === 0 && styles.practiceAttemptPillActive]}>
                            <Text type="barlowHard" style={[styles.practiceAttemptPillNumber, index === 0 && styles.practiceAttemptPillNumberActive]}>
                              {index + 1}
                            </Text>
                            <Text type="barlowLight" style={styles.practiceAttemptPillLabel}>
                              {`${index + 1}번째`}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <Pressable style={styles.practiceStartButton} onPress={() => void handleStartPractice()}>
                        <Text type="barlowHard" style={styles.practiceStartButtonText}>
                          {`이 목표로 ${analysis.practicePlan.attemptCount}회 촬영 시작하기`}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            ) : null}
            {/* SWING_REPLAY_REDESIGN_END: 3-tab layout (분석/내 메모/다음 연습) */}
          </ScrollView>

          {isOwner && (
            <View style={styles.imageViewerBottomActions}>
              <Pressable
                style={[
                  styles.imageViewerBottomButton,
                  styles.imageViewerBottomButtonSecondary,
                  analysis.isBest && { backgroundColor: "#D9F46A", borderColor: "#D9F46A" },
                ]}
                onPress={handleToggleBest}
              >
                <View style={styles.imageViewerBottomButtonRow}>
                  <Feather
                    name={analysis.isBest ? "heart" : "heart"}
                    size={moderateScale(16)}
                    color={analysis.isBest ? "#1A241D" : "#1F2B24"}
                  />
                  <Text
                    type="defaultSemiBold"
                    style={[
                      styles.imageViewerBottomButtonSecondaryText,
                      analysis.isBest && { color: "#1A241D" },
                    ]}
                  >
                    {analysis.isBest ? "베스트 해제" : "베스트로 저장"}
                  </Text>
                </View>
              </Pressable>
              <Pressable style={[styles.imageViewerBottomButton, styles.imageViewerBottomButtonPrimary]}>
                <Text type="defaultSemiBold" style={styles.imageViewerBottomButtonPrimaryText}>
                  다시 촬영하기
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>

      <Modal visible={isExitSavingModalVisible} transparent animationType="fade" onRequestClose={() => undefined}>
        <View style={styles.exitSavingBackdrop}>
          <View style={styles.exitSavingCard}>
            <ActivityIndicator size="small" color="#0F7A5C" />
            <Text type="barlowHard" style={styles.exitSavingTitleText}>
              저장중
            </Text>
          </View>
        </View>
      </Modal>

      {/* SWING_REPLAY_REDESIGN_BEGIN: memo timestamp attach sheet */}
      <Modal visible={isAttachSheetVisible} transparent animationType="slide" onRequestClose={() => setIsAttachSheetVisible(false)}>
        <Pressable style={styles.attachSheetBackdrop} onPress={() => setIsAttachSheetVisible(false)} />
        <View style={styles.attachSheetContainer}>
          <Text type="barlowHard" style={styles.attachSheetTitle}>
            현재 장면 메모
          </Text>
          <Text type="barlowLight" style={styles.attachSheetMeta}>
            {`${formatClock(currentSec)} · ${inferCurrentPhase()}`}
          </Text>
          <TextInput
            value={attachNoteText}
            onChangeText={setAttachNoteText}
            placeholder="이 장면에서 느낀 점을 적어주세요"
            placeholderTextColor="#8FA097"
            multiline
            style={styles.attachSheetInput}
            textAlignVertical="top"
          />
          <View style={styles.attachSheetButtonRow}>
            <Pressable style={styles.attachSheetCancelButton} onPress={() => setIsAttachSheetVisible(false)}>
              <Text type="barlowHard" style={styles.attachSheetCancelText}>
                닫기
              </Text>
            </Pressable>
            <Pressable style={styles.attachSheetSaveButton} onPress={() => void handleAttachCurrentMoment()}>
              <Text type="barlowHard" style={styles.attachSheetSaveText}>
                저장
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* SWING_REPLAY_REDESIGN_END: memo timestamp attach sheet */}

      {/* SWING_REPLAY_REDESIGN_BEGIN: metric detail large window */}
      <Modal
        visible={!!selectedMetricDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMetricDetail(null)}
      >
        <Pressable style={styles.metricDetailBackdrop} onPress={() => setSelectedMetricDetail(null)}>
          <Pressable style={styles.metricDetailCard}>
            <View style={styles.metricDetailHeader}>
              <Text type="barlowHard" style={styles.metricDetailLabel}>
                {selectedMetricDetail?.label}
              </Text>
              <Text type="barlowHard" style={styles.metricDetailScore}>
                {selectedMetricDetail?.score}
              </Text>
            </View>
            <Text style={styles.metricDetailFeedback}>
              {selectedMetricDetail?.feedback}
            </Text>
            <TouchableOpacity
              style={styles.metricDetailCloseButton}
              onPress={() => setSelectedMetricDetail(null)}
            >
              <Text type="barlowHard" style={styles.metricDetailCloseText}>
                확인
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      {/* SWING_REPLAY_REDESIGN_END: metric detail large window */}
    </Modal>
  );
}

// SWING_REPLAY_REDESIGN_BEGIN: style tokens for new 3-tab analysis/memo/practice UI
const styles = StyleSheet.create({
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "#0C110E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  imageViewerPanel: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "#0C110C",
    paddingHorizontal: moderateScale(12),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
  },
  imageViewerContent: {
    paddingBottom: moderateScale(124),
  },
  imageViewerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(10),
    marginBottom: moderateScale(14),
  },
  imageViewerTopIconButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: "#1D221F",
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerTopTextWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: moderateScale(2),
  },
  imageViewerTopMetaText: {
    color: "#AEB8B3",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(2),
    fontFamily: "Pretendard-Regular",
  },
  imageViewerTopTitleText: {
    fontSize: moderateScale(FONT.xl),
    color: "#EFF4F1",
  },
  imageViewerTopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  imageViewerStage: {
    width: "100%",
    height: moderateScale(450),
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#243B34",
    overflow: "hidden",
    backgroundColor: "#10201A",
    marginBottom: moderateScale(10),
  },
  imageViewerStageImage: {
    width: "100%",
    height: "100%",
  },
  imageViewerStagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerSpeedPill: {
    position: "absolute",
    right: moderateScale(10),
    top: moderateScale(10),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "#2D423B",
    backgroundColor: "rgba(8,17,14,0.88)",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
  },
  imageViewerSpeedPillText: {
    color: "#E5EEE9",
    fontSize: moderateScale(FONT.xxxs),
  },
  imageViewerTimelineCard: {
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#243832",
    backgroundColor: "#121915",
    padding: moderateScale(10),
    marginTop: moderateScale(14),
    marginBottom: moderateScale(10),
  },
  imageViewerFramesStrip: {
    gap: moderateScale(6),
    paddingBottom: moderateScale(10),
  },
  imageViewerFrameItem: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(10),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#324941",
    backgroundColor: "#1C2D28",
  },
  imageViewerFrameItemActive: {
    borderColor: "#D9F46A",
  },
  imageViewerFrameImage: {
    width: "100%",
    height: "100%",
  },
  imageViewerFramePlaceholder: {
    flex: 1,
    backgroundColor: "#243A33",
  },
  imageViewerProgressTrack: {
    height: moderateScale(11),
    borderRadius: moderateScale(999),
    backgroundColor: "#D7D8DE",
    overflow: "hidden",
  },
  imageViewerProgressTouchArea: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  imageViewerProgressFill: {
    height: "100%",
    backgroundColor: "#D9F46A",
  },
  imageViewerTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: moderateScale(6),
    marginBottom: moderateScale(10),
  },
  imageViewerTimeText: {
    color: "#8EA19A",
    fontSize: moderateScale(FONT.xxxs),
  },
  imageViewerControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  imageViewerControlSmall: {
    width: moderateScale(96),
    minHeight: moderateScale(60),
    borderRadius: moderateScale(16),
    backgroundColor: "#232B26",
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerControlSmallText: {
    color: "#E2EBE7",
    fontSize: moderateScale(FONT.sm),
  },
  imageViewerControlPlay: {
    width: moderateScale(116),
    minHeight: moderateScale(60),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#232B26",
  },
  imageViewerSpeedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  imageViewerSpeedOption: {
    flex: 1,
    minHeight: moderateScale(50),
    borderRadius: moderateScale(16),
    backgroundColor: "#232B26",
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerSpeedOptionActive: {
    backgroundColor: "#232B26",
  },
  imageViewerSpeedOptionText: {
    color: "#9CABA5",
    fontSize: moderateScale(FONT.xs),
  },
  imageViewerSpeedOptionTextActive: {
    color: "#D9F46A",
  },
  imageViewerTabRow: {
    flexDirection: "row",
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#253732",
    backgroundColor: "#121915",
    padding: moderateScale(6),
    marginBottom: moderateScale(24),
  },
  imageViewerTabItem: {
    flex: 1,
    minHeight: moderateScale(40),
    borderRadius: moderateScale(13),
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerTabItemActive: {
    backgroundColor: "#ECEADD",
  },
  imageViewerTabText: {
    color: "#9FB0AA",
    fontSize: moderateScale(FONT.xxs),
  },
  imageViewerTabTextActive: {
    color: "#1A241D",
  },
  tabSectionWrap: {
    gap: moderateScale(10),
    marginBottom: moderateScale(8),
  },
  tabSectionWrapRelaxed: {
    gap: moderateScale(14),
  },
  analysisOverallCard: {
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#DCDDD4",
    backgroundColor: "#ECEBDD",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginBottom: moderateScale(8),
  },
  analysisEyebrow: {
    color: "#2F8A66",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(8),
  },
  analysisOverallTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(10),
  },
  analysisOverallTextWrap: {
    flex: 1,
  },
  analysisTitleText: {
    color: "#1A2720",
    fontSize: moderateScale(FONT.lg),
    marginBottom: moderateScale(6),
    lineHeight: moderateScale(30),
  },
  analysisSummaryText: {
    color: "#657771",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(26),
    fontFamily: "Pretendard-Regular",
  },
  overallScoreTile: {
    width: moderateScale(86),
    minHeight: moderateScale(86),
    borderRadius: moderateScale(22),
    backgroundColor: "#E2FF6D",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(8),
  },
  overallScoreTileValue: {
    color: "#172114",
    fontSize: moderateScale(FONT.h2),
    lineHeight: moderateScale(42),
  },
  overallScoreTileMeta: {
    color: "#21311E",
    fontSize: moderateScale(FONT.xxxs),
  },
  overallScoreBandText: {
    color: "#2D4C23",
    fontSize: moderateScale(FONT.xxxs - 1),
    marginTop: moderateScale(2),
    fontFamily: "Pretendard-Regular",
  },
  captureQualityCard: {
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#2D463E",
    backgroundColor: "#1A2320",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(11),
  },
  captureQualityCardWarning: {
    borderColor: "#66553A",
    backgroundColor: "#2A2418",
  },
  captureQualityHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(4),
  },
  captureQualityTitle: {
    color: "#D8EFE6",
    fontSize: moderateScale(FONT.xxs),
  },
  captureQualityConfidence: {
    color: "#D6EF75",
    fontSize: moderateScale(FONT.xxxs),
  },
  captureQualityBody: {
    color: "#9BB0A8",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  captureQualityIssueText: {
    marginTop: moderateScale(5),
    color: "#E5C795",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  pointGridRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginBottom: moderateScale(14),
  },
  pointCard: {
    flex: 1,
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  strongPointCard: {
    backgroundColor: "#DDF4D8",
  },
  focusPointCard: {
    backgroundColor: "#FFE6B2",
  },
  pointLabelText: {
    color: "#286644",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(6),
  },
  pointTitleText: {
    color: "#1B2B23",
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(5),
  },
  pointBodyText: {
    color: "#61746D",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(26),
    marginBottom: moderateScale(6),
    fontFamily: "Pretendard-Regular",
  },
  pointCueText: {
    color: "#183426",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(8),
  },
  pointActionButton: {
    minHeight: moderateScale(32),
    borderRadius: moderateScale(12),
    backgroundColor: "#134D38",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(6),
  },
  pointActionButtonText: {
    color: "#EFF7F3",
    fontSize: moderateScale(FONT.xxxs),
  },
  pointConfidenceText: {
    color: "#5C6F68",
    fontSize: moderateScale(FONT.xxxs - 1),
    fontFamily: "Pretendard-Regular",
  },
  metricHeaderCard: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#24342E",
    backgroundColor: "#1A211E",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    marginBottom: moderateScale(8),
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },
  metricHeaderTextWrap: {
    flex: 1,
  },
  metricHeaderEyebrow: {
    color: "#41A078",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(2),
  },
  metricHeaderTitle: {
    color: "#EAF2EE",
    fontSize: moderateScale(FONT.lg),
  },
  metricHeaderMeta: {
    color: "#A9B8B2",
    fontSize: moderateScale(FONT.xxxs),
  },
  metricSectionWrap: {
    paddingHorizontal: moderateScale(2),
    paddingVertical: moderateScale(2),
  },
  metricSectionHeader: {
    marginBottom: moderateScale(8),
  },
  metricSectionTitle: {
    color: "#DCE8E1",
    fontSize: moderateScale(FONT.sm),
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  metricCard: {
    width: "48.5%",
    borderRadius: moderateScale(14),
    backgroundColor: "#ECEBDD",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
  },
  metricCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(6),
  },
  metricCardTitle: {
    color: "#1F2C25",
    fontSize: moderateScale(FONT.xxs),
  },
  metricCardScore: {
    color: "#246F4E",
    fontSize: moderateScale(FONT.lg),
  },
  metricBarTrack: {
    height: moderateScale(5),
    borderRadius: moderateScale(6),
    overflow: "hidden",
    backgroundColor: "#CAD1C9",
    marginBottom: moderateScale(6),
  },
  metricBarFill: {
    height: "100%",
    backgroundColor: "#2F8C67",
  },
  metricCardFeedback: {
    color: "#667973",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(24),
    marginBottom: moderateScale(6),
    fontFamily: "Pretendard-Regular",
  },
  metricCardStatus: {
    color: "#BE8E36",
    fontSize: moderateScale(FONT.xxxs),
  },
  keyMomentsWrap: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#1F312B",
    backgroundColor: "#101813",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  keyMomentScrollContent: {
    gap: moderateScale(8),
    paddingRight: moderateScale(4),
  },
  keyMomentCard: {
    width: moderateScale(220),
    borderRadius: moderateScale(14),
    backgroundColor: "#16201B",
    padding: moderateScale(10),
  },
  keyMomentThumbWrap: {
    height: moderateScale(130),
    borderRadius: moderateScale(12),
    overflow: "hidden",
    backgroundColor: "#22352F",
    marginBottom: moderateScale(10),
  },
  keyMomentThumbImage: {
    width: "100%",
    height: "100%",
  },
  keyMomentThumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keyMomentTypePill: {
    position: "absolute",
    top: moderateScale(6),
    left: moderateScale(6),
    borderRadius: moderateScale(999),
    backgroundColor: "#DFF66A",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
  },
  keyMomentTypePillText: {
    color: "#1A231D",
    fontSize: moderateScale(FONT.xxxs - 1),
  },
  keyMomentPhaseText: {
    color: "#95A9A1",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(4),
  },
  keyMomentTitleText: {
    color: "#E4EFE9",
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(6),
  },
  keyMomentObservationText: {
    color: "#9AAEA5",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(24),
    minHeight: moderateScale(64),
    fontFamily: "Pretendard-Regular",
  },
  keyMomentTimeText: {
    color: "#D4E972",
    fontSize: moderateScale(FONT.xxs),
    marginTop: moderateScale(6),
  },
  memoMainCard: {
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#DCDDD4",
    backgroundColor: "#ECEBDD",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
  },
  memoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },
  memoHeaderTitle: {
    color: "#2D8B67",
    fontSize: moderateScale(FONT.xxs),
  },
  memoSaveStatus: {
    color: "#5C746A",
    fontSize: moderateScale(FONT.xxxs),
  },
  memoTitleText: {
    color: "#17251E",
    fontSize: moderateScale(FONT.h2),
    lineHeight: moderateScale(42),
  },
  memoSubText: {
    color: "#667A73",
    fontSize: moderateScale(FONT.xs),
    lineHeight: moderateScale(24),
    marginBottom: moderateScale(10),
    fontFamily: "Pretendard-Regular",
  },
  memoInput: {
    minHeight: moderateScale(200),
    borderRadius: moderateScale(20),
    backgroundColor: "#DEE3DB",
    color: "#26332D",
    padding: moderateScale(14),
    fontSize: moderateScale(FONT.xs),
    fontFamily: "Pretendard-Regular",
  },
  memoHelperRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginTop: moderateScale(10),
  },
  memoHelperChip: {
    flex: 1,
    minHeight: moderateScale(36),
    borderRadius: moderateScale(999),
    backgroundColor: "#E0E5DD",
    alignItems: "center",
    justifyContent: "center",
  },
  memoHelperChipText: {
    color: "#697A72",
    fontSize: moderateScale(FONT.xxxs),
  },
  memoActionRow: {
    marginTop: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attachCurrentSceneButton: {
    minHeight: moderateScale(44),
    borderRadius: moderateScale(20),
    backgroundColor: "#1C5E45",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(18),
  },
  attachCurrentSceneButtonText: {
    color: "#F1F8F5",
    fontSize: moderateScale(FONT.xs),
  },
  memoCountText: {
    color: "#71817A",
    fontSize: moderateScale(FONT.xxs),
  },
  timestampSectionWrap: {
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#DCDDD4",
    backgroundColor: "#ECEBDD",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    gap: moderateScale(8),
  },
  timestampHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  timestampSectionTitle: {
    color: "#1D2A22",
    fontSize: moderateScale(FONT.lg),
  },
  timestampSectionMeta: {
    color: "#8B9A94",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  timestampItemCard: {
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#D6DACE",
    backgroundColor: "#F5F3EA",
    padding: moderateScale(9),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  timestampBadge: {
    minWidth: moderateScale(70),
    minHeight: moderateScale(38),
    borderRadius: moderateScale(12),
    backgroundColor: "#D9F06A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(8),
  },
  timestampBadgeText: {
    color: "#1B231A",
    fontSize: moderateScale(FONT.xxxs),
  },
  timestampTextWrap: {
    flex: 1,
  },
  timestampPhaseText: {
    color: "#2A6E50",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(2),
  },
  timestampBodyText: {
    color: "#596C65",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  timestampDeleteButton: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
  },
  timestampEmptyCard: {
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#D3D9D0",
    borderStyle: "dashed",
    backgroundColor: "#F5F3EA",
    minHeight: moderateScale(86),
    alignItems: "center",
    justifyContent: "center",
  },
  timestampEmptyText: {
    color: "#8B9C94",
    fontSize: moderateScale(FONT.xxs),
    fontFamily: "Pretendard-Regular",
  },
  practiceHeroCard: {
    borderRadius: moderateScale(22),
    backgroundColor: "#E5FF67",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
  },
  practiceHeroMeta: {
    color: "#2A6B44",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(6),
  },
  practiceHeroTitle: {
    color: "#1A261D",
    fontSize: moderateScale(FONT.xl),
    lineHeight: moderateScale(30),
    marginBottom: moderateScale(6),
  },
  practiceHeroBody: {
    color: "#5F725D",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(26),
    fontFamily: "Pretendard-Regular",
  },
  practiceHeroCueCard: {
    marginTop: moderateScale(10),
    borderRadius: moderateScale(14),
    backgroundColor: "#F8FCE9",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
  },
  practiceHeroCueLabel: {
    color: "#4F685A",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(3),
  },
  practiceHeroCueText: {
    color: "#1D2B24",
    fontSize: moderateScale(FONT.xs),
    lineHeight: moderateScale(20),
  },
  practiceContentCard: {
    borderRadius: moderateScale(20),
    backgroundColor: "#ECEBDD",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  practiceSetupRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(8),
    marginBottom: moderateScale(10),
  },
  practiceSetupTextWrap: {
    flex: 1,
  },
  practiceSectionLabel: {
    color: "#1F2E27",
    fontSize: moderateScale(FONT.xs),
    marginBottom: moderateScale(2),
  },
  practiceSectionBody: {
    color: "#64766F",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(24),
    fontFamily: "Pretendard-Regular",
  },
  practiceStepsTitle: {
    color: "#1F2E27",
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(8),
  },
  practiceStepRow: {
    borderRadius: moderateScale(12),
    backgroundColor: "#E0E7DF",
    padding: moderateScale(8),
    marginBottom: moderateScale(8),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  practiceStepBadge: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "#1D5F46",
    alignItems: "center",
    justifyContent: "center",
  },
  practiceStepBadgeText: {
    color: "#ECF4F0",
    fontSize: moderateScale(FONT.xxs),
  },
  practiceStepText: {
    flex: 1,
    color: "#52655E",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(24),
    fontFamily: "Pretendard-Regular",
  },
  practiceCriteriaRow: {
    flexDirection: "row",
    gap: moderateScale(8),
  },
  practiceSuccessCard: {
    flex: 1,
    borderRadius: moderateScale(14),
    backgroundColor: "#17241F",
    padding: moderateScale(10),
  },
  practiceWarningCard: {
    flex: 1,
    borderRadius: moderateScale(14),
    backgroundColor: "#3C2E1B",
    padding: moderateScale(10),
  },
  practiceCriteriaLabel: {
    color: "#D9ECDE",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(4),
  },
  practiceCriteriaBody: {
    color: "#C7D4CC",
    fontSize: moderateScale(FONT.xxxs),
    lineHeight: moderateScale(16),
    fontFamily: "Pretendard-Regular",
  },
  practiceAttemptsCard: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#1F312B",
    backgroundColor: "#101813",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
  },
  practiceAttemptsHeader: {
    marginBottom: moderateScale(8),
  },
  practiceSectionLabelDark: {
    color: "#DCE8E1",
    fontSize: moderateScale(FONT.xs),
  },
  practiceAttemptsRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  practiceAttemptPill: {
    flex: 1,
    minHeight: moderateScale(64),
    borderRadius: moderateScale(14),
    backgroundColor: "#16201C",
    alignItems: "center",
    justifyContent: "center",
  },
  practiceAttemptPillActive: {
    backgroundColor: "#20301A",
    borderWidth: 1,
    borderColor: "#5F7A2C",
  },
  practiceAttemptPillNumber: {
    color: "#D6E0DB",
    fontSize: moderateScale(FONT.lg),
  },
  practiceAttemptPillNumberActive: {
    color: "#F2FAE7",
  },
  practiceAttemptPillLabel: {
    color: "#8C9F97",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  practiceStartButton: {
    minHeight: moderateScale(52),
    borderRadius: moderateScale(16),
    backgroundColor: "#1A6248",
    alignItems: "center",
    justifyContent: "center",
  },
  practiceStartButtonText: {
    color: "#EFF7F4",
    fontSize: moderateScale(FONT.xs),
  },
  practiceEmptyCard: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#294039",
    backgroundColor: "#131D19",
    minHeight: moderateScale(120),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(14),
  },
  practiceEmptyText: {
    color: "#A5B5AE",
    fontSize: moderateScale(FONT.xxs),
    textAlign: "center",
    fontFamily: "Pretendard-Regular",
  },
  playerFloatingPill: {
    position: "absolute",
    left: moderateScale(12),
    bottom: moderateScale(12),
    borderRadius: moderateScale(999),
    backgroundColor: "rgba(7, 17, 13, 0.85)",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
  },
  playerFloatingPillText: {
    color: "#E8F2ED",
    fontSize: moderateScale(FONT.xxxs),
  },
  attachSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,8,7,0.55)",
  },
  exitSavingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,10,8,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  exitSavingCard: {
    minWidth: moderateScale(132),
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(14),
    backgroundColor: "#F2F3EB",
    borderWidth: 1,
    borderColor: "#D5DCCD",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(10),
  },
  exitSavingTitleText: {
    fontSize: moderateScale(FONT.sm),
    color: "#1D2A25",
  },
  attachSheetContainer: {
    borderTopLeftRadius: moderateScale(22),
    borderTopRightRadius: moderateScale(22),
    backgroundColor: "#ECEBDD",
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(24),
  },
  attachSheetTitle: {
    color: "#18251E",
    fontSize: moderateScale(FONT.md),
    marginBottom: moderateScale(4),
  },
  attachSheetMeta: {
    color: "#5F726A",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(10),
    fontFamily: "Pretendard-Regular",
  },
  attachSheetInput: {
    minHeight: moderateScale(120),
    borderRadius: moderateScale(16),
    backgroundColor: "#DEE3DB",
    color: "#23322B",
    padding: moderateScale(12),
    fontSize: moderateScale(FONT.xs),
    fontFamily: "Pretendard-Regular",
  },
  attachSheetButtonRow: {
    marginTop: moderateScale(12),
    flexDirection: "row",
    gap: moderateScale(8),
  },
  attachSheetCancelButton: {
    flex: 1,
    minHeight: moderateScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: "#DBDED4",
    alignItems: "center",
    justifyContent: "center",
  },
  attachSheetCancelText: {
    color: "#566A62",
    fontSize: moderateScale(FONT.xs),
  },
  attachSheetSaveButton: {
    flex: 1,
    minHeight: moderateScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: "#1C5E45",
    alignItems: "center",
    justifyContent: "center",
  },
  attachSheetSaveText: {
    color: "#EFF7F4",
    fontSize: moderateScale(FONT.xs),
  },
  imageViewerBottomActions: {
    position: "absolute",
    left: moderateScale(10),
    right: moderateScale(10),
    bottom: moderateScale(20),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    borderRadius: moderateScale(30),
    backgroundColor: "#ECEBDD",
    padding: moderateScale(8),
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: moderateScale(16),
    shadowOffset: { width: 0, height: moderateScale(8) },
    elevation: 8,
  },
  imageViewerBottomButton: {
    flex: 1,
    minHeight: moderateScale(60),
    borderRadius: moderateScale(24),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  imageViewerBottomButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  imageViewerBottomButtonSecondary: {
    backgroundColor: "#DDE1DA",
    borderColor: "#DDE1DA",
  },
  imageViewerBottomButtonPrimary: {
    backgroundColor: "#1C6147",
    borderColor: "#1C6147",
  },
  imageViewerBottomButtonSecondaryText: {
    color: "#1D241D",
    fontFamily: "Pretendard-Regular",
    fontSize: moderateScale(FONT.sm),
  },
  imageViewerBottomButtonPrimaryText: {
    color: "#ECF5F1",
    fontFamily: "Pretendard-Regular",
    fontSize: moderateScale(FONT.sm),
  },
  metricDetailBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
  },
  metricDetailCard: {
    width: "100%",
    backgroundColor: "#ECEBDD",
    borderRadius: moderateScale(24),
    padding: moderateScale(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  metricDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(20),
  },
  metricDetailLabel: {
    fontSize: moderateScale(FONT.lg),
    color: "#1A241D",
  },
  metricDetailScore: {
    fontSize: moderateScale(FONT.h2),
    color: "#246F4E",
  },
  metricDetailFeedback: {
    fontSize: moderateScale(FONT.md),
    lineHeight: moderateScale(28),
    color: "#3A4D45",
    fontFamily: "Pretendard-Regular",
    marginBottom: moderateScale(30),
    textAlign: "center",
  },
  metricDetailCloseButton: {
    backgroundColor: "#1C6147",
    height: moderateScale(54),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  metricDetailCloseText: {
    color: "#ECF5F1",
    fontSize: moderateScale(FONT.sm),
  },
});
// SWING_REPLAY_REDESIGN_END: style tokens for new 3-tab analysis/memo/practice UI
