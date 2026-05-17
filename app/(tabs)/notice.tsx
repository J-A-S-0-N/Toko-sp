import { ThemedText } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { Notice, NoticeType, useNotices } from "@/hooks/useNotices";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

const BADGE_CONFIG = {
  pinned: { label: "중요 공지", color: "#3CC06E", bg: "#0D2B1A" },
  update: { label: "업데이트", color: "#38C792", bg: "#0D2B21" },
  maintenance: { label: "점검", color: "#D4A853", bg: "#2B200D" },
  event: { label: "이벤트", color: "#FF6B6B", bg: "#2B1A1A" },
};

// Helper function to get badge config with fallback for unknown types
const getBadgeConfig = (type: NoticeType) => {
  if (type && BADGE_CONFIG[type as keyof typeof BADGE_CONFIG]) {
    return BADGE_CONFIG[type as keyof typeof BADGE_CONFIG];
  }
  // Default fallback for unknown types
  return {
    label: type || "알림",
    color: "#9BA1A6",
    bg: "#2A2E30",
  };
};


/* ─── Giveaway Form ───────────────────────────────────────────────────────── */

interface GiveawayFormProps {
  noticeId: string;
}

function GiveawayForm({ noticeId }: GiveawayFormProps) {
  const { user, username } = useAuth();
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);

  // Check if user has already submitted
  React.useEffect(() => {
    const checkSubmission = async () => {
      if (!user?.uid) return;
      
      try {
        const q = query(
          collection(db, 'GiveawaySubmissions'),
          where('userUid', '==', user.uid),
          where('noticeId', '==', noticeId)
        );
        const snap = await getDocs(q);
        const maxCount = snap.empty ? 0 : Math.max(...snap.docs.map(d => d.data().submissionCount || 0));
        setSubmissionCount(maxCount);
        setHasSubmitted(maxCount > 0);
      } catch (error) {
        console.error('Error checking submission:', error);
      }
    };
    
    checkSubmission();
  }, [user?.uid, noticeId]);

  const doSubmit = async () => {
    if (!user?.uid || !userInput.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Get user details from Firestore
      let userPhone = '';
      try {
        const userDocRef = doc(db, 'Users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          userPhone = userDoc.data()?.phoneNumber || '';
        }
      } catch (error) {
        console.error('Error fetching user phone:', error);
      }

      const newCount = submissionCount + 1;
      setSubmissionCount(newCount);

      // Submit to Firebase
      await addDoc(collection(db, 'GiveawaySubmissions'), {
        noticeId,
        userUid: user.uid,
        userName: username || '',
        userPhone,
        userInput: userInput.trim(),
        submittedAt: serverTimestamp(),
        submissionCount: newCount,
      });

      setHasSubmitted(true);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting giveaway:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.uid || !userInput.trim()) return;

    // Show repeat confirmation if already submitted
    if (hasSubmitted) {
      setShowRepeatModal(true);
      return;
    }

    await doSubmit();
  };

  const handleRepeatSubmit = async () => {
    setShowRepeatModal(false);
    await doSubmit();
  };

  return (
    <>
      <View style={modalStyles.giveawayContainer}>
        <ThemedText style={modalStyles.giveawayTitle}>🎁 무료 증정 신청</ThemedText>
        <ThemedText style={modalStyles.giveawayDescription}>
          이름과 주소를 입력해주세요. 추첨을 통해 무료 상품을 보내드립니다!
        </ThemedText>
        
        <TextInput
          style={modalStyles.giveawayInput}
          placeholder="이름, 주소, 연락처 등 필요한 정보를 입력해주세요"
          placeholderTextColor="#6F7775"
          multiline
          numberOfLines={3}
          value={userInput}
          onChangeText={setUserInput}
          textAlignVertical="top"
        />
        
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || !userInput.trim()}
          style={[
            modalStyles.giveawaySubmitBtn,
            (isSubmitting || !userInput.trim()) && modalStyles.giveawaySubmitBtnDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#0F1010" />
          ) : (
            <ThemedText style={[
              modalStyles.giveawaySubmitBtnText,
              (isSubmitting || !userInput.trim()) && modalStyles.giveawaySubmitBtnTextDisabled
            ]}>
              {hasSubmitted ? '다시 신청하기' : '신청하기'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={modalStyles.successModalContainer}>
          <View style={modalStyles.successModalContent}>
            <ThemedText style={modalStyles.successTitle}>✅ 신청 완료!</ThemedText>
            <ThemedText style={modalStyles.successMessage}>
              추첨 결과는 별도로 연락드리겠습니다.
            </ThemedText>
            <TouchableOpacity
              onPress={() => setShowSuccessModal(false)}
              style={modalStyles.successBtn}
            >
              <ThemedText style={modalStyles.successBtnText}>확인</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Repeat Confirmation Modal */}
      <Modal visible={showRepeatModal} transparent animationType="fade">
        <View style={modalStyles.successModalContainer}>
          <View style={modalStyles.successModalContent}>
            <ThemedText style={modalStyles.successTitle}>⚠️ 다시 신청하시겠습니까?</ThemedText>
            <ThemedText style={modalStyles.successMessage}>
              이미 신청한 내역이 있습니다. 그래도 다시 신청하시겠어요?
            </ThemedText>
            <View style={modalStyles.repeatModalButtons}>
              <TouchableOpacity
                onPress={() => setShowRepeatModal(false)}
                style={[modalStyles.repeatBtn, modalStyles.repeatBtnCancel]}
              >
                <ThemedText style={modalStyles.repeatBtnText}>취소</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRepeatSubmit}
                style={[modalStyles.repeatBtn, modalStyles.repeatBtnConfirm]}
              >
                <ThemedText style={modalStyles.repeatBtnText}>다시 신청</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ─── Detail Modal ─────────────────────────────────────────────────────────── */

function NoticeDetailModal({
  notice,
  onClose,
}: {
  notice: Notice;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const badge = getBadgeConfig(notice.type);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={modalStyles.container}>
        <Animated.View
          entering={FadeIn.duration(280)}
          exiting={FadeOut.duration(220)}
          style={modalStyles.backdrop}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(320)}
          exiting={SlideOutDown.duration(220)}
          style={modalStyles.sheetWrapper}
        >
      <View style={[modalStyles.sheet, { paddingBottom: insets.bottom + moderateScale(16) }]}>
        {/* Drag handle */}
        <View style={modalStyles.dragHandle} />

        {/* Header row */}
        <View style={modalStyles.headerRow}>
          <View style={modalStyles.headerLeft}>
            <View style={[modalStyles.badgeInline, { backgroundColor: badge.bg }]}>
              <ThemedText style={[modalStyles.badgeText, { color: badge.color }]}>
                {badge.label}
              </ThemedText>
            </View>
            <ThemedText style={modalStyles.headerDate}>{notice.date}</ThemedText>
          </View>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={modalStyles.closeBtn}
          >
            <Feather name="x" size={moderateScale(15)} color="#9BA1A6" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={modalStyles.scrollContent}
        >
          {/* Title */}
          <ThemedText style={modalStyles.title}>{notice.title}</ThemedText>

          {/* Body paragraphs */}
          {Array.isArray(notice.body) && notice.body.map((para, i) => (
            <ThemedText key={i} style={modalStyles.bodyPara}>
              {para}
            </ThemedText>
          ))}

          {/* Highlight box */}
          {notice.highlight && (
            <View style={modalStyles.highlightBox}>
              <ThemedText style={modalStyles.highlightLabel}>
                {notice.highlight.label}
              </ThemedText>
              <ThemedText style={modalStyles.highlightContent}>
                {notice.highlight.content}
              </ThemedText>
            </View>
          )}

          {/* Giveaway Form */}
          {notice.hasGiveaway && <GiveawayForm noticeId={notice.id} />}
        </ScrollView>

        {/* CTA */}
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.85}
          style={modalStyles.ctaBtn}
        >
          <ThemedText style={modalStyles.ctaText}>확인했습니다</ThemedText>
        </TouchableOpacity>
      </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ─── Screen ────────────────────────────────────────────────────────────────── */

export default function NoticeScreen() {
  const [selected, setSelected] = useState<Notice | null>(null);
  const { notices, loading, error, pinnedNotice, recentNotices } = useNotices();
  const { showGiveaway } = useLocalSearchParams<{ showGiveaway?: string }>();

  // Auto-open giveaway notice when navigated from event banner
  useEffect(() => {
    if (showGiveaway === "true" && notices.length > 0) {
      // Find the notice with hasGiveaway or fallback to pinned notice
      const giveawayNotice = notices.find((n) => n.hasGiveaway) || pinnedNotice;
      if (giveawayNotice) {
        setSelected(giveawayNotice);
      }
    }
  }, [showGiveaway, notices, pinnedNotice]);

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3CC06E" />
          <ThemedText style={styles.loadingText}>공지사항을 불러오는 중...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>공지사항을 불러올 수 없습니다</ThemedText>
          <ThemedText style={styles.errorSubtext}>잠시 후 다시 시도해주세요</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!pinnedNotice && recentNotices.length === 0) {
    return (
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>공지사항이 없습니다</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View style={styles.pill}>
            <ThemedText style={styles.pillText}>공지사항</ThemedText>
          </View>
        </View>

        {/* 중요 공지 */}
        {pinnedNotice && (
          <View style={styles.sectionContainer}>
            <ThemedText type="barlowLight" style={styles.sectionLabel}>
              중요 공지
            </ThemedText>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setSelected(pinnedNotice)}>
            <LinearGradient
              colors={["#0D2B1A", "#111E15", "#0F1010"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredCard}
            >
              <View style={styles.featuredTopRow}>
                <View style={styles.badge}>
                  <ThemedText style={[styles.badgeText, { color: getBadgeConfig("pinned").color }]}>
                    고정됨
                  </ThemedText>
                </View>
                <ThemedText type="barlowLight" style={styles.featuredDate}>
                  {pinnedNotice.date}
                </ThemedText>
              </View>

              <ThemedText type="barlowHard" style={styles.featuredTitle}>
                {pinnedNotice.title}
              </ThemedText>
              <ThemedText type="barlowLight" style={styles.featuredDesc}>
                {pinnedNotice.description}
              </ThemedText>

              <View style={styles.featuredLink}>
                <ThemedText type="barlowLight" style={styles.featuredLinkText}>
                  자세히 보기
                </ThemedText>
                <Feather name="arrow-right" size={moderateScale(13)} color="#3CC06E" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          </View>
        )}

        {/* 최근 공지 */}
        {recentNotices.length > 0 && (
          <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="barlowLight" style={styles.sectionLabel}>
              최근 공지
            </ThemedText>
            <TouchableOpacity activeOpacity={0.7} style={styles.viewAllBtn}>
              <ThemedText type="barlowLight" style={styles.viewAllText}>
                전체 보기
              </ThemedText>
              <Feather name="arrow-right" size={moderateScale(12)} color="#3CC06E" />
            </TouchableOpacity>
          </View>

          <View style={styles.noticeList}>
            {recentNotices.map((notice, index) => {
              const badge = getBadgeConfig(notice.type);
              return (
                <TouchableOpacity
                  key={notice.id}
                  activeOpacity={0.75}
                  onPress={() => setSelected(notice)}
                  style={[
                    styles.noticeCard,
                    index === recentNotices.length - 1 && styles.noticeCardLast,
                  ]}
                >
                  <View style={styles.noticeCardInner}>
                    <View style={styles.noticeTopRow}>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <ThemedText style={[styles.badgeText, { color: badge.color }]}>
                          {badge.label}
                        </ThemedText>
                      </View>
                      <ThemedText type="barlowLight" style={styles.noticeDate}>
                        {notice.date}
                      </ThemedText>
                    </View>
                    <ThemedText type="barlowLight" style={styles.noticeTitle} numberOfLines={1}>
                      {notice.title}
                    </ThemedText>
                    <ThemedText type="barlowLight" style={styles.noticeDesc} numberOfLines={2}>
                      {notice.description}
                    </ThemedText>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={moderateScale(16)}
                    color="#4A5055"
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          </View>
        )}
      </ScrollView>

      {selected && (
        <NoticeDetailModal notice={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}

/* ─── Styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  scrollContent: {
    paddingBottom: moderateScale(40),
  },
  pageHeader: {
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(4),
    paddingBottom: moderateScale(6),
  },
  pill: {
    borderWidth: moderateScale(0.5),
    borderColor: "#353838",
    backgroundColor: "#1F2222",
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(20),
    alignSelf: "flex-start",
  },
  pillText: {
    color: "white",
    fontSize: moderateScale(FONT.xs),
  },
  sectionContainer: {
    paddingHorizontal: moderateScale(14),
    marginTop: moderateScale(16),
  },
  sectionLabel: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(10),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(3),
  },
  viewAllText: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.sm),
  },
  featuredCard: {
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#1E3D28",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    overflow: "hidden",
  },
  featuredTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  featuredDate: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.xs),
  },
  featuredTitle: {
    color: "#EEF2EF",
    fontSize: moderateScale(FONT.md),
    marginBottom: moderateScale(6),
  },
  featuredDesc: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(14),
  },
  featuredLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    alignSelf: "flex-start",
  },
  featuredLinkText: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.sm),
  },
  badge: {
    backgroundColor: "#0D2B1A",
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: moderateScale(FONT.xxs),
    fontWeight: "600",
  },
  noticeList: {
    backgroundColor: "#1A1F22",
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#2A2E30",
    overflow: "hidden",
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#2A2E30",
  },
  noticeCardLast: {
    borderBottomWidth: 0,
  },
  noticeCardInner: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  noticeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(6),
  },
  noticeDate: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.xxs),
  },
  noticeTitle: {
    color: "#EEF2EF",
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(3),
    fontWeight: "500",
  },
  noticeDesc: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.xs),
    lineHeight: moderateScale(17),
  },
  chevron: {
    flexShrink: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: moderateScale(16),
  },
  loadingText: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: moderateScale(8),
  },
  errorText: {
    color: "#EEF2EF",
    fontSize: moderateScale(FONT.md),
    fontFamily: "Pretendard-Bold",
  },
  errorSubtext: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.md),
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheetWrapper: {
    maxHeight: "82%",
    overflow: "hidden",
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
  },
  sheet: {
    backgroundColor: "#181B1B",
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(12),
  },
  dragHandle: {
    width: moderateScale(36),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: "#3A3F3F",
    alignSelf: "center",
    marginBottom: moderateScale(16),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  badgeInline: {
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
  },
  badgeText: {
    fontSize: moderateScale(FONT.xxs),
    fontWeight: "600",
  },
  headerDate: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.xs),
  },
  closeBtn: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "#2A2E30",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: moderateScale(20),
  },
  title: {
    color: "#EEF2EF",
    fontSize: moderateScale(FONT.xl),
    fontFamily: "Pretendard-Bold",
    lineHeight: moderateScale(30),
    marginBottom: moderateScale(16),
  },
  bodyPara: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(21),
    marginBottom: moderateScale(12),
    fontFamily: "Pretendard-Regular",
  },
  highlightBox: {
    backgroundColor: "#0F2119",
    borderWidth: 1,
    borderColor: "#1A3D28",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(4),
    marginBottom: moderateScale(12),
  },
  highlightLabel: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.sm),
    fontFamily: "Pretendard-Bold",
    marginBottom: moderateScale(6),
  },
  highlightContent: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(20),
    fontFamily: "Pretendard-Regular",
  },
  ctaBtn: {
    backgroundColor: "#3CC06E",
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(15),
    alignItems: "center",
    marginTop: moderateScale(8),
  },
  ctaText: {
    color: "#0F1010",
    fontSize: moderateScale(FONT.md),
    fontFamily: "Pretendard-Bold",
    fontWeight: "700",
  },
  giveawayContainer: {
    backgroundColor: "#0F2119",
    borderWidth: 1,
    borderColor: "#1A3D28",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  giveawayTitle: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.md),
    fontFamily: "Pretendard-Bold",
    marginBottom: moderateScale(8),
  },
  giveawayDescription: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  giveawayInput: {
    backgroundColor: "#1A1F22",
    borderWidth: 1,
    borderColor: "#2A2E30",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    color: "#EEF2EF",
    fontSize: moderateScale(FONT.sm),
    minHeight: moderateScale(80),
    marginBottom: moderateScale(12),
  },
  giveawaySubmitBtn: {
    backgroundColor: "#3CC06E",
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(12),
    alignItems: "center",
  },
  giveawaySubmitBtnDisabled: {
    backgroundColor: "#2A2E30",
  },
  giveawaySubmitBtnText: {
    color: "#0F1010",
    fontSize: moderateScale(FONT.sm),
    fontFamily: "Pretendard-Bold",
    fontWeight: "600",
  },
  giveawaySubmitBtnTextDisabled: {
    color: "#FFFFFF",
  },
  successModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
  },
  successModalContent: {
    backgroundColor: "#181B1B",
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    alignItems: "center",
    maxWidth: moderateScale(300),
  },
  successTitle: {
    color: "#EEF2EF",
    fontSize: moderateScale(FONT.lg),
    fontFamily: "Pretendard-Bold",
    marginBottom: moderateScale(12),
    textAlign: "center",
  },
  successMessage: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
    textAlign: "center",
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  successBtn: {
    backgroundColor: "#3CC06E",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(10),
  },
  successBtnText: {
    color: "#0F1010",
    fontSize: moderateScale(FONT.sm),
    fontFamily: "Pretendard-Bold",
    fontWeight: "600",
  },
  repeatModalButtons: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  repeatBtn: {
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    minWidth: moderateScale(80),
    alignItems: "center",
  },
  repeatBtnCancel: {
    backgroundColor: "#2A2E30",
  },
  repeatBtnConfirm: {
    backgroundColor: "#3CC06E",
  },
  repeatBtnText: {
    fontSize: moderateScale(FONT.sm),
    fontFamily: "Pretendard-Bold",
    fontWeight: "600",
  },
});
