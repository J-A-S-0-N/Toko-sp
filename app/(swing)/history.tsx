import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import {
    collection,
    onSnapshot,
    query,
    where,
    type QueryDocumentSnapshot,
    type Timestamp
} from "firebase/firestore";
import React from "react";
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

type SwingHistoryItem = {
  id: string;
  createdAt: Timestamp | null;
  analysisCompletedAt: Timestamp | null;
  overallScore: number | null;
  addressAngleScore: number | null;
  headUpScore: number | null;
  backswingAngleScore: number | null;
  takebackScore: number | null;
  status: string;
  summary: string;
  screenshots: { url?: string }[];
};

function toScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function toTimestamp(value: unknown) {
  if (!value || typeof value !== "object") return null;
  if ("toMillis" in value && typeof value.toMillis === "function") {
    return value as Timestamp;
  }
  return null;
}

function toHistoryItem(snapshot: QueryDocumentSnapshot): SwingHistoryItem {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    createdAt: toTimestamp(data?.createdAt),
    analysisCompletedAt: toTimestamp(data?.analysisCompletedAt),
    overallScore: toScore(data?.overallScore),
    addressAngleScore: toScore(data?.addressAngleScore),
    headUpScore: toScore(data?.headUpScore),
    backswingAngleScore: toScore(data?.backswingAngleScore),
    takebackScore: toScore(data?.takebackScore),
    status: typeof data?.status === "string" ? data.status : "uploaded",
    summary: typeof data?.summary === "string" ? data.summary : "",
    screenshots: Array.isArray(data?.screenshots) ? data.screenshots : [],
  };
}

function getPreferredMillis(item: SwingHistoryItem) {
  return item.analysisCompletedAt?.toMillis() ?? item.createdAt?.toMillis() ?? 0;
}

function formatHistoryDate(item: SwingHistoryItem) {
  const millis = getPreferredMillis(item);
  if (!millis) return "날짜 정보 없음";
  return new Date(millis).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getHistoryStatusLabel(item: SwingHistoryItem) {
  if (item.status === "done") return "분석 완료";
  if (item.status === "error") return "분석 실패";
  if (item.status === "analyzing") return "분석 중";
  return "분석 대기";
}

function getHistorySubline(item: SwingHistoryItem) {
  const scorePieces = [
    ["어드레스", item.addressAngleScore],
    ["헤드업", item.headUpScore],
    ["백스윙", item.backswingAngleScore],
    ["테이크백", item.takebackScore],
  ]
    .filter(([, score]) => typeof score === "number")
    .map(([label, score]) => `${label} ${score}`);

  if (scorePieces.length > 0) {
    return scorePieces.slice(0, 3).join(" · ");
  }

  return item.status === "done" ? "세부 점수 준비 중" : "분석 진행 상태를 확인해주세요";
}

function getHistoryTitle(item: SwingHistoryItem) {
  return item.status === "done" ? "파크골프 스윙 분석" : "스윙 분석 요청";
}

export default function SwingHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = React.useState<SwingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState<SwingHistoryItem | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user?.uid) {
      setHistoryItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const historyQuery = query(
      collection(db, "SwingVideos"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((docSnapshot) => toHistoryItem(docSnapshot))
          .sort((a, b) => getPreferredMillis(b) - getPreferredMillis(a));
        setHistoryItems(items);
        setIsLoading(false);
      },
      () => {
        setHistoryItems([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={moderateScale(20)} color="#DDE4E2" />
          </Pressable>

          <Text type="barlowHard" style={styles.headerTitle}>
            스윙 기록 전체 보기
          </Text>

          <View style={styles.headerRightSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isLoading ? (
            <Text type="barlowLight" style={styles.infoText}>
              기록을 불러오는 중입니다.
            </Text>
          ) : !user?.uid ? (
            <Text type="barlowLight" style={styles.infoText}>
              로그인 후 이전 스윙 분석 기록을 확인할 수 있어요.
            </Text>
          ) : historyItems.length === 0 ? (
            <Text type="barlowLight" style={styles.infoText}>
              아직 분석 기록이 없습니다.
            </Text>
          ) : (
            historyItems.map((item) => {
              const thumbnailUrl = item.screenshots[0]?.url;
              return (
                <Pressable key={item.id} style={styles.row} onPress={() => setSelectedItem(item)}>
                  <View style={styles.thumbWrap}>
                    {thumbnailUrl ? (
                      <Image source={{ uri: thumbnailUrl }} style={styles.thumbImage} />
                    ) : (
                      <View style={styles.thumbPlaceholder}>
                        <Feather name="play" size={moderateScale(14)} color="#DAE3DF" />
                      </View>
                    )}
                  </View>

                  <View style={styles.body}>
                    <Text type="barlowHard" style={styles.dateText}>
                      {formatHistoryDate(item)}
                    </Text>
                    <Text type="barlowLight" style={styles.titleText}>
                      {getHistoryTitle(item)}
                    </Text>
                    <Text type="barlowLight" style={styles.sublineText}>
                      {getHistorySubline(item)}
                    </Text>
                  </View>

                  <View style={styles.scoreWrap}>
                    <Text type="barlowHard" style={styles.scoreValueText}>
                      {typeof item.overallScore === "number" ? item.overallScore : "--"}
                    </Text>
                    <Text type="barlowLight" style={styles.statusText}>
                      {getHistoryStatusLabel(item)}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>

      <Modal
        visible={!!selectedItem}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedItem(null);
          setSelectedImageUrl(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setSelectedItem(null);
              setSelectedImageUrl(null);
            }}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {selectedItem && (
              <>
                <View style={styles.modalHeaderRow}>
                  <Text type="barlowHard" style={styles.modalTitle}>
                    스윙 기록 미리보기
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSelectedItem(null);
                      setSelectedImageUrl(null);
                    }}
                  >
                    <Feather name="x" size={moderateScale(20)} color="#DCE5E1" />
                  </Pressable>
                </View>

                <Text type="barlowLight" style={styles.modalDateText}>
                  {formatHistoryDate(selectedItem)} · {getHistoryStatusLabel(selectedItem)}
                </Text>

                {selectedItem.screenshots.length > 0 ? (
                  <ScrollView
                    horizontal
                    style={styles.modalPhotoScroll}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modalPhotoStrip}
                  >
                    {selectedItem.screenshots.map((shot, idx) => (
                      <Pressable
                        key={`${selectedItem.id}-${idx}`}
                        style={styles.modalPhotoItem}
                        onPress={() => {
                          if (!shot?.url) return;
                          setSelectedImageUrl(shot.url);
                        }}
                      >
                        {shot?.url ? (
                          <Image source={{ uri: shot.url }} style={styles.modalPhotoImage} />
                        ) : (
                          <View style={styles.modalPhotoPlaceholder}>
                            <Feather name="image" size={moderateScale(14)} color="#C6D3CF" />
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.modalPhotoEmpty}>
                    <Text type="barlowLight" style={styles.modalPhotoEmptyText}>
                      표시할 프레임 이미지가 없습니다.
                    </Text>
                  </View>
                )}

                <View style={styles.modalScoreCard}>
                  <View style={styles.modalOverallRow}>
                    <Text type="barlowLight" style={styles.modalOverallLabel}>
                      OVERALL
                    </Text>
                    <Text type="barlowHard" style={styles.modalOverallValue}>
                      {typeof selectedItem.overallScore === "number" ? selectedItem.overallScore : "--"}
                    </Text>
                  </View>

                  <Text type="barlowLight" style={styles.modalSummaryText}>
                    {selectedItem.summary || "요약 피드백이 아직 준비되지 않았습니다."}
                  </Text>

                  <View style={styles.modalGrid}>
                    {[
                      ["어드레스 각도", selectedItem.addressAngleScore],
                      ["헤드업", selectedItem.headUpScore],
                      ["백스윙 각도", selectedItem.backswingAngleScore],
                      ["테이크백", selectedItem.takebackScore],
                    ].map(([label, score]) => (
                      <View key={label} style={styles.modalGridItem}>
                        <Text type="barlowLight" style={styles.modalGridLabel}>
                          {label}
                        </Text>
                        <Text type="barlowHard" style={styles.modalGridValue}>
                          {typeof score === "number" ? score : "--"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Pressable
                  style={styles.modalResultButton}
                  onPress={() => {
                    const targetId = selectedItem.id;
                    setSelectedItem(null);
                    router.push({
                      pathname: "./result",
                      params: { swingVideoId: targetId },
                    });
                  }}
                >
                  <Text type="barlowHard" style={styles.modalResultButtonText}>
                    전체 결과 보기
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImageUrl(null)}
      >
        <View style={styles.imageViewerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedImageUrl(null)} />
          <Pressable style={styles.imageViewerCloseButton} onPress={() => setSelectedImageUrl(null)}>
            <Feather name="x" size={moderateScale(24)} color="#EAF2EF" />
          </Pressable>

          {selectedImageUrl ? (
            <Image
              source={{ uri: selectedImageUrl }}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
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
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
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
    fontSize: moderateScale(FONT.md),
    color: "#EFF4F1",
  },
  headerRightSpacer: {
    width: moderateScale(48),
    height: moderateScale(48),
  },
  scrollContent: {
    paddingBottom: moderateScale(18),
  },
  infoText: {
    color: "#97A5A1",
    fontSize: moderateScale(FONT.xxs),
    fontFamily: "Pretendard-Regular",
    paddingVertical: moderateScale(14),
  },
  row: {
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#1C312D",
    backgroundColor: "#0A1714",
    padding: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  thumbWrap: {
    width: moderateScale(62),
    height: moderateScale(62),
    borderRadius: moderateScale(12),
    overflow: "hidden",
    backgroundColor: "#1D2C29",
    marginRight: moderateScale(10),
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  dateText: {
    color: "#DDE8E4",
    fontSize: moderateScale(FONT.xxxs),
  },
  titleText: {
    color: "#EFF5F2",
    fontSize: moderateScale(FONT.xs),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(2),
    fontFamily: "Pretendard-Regular",
  },
  sublineText: {
    color: "#8EA09A",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  scoreWrap: {
    marginLeft: moderateScale(10),
    alignItems: "flex-end",
  },
  scoreValueText: {
    color: "#11E2A0",
    fontSize: moderateScale(FONT.lg),
  },
  statusText: {
    color: "#92A29D",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
    marginTop: moderateScale(2),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheet: {
    height: "90%",
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#213934",
    backgroundColor: "#04100D",
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(16),
  },
  modalHandle: {
    alignSelf: "center",
    width: moderateScale(40),
    height: moderateScale(5),
    borderRadius: moderateScale(999),
    backgroundColor: "#47605A",
    marginBottom: moderateScale(14),
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(4),
  },
  modalTitle: {
    color: "#EFF5F2",
    fontSize: moderateScale(FONT.lg),
  },
  modalDateText: {
    color: "#91A39D",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(12),
    fontFamily: "Pretendard-Regular",
  },
  modalPhotoStrip: {
    gap: moderateScale(8),
    paddingBottom: 0,
  },
  modalPhotoScroll: {
    flexGrow: 0,
    height: moderateScale(192),
  },
  modalPhotoItem: {
    width: moderateScale(136),
    height: moderateScale(192),
    borderRadius: moderateScale(16),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#20403A",
    backgroundColor: "#102522",
  },
  modalPhotoImage: {
    width: "100%",
    height: "100%",
  },
  modalPhotoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPhotoEmpty: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#1A332E",
    backgroundColor: "#0A1A17",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    marginBottom: moderateScale(12),
  },
  modalPhotoEmptyText: {
    color: "#8EA09A",
    fontSize: moderateScale(FONT.xxxs),
    fontFamily: "Pretendard-Regular",
  },
  modalScoreCard: {
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#1B332F",
    backgroundColor: "#071512",
    padding: moderateScale(12),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(14),
  },
  modalOverallRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },
  modalOverallLabel: {
    color: "#AFC2BC",
    fontSize: moderateScale(FONT.xxxs),
    letterSpacing: moderateScale(1.4),
  },
  modalOverallValue: {
    color: "#11E2A0",
    fontSize: moderateScale(FONT.xxl),
  },
  modalSummaryText: {
    color: "#A1B2AE",
    fontSize: moderateScale(FONT.xxs),
    fontFamily: "Pretendard-Regular",
    marginBottom: moderateScale(12),
    lineHeight: moderateScale(18),
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  modalGridItem: {
    width: "48%",
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#1E3632",
    backgroundColor: "#0C1C18",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
  },
  modalGridLabel: {
    color: "#96AAA3",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(2),
    fontFamily: "Pretendard-Regular",
  },
  modalGridValue: {
    color: "#EAF3EF",
    fontSize: moderateScale(FONT.md),
  },
  modalResultButton: {
    minHeight: moderateScale(52),
    borderRadius: moderateScale(16),
    backgroundColor: "#11E2A0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  modalResultButtonText: {
    color: "#031B14",
    fontSize: moderateScale(FONT.md),
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(24),
  },
  imageViewerCloseButton: {
    position: "absolute",
    top: moderateScale(52),
    right: moderateScale(18),
    zIndex: 3,
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#2A3A36",
    backgroundColor: "rgba(6,19,16,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerImage: {
    width: "100%",
    height: "100%",
    maxWidth: moderateScale(420),
    maxHeight: "92%",
  },
});
