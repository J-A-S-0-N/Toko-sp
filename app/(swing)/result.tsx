import SwingImageViewerModal from "@/components/SwingComponents/SwingImageViewerModal";
import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import { captureRef } from "react-native-view-shot";

type SwingAnalysisState = {
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
  playbackReady: boolean;
  trimmedVideoUrl: string;
  trimStartSec: number;
  trimEndSec: number;
  screenshots: { url?: string; sec?: number; storagePath?: string }[];
  ownerId: string;
};

const DEFAULT_ANALYSIS: SwingAnalysisState = {
  overallScore: 0,
  addressAngleScore: 0,
  headUpScore: 0,
  backswingAngleScore: 0,
  takebackScore: 0,
  addressAngleFeedback: "어드레스 각도 피드백이 아직 준비되지 않았습니다.",
  headUpFeedback: "헤드업 피드백이 아직 준비되지 않았습니다.",
  backswingAngleFeedback: "백스윙 각도 피드백이 아직 준비되지 않았습니다.",
  takebackFeedback: "테이크백 피드백이 아직 준비되지 않았습니다.",
  summary: "분석 결과를 불러오는 중입니다.",
  playbackReady: false,
  trimmedVideoUrl: "",
  trimStartSec: 0,
  trimEndSec: 0,
  screenshots: [],
  ownerId: "",
};

function toScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function toText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

type SwingComment = {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: any;
  likes: number;
};

export default function SwingResultScreen() {
  const router = useRouter();
  const { user, username: authUsername } = useAuth();
  const { swingVideoId } = useLocalSearchParams<{ swingVideoId?: string }>();
  const [analysis, setAnalysis] = React.useState<SwingAnalysisState>(DEFAULT_ANALYSIS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isViewerVisible, setIsViewerVisible] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | null>(null);
  const [rawAnalysisDocument, setRawAnalysisDocument] =
    React.useState<Record<string, unknown> | null>(null);
  
  const [comments, setComments] = React.useState<SwingComment[]>([]);
  const [commentText, setCommentText] = React.useState("");
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [sharePreviewUri, setSharePreviewUri] = React.useState<string | null>(null);
  const [isSharePreviewVisible, setIsSharePreviewVisible] = React.useState(false);
  const [isShareCapturing, setIsShareCapturing] = React.useState(false);
  const [isShareDownloading, setIsShareDownloading] = React.useState(false);
  const [sharePosterSize, setSharePosterSize] = React.useState<{ width: number; height: number } | null>(
    null
  );
  const [isPosterScreenshotReady, setIsPosterScreenshotReady] = React.useState(false);
  const sharePosterRef = React.useRef<View>(null);

  React.useEffect(() => {
    if (!swingVideoId) {
      setIsLoading(false);
      return;
    }

    const swingVideoRef = doc(db, "SwingVideos", swingVideoId);
    const unsubscribe = onSnapshot(swingVideoRef, (snapshot) => {
      if (!snapshot.exists()) {
        setIsLoading(false);
        return;
      }

      const data = snapshot.data();
      setRawAnalysisDocument(data as Record<string, unknown>);
      setAnalysis({
        overallScore: toScore(data?.overallScore),
        addressAngleScore: toScore(data?.addressAngleScore),
        headUpScore: toScore(data?.headUpScore),
        backswingAngleScore: toScore(data?.backswingAngleScore),
        takebackScore: toScore(data?.takebackScore),
        addressAngleFeedback: toText(
          data?.addressAngleFeedback,
          DEFAULT_ANALYSIS.addressAngleFeedback
        ),
        headUpFeedback: toText(data?.headUpFeedback, DEFAULT_ANALYSIS.headUpFeedback),
        backswingAngleFeedback: toText(
          data?.backswingAngleFeedback,
          DEFAULT_ANALYSIS.backswingAngleFeedback
        ),
        takebackFeedback: toText(data?.takebackFeedback, DEFAULT_ANALYSIS.takebackFeedback),
        summary: toText(data?.summary, DEFAULT_ANALYSIS.summary),
        playbackReady: Boolean(data?.playbackReady),
        trimmedVideoUrl: typeof data?.trimmedVideoUrl === "string" ? data.trimmedVideoUrl : "",
        trimStartSec: typeof data?.trimStartSec === "number" ? data.trimStartSec : 0,
        trimEndSec: typeof data?.trimEndSec === "number" ? data.trimEndSec : 0,
        screenshots: Array.isArray(data?.screenshots) ? data.screenshots : [],
        ownerId: typeof data?.userId === "string" ? data.userId : "",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [swingVideoId]);

  React.useEffect(() => {
    if (!swingVideoId) return;

    const commentsRef = collection(db, "SwingVideos", swingVideoId, "Comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SwingComment[];
      setComments(fetched);
    });

    return () => unsubscribe();
  }, [swingVideoId]);

  const handleSubmitComment = async () => {
    if (!swingVideoId || !user || !commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const commentsRef = collection(db, "SwingVideos", swingVideoId, "Comments");
      await addDoc(commentsRef, {
        userId: user.uid,
        username: authUsername || "익명",
        text: commentText.trim(),
        createdAt: serverTimestamp(),
        likes: 0,
      });
      setCommentText("");
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("오류", "댓글을 등록하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "익";
    return name.charAt(0);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "방금 전";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const detailScores = [
    {
      key: "addressAngleScore",
      label: "어드레스 각도",
      score: analysis.addressAngleScore,
      feedback: analysis.addressAngleFeedback,
    },
    {
      key: "headUpScore",
      label: "헤드업",
      score: analysis.headUpScore,
      feedback: analysis.headUpFeedback,
    },
    {
      key: "backswingAngleScore",
      label: "백스윙 각도",
      score: analysis.backswingAngleScore,
      feedback: analysis.backswingAngleFeedback,
    },
    {
      key: "takebackScore",
      label: "테이크백",
      score: analysis.takebackScore,
      feedback: analysis.takebackFeedback,
    },
  ];

  const weakestDetail = detailScores.reduce((lowest, current) => {
    if (!lowest) return current;
    return current.score < lowest.score ? current : lowest;
  }, detailScores[0]);
  const secondShareScreenshotUrl =
    typeof analysis.screenshots[1]?.url === "string" && analysis.screenshots[1].url.trim().length > 0
      ? analysis.screenshots[1].url
      : "";

  React.useEffect(() => {
    if (!secondShareScreenshotUrl) {
      setIsPosterScreenshotReady(true);
      return;
    }
    setIsPosterScreenshotReady(false);
  }, [secondShareScreenshotUrl]);

  const handleShare = async () => {
    if (!sharePosterRef.current || isShareCapturing) return;
    if (!sharePosterSize || sharePosterSize.width <= 0 || sharePosterSize.height <= 0) {
      Alert.alert("이미지 준비 중", "공유 레이아웃을 계산 중이에요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!isPosterScreenshotReady) {
      Alert.alert("이미지 준비 중", "스윙 스크린샷을 불러오는 중이에요. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsShareCapturing(true);
    try {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      const captureScale = Math.max(2, Math.ceil(PixelRatio.get()));
      const captureWidth = Math.round(sharePosterSize.width * captureScale);
      const captureHeight = Math.round(sharePosterSize.height * captureScale);
      const uri = await captureRef(sharePosterRef, {
        format: "jpg",
        quality: 0.95,
        result: "tmpfile",
        width: captureWidth,
        height: captureHeight,
      });
      setSharePreviewUri(uri);
      setIsSharePreviewVisible(true);
    } catch {
      Alert.alert("이미지 생성 실패", "공유 이미지를 만드는 중 문제가 발생했어요.");
    } finally {
      setIsShareCapturing(false);
    }
  };

  const handleDownloadShareImage = async () => {
    if (!sharePreviewUri || isShareDownloading) return;
    setIsShareDownloading(true);
    try {
      const permissionResult = await MediaLibrary.requestPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("권한 필요", "사진 저장을 위해 갤러리 접근 권한이 필요합니다.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(sharePreviewUri);
      Alert.alert("저장 완료", "공유 이미지가 갤러리에 저장되었습니다.");
    } catch {
      Alert.alert("저장 실패", "이미지를 저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsShareDownloading(false);
    }
  };

  const handleOpenPlayback = () => {
    if (!analysis.playbackReady || !analysis.trimmedVideoUrl) {
      Alert.alert("재생 준비 중", "영상이 아직 준비되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    setSelectedImageUrl(analysis.screenshots[0]?.url ?? null);
    setIsViewerVisible(true);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={moderateScale(20)} color="#DDE4E2" />
          </Pressable>

          <Text type="barlowHard" style={styles.headerTitle}>
            스윙 분석 결과
          </Text>

          <Pressable style={styles.iconButton} onPress={() => router.replace("/(tabs)")}>
            <Feather name="arrow-up-right" size={moderateScale(18)} color="#DDE4E2" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#064133", "#02271D", "#04140F", "#010705"]}
            locations={[0, 0.28, 0.62, 1]}
            start={{ x: 0.08, y: 0.04 }}
            end={{ x: 0.95, y: 0.98 }}
            style={styles.overallCard}
          >
            <Text type="barlowHard" style={styles.overallLabel}>
              OVERALL SCORE
            </Text>

            <View style={styles.scoreRingWrap}>
              <View style={styles.scoreRingTrack}>
                <View
                  style={[
                    styles.scoreRingFill,
                    {
                      transform: [{ rotate: `${(analysis.overallScore / 100) * 360}deg` }],
                    },
                  ]}
                />
                <View style={styles.scoreCenter}>
                  <Text type="barlowHard" style={styles.scoreValue}>
                    {analysis.overallScore}
                  </Text>
                  <Text type="barlowLight" style={styles.scoreBase}>
                    / 100
                  </Text>
                </View>
              </View>
            </View>

            <Text type="barlowHard" style={styles.overallTitle}>
              {isLoading ? "분석 결과를 불러오는 중" : "파크골프 스윙 분석 완료"}
            </Text>
            <Text type="barlowLight" style={styles.overallDescription}>
              {analysis.summary}
            </Text>
          </LinearGradient>

          <View style={styles.detailHeaderRow}>
            <Text type="barlowHard" style={styles.detailTitle}>
              세부 점수
            </Text>
            <Text type="barlowLight" style={styles.detailMeta}>
              파크골프 · 5프레임
            </Text>
          </View>

          {detailScores.map((item) => (
            <View key={item.key} style={styles.scoreItemCard}>
              <View style={styles.scoreItemTopRow}>
                <Text type="barlowLight" style={styles.scoreItemLabel}>
                  {item.label}
                </Text>
                <Text type="barlowHard" style={styles.scoreItemValue}>
                  {item.score}
                </Text>
              </View>

              <View style={styles.scoreBarTrack}>
                <View style={[styles.scoreBarFill, { width: `${item.score}%` }]} />
              </View>

              <Text type="barlowLight" style={styles.scoreItemFeedback}>
                {item.feedback}
              </Text>
            </View>
          ))}

          <View style={styles.fixCard}>
            <Text type="barlowHard" style={styles.fixLabel}>
              가장 먼저 고칠 부분
            </Text>
            <Text type="barlowHard" style={styles.fixTitle}>
              {weakestDetail.label}
            </Text>
            <Text type="barlowLight" style={styles.fixDescription}>
              {weakestDetail.feedback}
            </Text>
          </View>

          <View style={styles.commentSection}>
            <View style={styles.commentHeaderRow}>
              <Text type="barlowHard" style={styles.commentTitle}>댓글</Text>
              <Text type="barlowLight" style={styles.commentCount}>{comments.length}개</Text>
            </View>

            <View style={styles.commentInputCard}>
              <View style={styles.commentInputTopRow}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.avatarText}>{getInitials(authUsername || "")}</Text>
                </View>
                <TextInput
                  style={styles.commentInput}
                  placeholder="이 스윙에 대한 의견이나 응원을 남겨보세요."
                  placeholderTextColor="#556661"
                  multiline
                  maxLength={200}
                  value={commentText}
                  onChangeText={setCommentText}
                />
              </View>
              <View style={styles.commentInputBottomRow}>
                <Text style={styles.charCounter}>{commentText.length}/200</Text>
                <Pressable
                  style={[
                    styles.commentSubmitButton,
                    (!commentText.trim() || isSubmittingComment) && styles.commentSubmitButtonDisabled
                  ]}
                  onPress={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <ActivityIndicator size="small" color="#03150F" />
                  ) : (
                    <Text type="barlowHard" style={styles.commentSubmitText}>등록</Text>
                  )}
                </Pressable>
              </View>
            </View>

            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentItemLeft}>
                  <View style={[styles.commentAvatar, styles.commentAvatarSmall]}>
                    <Text style={styles.avatarTextSmall}>{getInitials(comment.username)}</Text>
                  </View>
                </View>
                <View style={styles.commentItemRight}>
                  <View style={styles.commentItemHeader}>
                    <Text type="barlowHard" style={styles.commentAuthor}>{comment.username}</Text>
                    <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <View style={styles.commentActions}>
                    <Pressable style={styles.commentActionBtn}>
                      <Text style={styles.commentActionText}>좋아요 {comment.likes > 0 ? comment.likes : ""}</Text>
                    </Pressable>
                    <Pressable style={styles.commentActionBtn}>
                      <Text style={styles.commentActionText}>답글</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.bottomButtonRow}>
          <Pressable
            style={[styles.playbackButton, (!analysis.playbackReady || !analysis.trimmedVideoUrl) && styles.playbackButtonDisabled]}
            onPress={handleOpenPlayback}
            disabled={!analysis.playbackReady || !analysis.trimmedVideoUrl}
          >
            <Feather name="play" size={moderateScale(16)} color="#1D241D" />
            <Text type="barlowHard" style={styles.playbackButtonText}>
              스윙 보기
            </Text>
          </Pressable>
          
          {user?.uid === analysis.ownerId && (
            <Pressable style={styles.shareButton} onPress={handleShare}>
              <Text type="barlowHard" style={styles.shareButtonText}>
                공유하기
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <SwingImageViewerModal
        visible={isViewerVisible}
        swingVideoId={swingVideoId ?? ""}
        analysisDocument={rawAnalysisDocument}
        selectedImageUrl={selectedImageUrl}
        screenshots={analysis.screenshots}
        summary={analysis.summary}
        takebackFeedback={analysis.takebackFeedback}
        trimmedVideoUrl={analysis.trimmedVideoUrl}
        trimStartSec={analysis.trimStartSec}
        trimEndSec={analysis.trimEndSec}
        playbackReady={analysis.playbackReady}
        onRequestClose={() => {
          setIsViewerVisible(false);
          setSelectedImageUrl(null);
        }}
        onSelectImage={(url) => setSelectedImageUrl(url)}
        onShare={handleShare}
      />

      <Modal
        visible={isSharePreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSharePreviewVisible(false)}
      >
        <View style={styles.sharePreviewOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsSharePreviewVisible(false)} />
          <View style={styles.sharePreviewSheet}>
            <Text type="barlowHard" style={styles.sharePreviewTitle}>
              공유 이미지 미리보기
            </Text>

            {sharePreviewUri ? (
              <Image source={{ uri: sharePreviewUri }} style={styles.sharePreviewImage} resizeMode="contain" />
            ) : (
              <View style={styles.sharePreviewEmpty}>
                <Text type="barlowLight" style={styles.sharePreviewEmptyText}>
                  미리보기 이미지를 불러오지 못했습니다.
                </Text>
              </View>
            )}

            <View style={styles.sharePreviewButtonRow}>
              <Pressable
                style={styles.sharePreviewCloseButton}
                onPress={() => setIsSharePreviewVisible(false)}
              >
                <Text type="barlowHard" style={styles.sharePreviewCloseButtonText}>
                  닫기
                </Text>
              </Pressable>

              <Pressable
                style={[styles.sharePreviewDownloadButton, isShareDownloading && styles.sharePreviewDownloadButtonDisabled]}
                onPress={() => void handleDownloadShareImage()}
                disabled={isShareDownloading || !sharePreviewUri}
              >
                {isShareDownloading ? (
                  <ActivityIndicator size="small" color="#03150F" />
                ) : (
                  <Text type="barlowHard" style={styles.sharePreviewDownloadButtonText}>
                    다운로드
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View pointerEvents="none" style={styles.shareCaptureHiddenWrap}>
        <View
          ref={sharePosterRef}
          collapsable={false}
          style={styles.shareCapturePoster}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setSharePosterSize({ width, height });
          }}
        >
          <LinearGradient
            colors={["#28C892", "#0B4D38", "#041C14", "#010B08"]}
            locations={[0, 0.32, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shareCapturePosterGradient}
          >
            <Text type="barlowHard" style={styles.shareCaptureDateText}>
              {new Date().toLocaleDateString("ko-KR")}
            </Text>

            <Text type="barlowHard" style={styles.shareCaptureMainScore}>
              {analysis.overallScore}점
            </Text>

            {secondShareScreenshotUrl ? (
              <View style={styles.shareCaptureSwingImageWrap}>
                <Image
                  source={{ uri: secondShareScreenshotUrl }}
                  style={styles.shareCaptureSwingImage}
                  onLoad={() => setIsPosterScreenshotReady(true)}
                  onError={() => setIsPosterScreenshotReady(true)}
                />
              </View>
            ) : null}

            <View style={styles.shareCaptureMetricRow}>
              {[
                ["어드레스", analysis.addressAngleScore],
                ["헤드업", analysis.headUpScore],
                ["백스윙", analysis.backswingAngleScore],
                ["테이크백", analysis.takebackScore],
              ].map(([label, score]) => (
                <View key={label} style={styles.shareCaptureMetricCard}>
                  <Text type="barlowLight" style={styles.shareCaptureMetricLabel}>
                    {label}
                  </Text>
                  <Text type="barlowHard" style={styles.shareCaptureMetricValue}>
                    {score}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#010706",
  },
  container: {
    flex: 1,
    backgroundColor: "#010706",
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(16),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(12),
  },
  iconButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#18312D",
    backgroundColor: "rgba(8,18,16,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: moderateScale(FONT.sm),
    color: "#EFF4F1",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateScale(124),
  },
  overallCard: {
    borderRadius: moderateScale(26),
    borderWidth: 1,
    borderColor: "#164C42",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(18),
    marginBottom: moderateScale(16),
  },
  overallLabel: {
    color: "#11E2A0",
    textAlign: "center",
    letterSpacing: moderateScale(1.8),
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(12),
  },
  scoreRingWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(14),
  },
  scoreRingTrack: {
    width: moderateScale(184),
    height: moderateScale(184),
    borderRadius: moderateScale(100),
    borderWidth: moderateScale(16),
    borderColor: "#18352F",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreRingFill: {
    position: "absolute",
    width: moderateScale(184),
    height: moderateScale(184),
    borderRadius: moderateScale(100),
    borderWidth: moderateScale(16),
    borderColor: "transparent",
    borderTopColor: "#12E3A2",
    borderRightColor: "#12E3A2",
  },
  scoreCenter: {
    alignItems: "center",
  },
  scoreValue: {
    color: "#F5F9F7",
    fontSize: moderateScale(FONT.h2),
    lineHeight: moderateScale(44),
  },
  scoreBase: {
    color: "#A6B4AF",
    fontSize: moderateScale(FONT.xxs),
    fontFamily: "Pretendard-Regular",
  },
  overallTitle: {
    color: "#F2F8F5",
    fontSize: moderateScale(FONT.xxl),
    textAlign: "center",
    marginBottom: moderateScale(4),
  },
  overallDescription: {
    color: "#95A59F",
    fontSize: moderateScale(FONT.xs),
    textAlign: "center",
    fontFamily: "Pretendard-Regular",
  },
  detailHeaderRow: {
    marginBottom: moderateScale(10),
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(2),
  },
  detailTitle: {
    color: "#EFF4F2",
    fontSize: moderateScale(FONT.lg),
  },
  detailMeta: {
    color: "#768783",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  scoreItemCard: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#1A302C",
    backgroundColor: "#071310",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginBottom: moderateScale(10),
  },
  scoreItemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  scoreItemLabel: {
    color: "#EAF1EE",
    fontSize: moderateScale(FONT.sm),
    fontFamily: "Pretendard-Regular",
  },
  scoreItemValue: {
    color: "#EAF1EE",
    fontSize: moderateScale(FONT.lg),
  },
  scoreItemFeedback: {
    color: "#A5B5B0",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(24),
    marginTop: moderateScale(8),
    fontFamily: "Pretendard-Regular",
  },
  scoreBarTrack: {
    height: moderateScale(10),
    borderRadius: moderateScale(8),
    backgroundColor: "#243633",
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: moderateScale(8),
    backgroundColor: "#11E1A0",
  },
  fixCard: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#5A4723",
    backgroundColor: "rgba(35,28,15,0.55)",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(4),
  },
  fixLabel: {
    color: "#F4BF45",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(8),
  },
  fixTitle: {
    color: "#FFCC5D",
    fontSize: moderateScale(FONT.md),
    lineHeight: moderateScale(26),
    marginBottom: moderateScale(8),
  },
  fixDescription: {
    color: "#C8B58D",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(26),
    fontFamily: "Pretendard-Regular",
  },
  commentSection: {
    marginTop: moderateScale(32),
    paddingBottom: moderateScale(40),
  },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(16),
  },
  commentTitle: {
    fontSize: moderateScale(22),
    color: "#F5F9F7",
  },
  commentCount: {
    fontSize: moderateScale(14),
    color: "#768783",
  },
  commentInputCard: {
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#12332B",
    backgroundColor: "rgba(6,22,18,0.6)",
    padding: moderateScale(14),
    marginBottom: moderateScale(24),
  },
  commentInputTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(12),
  },
  commentAvatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: "#164C42",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#DDE4E2",
    fontSize: moderateScale(14),
    fontFamily: "Pretendard-Bold",
  },
  commentInput: {
    flex: 1,
    color: "#EFF4F1",
    fontSize: moderateScale(14),
    fontFamily: "Pretendard-Regular",
    textAlignVertical: "top",
    minHeight: moderateScale(60),
    paddingTop: moderateScale(8),
  },
  commentInputBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(8),
  },
  charCounter: {
    color: "#556661",
    fontSize: moderateScale(12),
    fontFamily: "Pretendard-Regular",
  },
  commentSubmitButton: {
    backgroundColor: "#11E1A0",
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  commentSubmitButtonDisabled: {
    backgroundColor: "#1A3D34",
  },
  commentSubmitText: {
    color: "#03150F",
    fontSize: moderateScale(13),
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: moderateScale(20),
    gap: moderateScale(12),
  },
  commentItemLeft: {
    alignItems: "center",
  },
  commentAvatarSmall: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: "#0F322B",
  },
  avatarTextSmall: {
    color: "#A6B4AF",
    fontSize: moderateScale(12),
    fontFamily: "Pretendard-Bold",
  },
  commentItemRight: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#122521",
    paddingBottom: moderateScale(16),
  },
  commentItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  commentAuthor: {
    color: "#EFF4F1",
    fontSize: moderateScale(14),
  },
  commentTime: {
    color: "#556661",
    fontSize: moderateScale(12),
    fontFamily: "Pretendard-Regular",
  },
  commentText: {
    color: "#C8D4D0",
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    fontFamily: "Pretendard-Regular",
    marginBottom: moderateScale(10),
  },
  commentActions: {
    flexDirection: "row",
    gap: moderateScale(14),
  },
  commentActionBtn: {},
  commentActionText: {
    color: "#556661",
    fontSize: moderateScale(12),
    fontFamily: "Pretendard-Regular",
  },
  bottomButtonRow: {
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
  playbackButton: {
    flex: 1,
    minHeight: moderateScale(60),
    borderRadius: moderateScale(24),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: moderateScale(6),
    borderWidth: 1,
    backgroundColor: "#DDE1DA",
    borderColor: "#DDE1DA",
  },
  playbackButtonDisabled: {
    opacity: 0.45,
  },
  playbackButtonText: {
    color: "#1D241D",
    fontFamily: "Pretendard-Regular",
    fontSize: moderateScale(FONT.sm),
  },
  shareButton: {
    flex: 1,
    minHeight: moderateScale(60),
    borderRadius: moderateScale(24),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#1C6147",
    borderColor: "#1C6147",
  },
  shareButtonText: {
    color: "#ECF5F1",
    fontFamily: "Pretendard-Regular",
    fontSize: moderateScale(FONT.sm),
  },
  sharePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(16),
  },
  sharePreviewSheet: {
    width: "100%",
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#244039",
    backgroundColor: "#071612",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  sharePreviewTitle: {
    color: "#E8F3EF",
    fontSize: moderateScale(FONT.md),
    textAlign: "center",
    marginBottom: moderateScale(10),
  },
  sharePreviewImage: {
    width: "100%",
    aspectRatio: 4 / 7,
    borderRadius: 0,
    backgroundColor: "#12211E",
    marginBottom: moderateScale(12),
  },
  sharePreviewEmpty: {
    width: "100%",
    aspectRatio: 4 / 7,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#233A35",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(12),
  },
  sharePreviewEmptyText: {
    color: "#91A39D",
    fontSize: moderateScale(FONT.xxs),
    fontFamily: "Pretendard-Regular",
  },
  sharePreviewButtonRow: {
    flexDirection: "row",
    gap: moderateScale(8),
  },
  sharePreviewCloseButton: {
    flex: 1,
    minHeight: moderateScale(48),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#2A3F3A",
    backgroundColor: "#10221D",
    alignItems: "center",
    justifyContent: "center",
  },
  sharePreviewCloseButtonText: {
    color: "#D3E0DB",
    fontSize: moderateScale(FONT.sm),
  },
  sharePreviewDownloadButton: {
    flex: 1,
    minHeight: moderateScale(48),
    borderRadius: moderateScale(14),
    backgroundColor: "#11E1A0",
    alignItems: "center",
    justifyContent: "center",
  },
  sharePreviewDownloadButtonDisabled: {
    opacity: 0.6,
  },
  sharePreviewDownloadButtonText: {
    color: "#03150F",
    fontSize: moderateScale(FONT.sm),
  },
  shareCaptureHiddenWrap: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  shareCapturePoster: {
    width: 320,
    aspectRatio: 4 / 7,
    borderRadius: 0,
    overflow: "hidden",
  },
  shareCapturePosterGradient: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  shareCaptureDateText: {
    color: "#D7E4DF",
    fontSize: 12,
    textAlign: "right",
  },
  shareCaptureMainScore: {
    color: "#D8F36A",
    fontSize: 66,
    lineHeight: 74,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 14,
  },
  shareCaptureSwingImageWrap: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(3,12,10,0.65)",
    marginBottom: 12,
  },
  shareCaptureSwingImage: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  shareCaptureMetricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  shareCaptureMetricCard: {
    width: "48.5%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(5,16,13,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  shareCaptureMetricLabel: {
    color: "#A8BBB5",
    fontSize: 11,
    marginBottom: 2,
    fontFamily: "Pretendard-Regular",
  },
  shareCaptureMetricValue: {
    color: "#EFF6F3",
    fontSize: 24,
  },
});
