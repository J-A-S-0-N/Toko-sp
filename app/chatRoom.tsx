import { ThemedText } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import {
    ChatMessage,
    getAdminUsernameSet,
    getKoreanClockLabel,
    getOlderChatMessages,
    MAX_CHAT_MESSAGE_LENGTH,
    sendChatMessage,
    subscribeToRecentChatMessages,
} from "@/services/chatService";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

/* ─── Types ────────────────────────────────────────────────────────────────── */

type ChatItem =
  | { kind: "date"; id: string; label: string }
  | { kind: "system"; id: string; text: string }
  | { kind: "divider"; id: string; label: string }
  | {
    kind: "message";
    id: string;
    mine: boolean;
    name?: string;
    isAdmin?: boolean;
    initial?: string;
    text: string;
    time: string;
    status?: string;
  };

const OLDER_PAGE_SIZE = 30;

const mergeMessages = (current: ChatMessage[], incoming: ChatMessage[]) => {
  const byId = new Map<string, ChatMessage>();

  for (const item of current) {
    byId.set(item.id, item);
  }

  for (const item of incoming) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values()).sort((a, b) => a.createdAtMs - b.createdAtMs);
};

/* ─── Row renderers ────────────────────────────────────────────────────────── */

function DateChip({ label }: { label: string }) {
  return (
    <View style={styles.dateChipWrapper}>
      <View style={styles.dateChip}>
        <ThemedText style={styles.dateChipText}>{label}</ThemedText>
      </View>
    </View>
  );
}

function SystemBubble({ text }: { text: string }) {
  return (
    <View style={styles.systemWrapper}>
      <View style={styles.systemBubble}>
        <ThemedText style={styles.systemText}>{text}</ThemedText>
      </View>
    </View>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <View style={styles.dividerWrapper}>
      <View style={styles.dividerLine} />
      <ThemedText style={styles.dividerText}>{label}</ThemedText>
      <View style={styles.dividerLine} />
    </View>
  );
}

function MessageRow({ item }: { item: Extract<ChatItem, { kind: "message" }> }) {
  if (item.mine) {
    return (
      <View style={styles.myRow}>
        {item.status && <ThemedText style={styles.myStatus}>{item.status}</ThemedText>}
        <ThemedText style={styles.myTime}>{item.time}</ThemedText>
        <View style={styles.myBubble}>
          <ThemedText style={styles.myText}>{item.text}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.otherRow}>
      <View style={styles.avatar}>
        <ThemedText style={styles.avatarText}>{item.initial}</ThemedText>
      </View>
      <View style={styles.otherContent}>
        <View style={styles.otherNameRow}>
          <ThemedText style={styles.otherName}>{item.name}</ThemedText>
          {item.isAdmin && <ThemedText style={styles.adminBadge}>관계자</ThemedText>}
        </View>
        <View style={styles.otherBubbleRow}>
          <View style={styles.otherBubble}>
            <ThemedText style={styles.otherText}>{item.text}</ThemedText>
          </View>
          <ThemedText style={styles.otherTime}>{item.time}</ThemedText>
        </View>
      </View>
    </View>
  );
}

/* ─── Screen ───────────────────────────────────────────────────────────────── */

export default function ChatRoomScreen() {
  const router = useRouter();
  const { user, username } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingMessageIds, setPendingMessageIds] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const [adminUsernames, setAdminUsernames] = useState<Set<string>>(new Set());
  const listRef = useRef<FlatList<ChatItem>>(null);

  const scrollToBottom = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const handleDraftChange = useCallback((value: string) => {
    setDraft(value.slice(0, MAX_CHAT_MESSAGE_LENGTH));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToRecentChatMessages((nextMessages) => {
      setMessages((prev) => mergeMessages(prev, nextMessages));
      setIsInitialLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAdminUsernames = async () => {
      try {
        const usernames = await getAdminUsernameSet();
        if (isMounted) {
          setAdminUsernames(usernames);
        }
      } catch (error) {
        console.error("Failed to load admin usernames:", error);
      }
    };

    loadAdminUsernames();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      scrollToBottom(false);
    });

    return () => {
      showSub.remove();
    };
  }, [scrollToBottom]);

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingOlder || !hasOlderMessages || !messages.length) {
      return;
    }

    const oldest = messages[0];
    if (!oldest?.createdAtMs) {
      setHasOlderMessages(false);
      return;
    }

    setIsLoadingOlder(true);
    try {
      const older = await getOlderChatMessages(oldest.createdAtMs, OLDER_PAGE_SIZE);
      if (!older.length || older.length < OLDER_PAGE_SIZE) {
        setHasOlderMessages(false);
      }
      if (older.length) {
        setMessages((prev) => mergeMessages(prev, older));
      }
    } catch (error) {
      console.error("Failed to load older chat messages:", error);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [hasOlderMessages, isLoadingOlder, messages]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (event.nativeEvent.contentOffset.y <= 120) {
        loadOlderMessages();
      }
    },
    [loadOlderMessages]
  );

  const chatItems = useMemo<ChatItem[]>(() => {
    const pendingSet = new Set(pendingMessageIds);
    const mappedMessages: ChatItem[] = messages.map((message) => {
      const mine = message.userId === user?.uid;
      return {
        kind: "message",
        id: message.id,
        mine,
        name: mine ? undefined : message.username,
        isAdmin: mine ? false : adminUsernames.has(message.username),
        initial: mine ? undefined : message.userInitial,
        text: message.text,
        time: getKoreanClockLabel(message.createdAtMs),
        status: mine && pendingSet.has(message.id) ? "전송중" : undefined,
      };
    });

    if (!mappedMessages.length && !isInitialLoading) {
      return [
        {
          kind: "system",
          id: "sys-empty",
          text: "아직 메시지가 없습니다. 첫 메시지를 남겨보세요.",
        },
      ];
    }

    return [
      {
        kind: "system",
        id: "sys-notice",
        text: "파크골프 이야기를 자유롭게 나눠보세요. 서로 존중하는 대화를 부탁드립니다.",
      },
      ...mappedMessages,
    ];
  }, [adminUsernames, isInitialLoading, messages, pendingMessageIds, user?.uid]);

  const handleSend = async () => {
    if (!user?.uid) {
      return;
    }

    const text = draft.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
    if (!text) return;

    const nowMs = Date.now();
    const messageId = `${user.uid}-${nowMs}-${Math.random().toString(36).slice(2, 7)}`;
    const displayName = username?.trim() || "익명";
    const userInitial = displayName.slice(0, 1) || "익";

    const optimisticMessage: ChatMessage = {
      id: messageId,
      userId: user.uid,
      username: displayName,
      userInitial,
      text,
      createdAtMs: nowMs,
    };

    setMessages((prev) => mergeMessages(prev, [optimisticMessage]));
    setPendingMessageIds((prev) => [...prev, messageId]);
    setDraft("");

    setTimeout(() => {
      scrollToBottom(true);
    }, 50);

    try {
      await sendChatMessage({
        id: messageId,
        userId: user.uid,
        username: displayName,
        userInitial,
        text,
      });
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
      console.error("Failed to send chat message:", error);
    } finally {
      setPendingMessageIds((prev) => prev.filter((id) => id !== messageId));
    }
  };

  const renderItem = ({ item }: { item: ChatItem }) => {
    switch (item.kind) {
      case "date":
        return <DateChip label={item.label} />;
      case "system":
        return <SystemBubble text={item.text} />;
      case "divider":
        return <Divider label={item.label} />;
      case "message":
        return <MessageRow item={item} />;
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={moderateScale(22)} color="#EEF2EF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>파크골프 전체 채팅방</ThemedText>
          <View style={styles.headerSubRow}>
            <ThemedText style={styles.headerSub}>실시간 대화</ThemedText>
          </View>
        </View>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
          <Feather name="more-horizontal" size={moderateScale(20)} color="#9BA1A6" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {isInitialLoading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color="#3CC06E" size="small" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={chatItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              scrollToBottom(false);
            }}
            onLayout={() => {
              scrollToBottom(false);
            }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              isLoadingOlder ? (
                <View style={styles.loadingOlderWrapper}>
                  <ActivityIndicator color="#6F7775" size="small" />
                </View>
              ) : null
            }
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: moderateScale(8) + insets.bottom }]}>
          <TouchableOpacity style={styles.plusBtn} activeOpacity={0.7}>
            <Feather name="plus" size={moderateScale(20)} color="#9BA1A6" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#6F7775"
            value={draft}
            onChangeText={handleDraftChange}
            multiline
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            onSubmitEditing={handleSend}
            onFocus={() => {
              scrollToBottom(false);
            }}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={!draft.trim()}
          >
            <Feather name="arrow-up" size={moderateScale(20)} color="#0F1010" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    gap: moderateScale(8),
  },
  headerBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1F22",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: "#EEF2EF",
    fontSize: moderateScale(FONT.md),
    fontWeight: "700",
    marginBottom: moderateScale(2),
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  headerSub: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.xxxs),
  },
  headerDot: {
    width: moderateScale(2.5),
    height: moderateScale(2.5),
    borderRadius: moderateScale(1.5),
    backgroundColor: "#4A5055",
  },
  onlineDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: "#3CC06E",
  },
  headerOnline: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.xxs),
  },
  listContent: {
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(16),
  },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOlderWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(10),
  },
  dateChipWrapper: {
    alignItems: "center",
    marginVertical: moderateScale(10),
  },
  dateChip: {
    backgroundColor: "#1F2422",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(14),
  },
  dateChipText: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.xxs),
  },
  systemWrapper: {
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  systemBubble: {
    backgroundColor: "#1A1F22",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(12),
    maxWidth: "85%",
  },
  systemText: {
    color: "#8A9094",
    fontSize: moderateScale(FONT.xs),
    textAlign: "center",
    lineHeight: moderateScale(19),
  },
  dividerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginVertical: moderateScale(12),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2A2E30",
  },
  dividerText: {
    color: "#6F7775",
    fontSize: moderateScale(FONT.xxs),
  },
  otherRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(8),
    marginBottom: moderateScale(14),
    maxWidth: "85%",
  },
  avatar: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#2A2E30",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#C9CFD2",
    fontSize: moderateScale(FONT.xs),
    fontWeight: "600",
  },
  otherContent: {
    flex: 1,
  },
  otherNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  otherName: {
    color: "#9BA1A6",
    fontSize: moderateScale(FONT.xxs),
  },
  adminBadge: {
    color: "#3CC06E",
    fontSize: moderateScale(FONT.xxs),
    fontWeight: "700",
  },
  otherBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: moderateScale(6),
  },
  otherBubble: {
    backgroundColor: "#1F2422",
    paddingHorizontal: moderateScale(13),
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(14),
    borderTopLeftRadius: moderateScale(4),
  },
  otherText: {
    color: "#EEF2EF",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(20),
  },
  otherTime: {
    color: "#5A6065",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(2),
  },
  myRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    gap: moderateScale(6),
    marginBottom: moderateScale(14),
  },
  myStatus: {
    color: "#5A6065",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(2),
  },
  myTime: {
    color: "#5A6065",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(2),
  },
  myBubble: {
    backgroundColor: "#3CC06E",
    paddingHorizontal: moderateScale(13),
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(14),
    borderTopRightRadius: moderateScale(4),
    maxWidth: "72%",
  },
  myText: {
    color: "#0F1010",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(20),
    fontWeight: "600",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: "#1F2422",
    backgroundColor: "#0F1010",
  },
  plusBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: "#1A1F22",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#1A1F22",
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingTop: Platform.OS === "ios" ? moderateScale(10) : moderateScale(6),
    paddingBottom: Platform.OS === "ios" ? moderateScale(10) : moderateScale(6),
    color: "#EEF2EF",
    fontSize: moderateScale(FONT.sm),
    maxHeight: moderateScale(110),
    minHeight: moderateScale(38),
  },
  sendBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: "#3CC06E",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#244A33",
  },
});
