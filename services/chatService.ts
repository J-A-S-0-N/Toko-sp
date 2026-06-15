import { db } from "@/config/firebase";
import {
  collection,
  doc,
  endBefore,
  getDocs,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userInitial: string;
  text: string;
  createdAtMs: number;
}

interface SendChatMessageInput {
  id: string;
  userId: string;
  username: string;
  userInitial: string;
  text: string;
}

export const MAX_CHAT_MESSAGE_LENGTH = 100;

const CHAT_MESSAGES_COLLECTION = collection(db, "chats", "global", "messages");

const mapDocToChatMessage = (snapshotDoc: any): ChatMessage => {
  const data = snapshotDoc.data();

  return {
    id: snapshotDoc.id,
    userId: data.userId ?? "",
    username: data.username ?? "익명",
    userInitial: data.userInitial ?? "?",
    text: data.text ?? "",
    createdAtMs: data.createdAtMs ?? 0,
  };
};

export const getInitialChatMessages = async (pageSize = 50): Promise<ChatMessage[]> => {
  const q = query(CHAT_MESSAGES_COLLECTION, orderBy("createdAtMs", "asc"), limitToLast(pageSize));
  const snap = await getDocs(q);
  return snap.docs.map(mapDocToChatMessage);
};

export const getOlderChatMessages = async (
  oldestCreatedAtMs: number,
  pageSize = 30
): Promise<ChatMessage[]> => {
  const q = query(
    CHAT_MESSAGES_COLLECTION,
    orderBy("createdAtMs", "asc"),
    endBefore(oldestCreatedAtMs),
    limitToLast(pageSize)
  );

  const snap = await getDocs(q);
  return snap.docs.map(mapDocToChatMessage);
};

export const subscribeToRecentChatMessages = (
  callback: (messages: ChatMessage[]) => void,
  pageSize = 50
) => {
  const q = query(CHAT_MESSAGES_COLLECTION, orderBy("createdAtMs", "asc"), limitToLast(pageSize));

  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map(mapDocToChatMessage));
    },
    (error) => {
      console.error("Failed to subscribe to chat messages:", error);
    }
  );
};

export const sendChatMessage = async ({
  id,
  userId,
  username,
  userInitial,
  text,
}: SendChatMessageInput): Promise<void> => {
  const sanitizedText = text.trim();

  if (!sanitizedText) {
    throw new Error("Message cannot be empty");
  }

  if (sanitizedText.length > MAX_CHAT_MESSAGE_LENGTH) {
    throw new Error(`Message must be ${MAX_CHAT_MESSAGE_LENGTH} characters or fewer`);
  }

  const messageRef = doc(db, "chats", "global", "messages", id);

  await setDoc(messageRef, {
    userId,
    username,
    userInitial,
    text: sanitizedText,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  });
};

export const subscribeToChatPreviews = (
  callback: (messages: ChatMessage[]) => void,
  previewSize = 3
) => {
  const q = query(CHAT_MESSAGES_COLLECTION, orderBy("createdAtMs", "desc"), limit(previewSize));

  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map(mapDocToChatMessage));
    },
    (error) => {
      console.error("Failed to subscribe to chat previews:", error);
    }
  );
};

export const getKoreanClockLabel = (createdAtMs: number): string => {
  if (!createdAtMs) return "";

  const date = new Date(createdAtMs);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${period} ${hour12}:${minutes}`;
};

export const getKoreanRelativeTime = (createdAtMs?: number): string => {
  if (!createdAtMs) return "새 메시지 없음";

  const diffMs = Date.now() - createdAtMs;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
};
