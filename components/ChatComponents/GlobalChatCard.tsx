import { ThemedText } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import {
    ChatMessage,
    getKoreanRelativeTime,
    subscribeToChatPreviews,
} from "@/services/chatService";
import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { moderateScale } from "react-native-size-matters";

/* ─── Pulsing Dot ──────────────────────────────────────────────────────────── */

function PulsingDot() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
    transform: [{ scale: 0.85 + progress.value * 0.3 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 - progress.value * 0.5,
    transform: [{ scale: 1 + progress.value * 1.6 }],
  }));

  return (
    <View style={styles.liveDotWrapper}>
      <Animated.View style={[styles.liveDotRing, ringStyle]} />
      <Animated.View style={[styles.liveDot, dotStyle]} />
    </View>
  );
}

/* ─── Global Chat Card ─────────────────────────────────────────────────────── */

const FALLBACK_MESSAGES = [
  { id: "fallback-1", username: "김OO", text: "오늘 A코스 사람 많나요?", createdAtMs: 0 },
  {
    id: "fallback-2",
    username: "박OO",
    text: "스코어 공유했습니다. 오늘 기록 괜찮네요.",
    createdAtMs: 0,
  },
  {
    id: "fallback-3",
    username: "이OO",
    text: "이번 주말 라운딩 같이 가실 분 계신가요?",
    createdAtMs: 0,
  },
];

interface GlobalChatCardProps {
  onEnter?: () => void;
}

export default function GlobalChatCard({ onEnter }: GlobalChatCardProps) {
  const [previewMessages, setPreviewMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToChatPreviews((messages) => {
      setPreviewMessages(messages);
    });

    return unsubscribe;
  }, []);

  const displayMessages = useMemo(() => {
    if (!previewMessages.length) {
      return FALLBACK_MESSAGES;
    }

    return [...previewMessages].sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [previewMessages]);

  const lastMessageTimeLabel = useMemo(() => {
    if (!previewMessages.length) {
      return "새 메시지 없음";
    }

    return getKoreanRelativeTime(previewMessages[0]?.createdAtMs);
  }, [previewMessages]);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.chatHeaderRow}>
        <ThemedText type="barlowLight" style={styles.sectionLabel}>
          전체 채팅
        </ThemedText>
        <View style={styles.liveIndicator}>
          <PulsingDot />
          <ThemedText type="barlowLight" style={styles.liveText}>
            실시간 대화 중
          </ThemedText>
        </View>
      </View>

      <View style={styles.chatCard}>
        {/* Top row */}
        <View style={styles.chatTopRow}>
          <View style={styles.chatIconCircle}>
            <Feather name="message-circle" size={moderateScale(22)} color="#3CC06E" />
          </View>
          <View style={styles.chatTopInfo}>
            <View style={styles.chatTitleRow}>
              <ThemedText style={styles.chatTitle}>파크골프 전체 채팅방</ThemedText>
              <View style={styles.unreadBadge}>
                <ThemedText style={styles.unreadBadgeText}>{displayMessages.length}</ThemedText>
              </View>
            </View>
            <ThemedText type="barlowLight" style={styles.chatSubtitle}>
              새 메시지 {lastMessageTimeLabel}
            </ThemedText>
          </View>
        </View>

        {/* Message previews */}
        <View style={styles.chatPreviewList}>
          {displayMessages.map((msg) => (
            <View key={msg.id} style={styles.chatPreviewRow}>
              <ThemedText type="barlowLight" style={styles.chatPreviewName}>
                {msg.username}
              </ThemedText>
              <ThemedText
                type="barlowLight"
                style={styles.chatPreviewText}
                numberOfLines={1}
              >
                {msg.text}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Enter button */}
        <TouchableOpacity activeOpacity={0.85} style={styles.chatEnterBtn} onPress={onEnter}>
          <ThemedText style={styles.chatEnterBtnText}>채팅방 입장하기</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: moderateScale(14),
    marginTop: moderateScale(16),
  },
  sectionLabel: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(10),
  },
  chatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    marginBottom: moderateScale(10),
  },
  liveDotWrapper: {
    width: moderateScale(8),
    height: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  liveDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#3CC06E",
  },
  liveDotRing: {
    position: "absolute",
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#3CC06E",
  },
  liveText: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.xs),
  },
  chatCard: {
    backgroundColor: "#1A1F22",
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#2A2E30",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
  },
  chatTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  chatIconCircle: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: "#0D2B1A",
    alignItems: "center",
    justifyContent: "center",
  },
  chatTopInfo: {
    flex: 1,
  },
  chatTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(3),
  },
  chatTitle: {
    color: "#EEF2EF",
    fontSize: moderateScale(FONT.md),
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: "#3CC06E",
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(1),
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: "#0F1010",
    fontSize: moderateScale(FONT.xxs),
    fontWeight: "700",
  },
  chatSubtitle: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.xs),
  },
  chatPreviewList: {
    marginTop: moderateScale(16),
    gap: moderateScale(8),
  },
  chatPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  chatPreviewName: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.xs),
    fontWeight: "600",
  },
  chatPreviewText: {
    color: "#8A9094",
    fontSize: moderateScale(FONT.xs),
    flex: 1,
  },
  chatEnterBtn: {
    backgroundColor: "#3CC06E",
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    alignItems: "center",
    marginTop: moderateScale(16),
  },
  chatEnterBtnText: {
    color: "#0F1010",
    fontSize: moderateScale(FONT.sm),
    fontWeight: "700",
  },
});
