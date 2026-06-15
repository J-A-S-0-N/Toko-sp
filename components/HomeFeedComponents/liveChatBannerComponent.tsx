import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import {
  ChatMessage,
  getKoreanRelativeTime,
  subscribeToChatPreviews,
} from "@/services/chatService";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

interface LiveChatBannerComponentProps {
  onPress?: () => void;
}

const LiveChatBannerComponent = ({ onPress }: LiveChatBannerComponentProps) => {
  const [latestMessage, setLatestMessage] = useState<ChatMessage | null>(null);
  const [timeTick, setTimeTick] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToChatPreviews((messages) => {
      setLatestMessage(messages[0] ?? null);
    }, 1);

    return unsubscribe;
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeTick((prev) => prev + 1);
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const relativeLabel = useMemo(() => {
    if (!latestMessage?.createdAtMs) return "";
    return `${getKoreanRelativeTime(latestMessage.createdAtMs)} 새 대화`;
  }, [latestMessage?.createdAtMs, timeTick]);

  const previewLabel = useMemo(() => {
    if (!latestMessage) return "";

    const username = latestMessage.username?.trim() ?? "";
    const text = latestMessage.text?.trim() ?? "";

    if (!username && !text) return "";
    if (!username) return text;
    if (!text) return `${username}:`;

    return `${username}: ${text}`;
  }, [latestMessage]);

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
      <LinearGradient
        colors={["#0A1218", "#0B151B", "#0D2734"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.leftSection}>
          <View style={styles.iconWrap}>
            <View style={styles.iconInnerWrap}>
              <Feather name="message-circle" size={moderateScale(30)} color="#12D97A" />
            </View>
          </View>

          <View style={styles.textBlock}>
            <Text type="barlowHard" style={styles.title}>
              파크골프 채팅방
            </Text>
            <Text type="barlowLight" style={styles.newText}>
              {relativeLabel}
            </Text>
            <Text type="barlowLight" style={styles.previewText} numberOfLines={1}>
              {previewLabel}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.liveDot} />
          <Feather name="chevron-right" size={moderateScale(30)} color="#758086" />
        </View>

      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(18),
    borderWidth: moderateScale(1),
    borderColor: "#18323C",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: moderateScale(8),
  },
  iconWrap: {
    width: moderateScale(74),
    height: moderateScale(74),
    borderRadius: moderateScale(37),
    backgroundColor: "rgba(17, 217, 121, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
  },
  iconInnerWrap: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: "rgba(7, 39, 28, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: "#EAF1F4",
    fontSize: moderateScale(FONT.sm),
    letterSpacing: -0.2,
  },
  newText: {
    color: "#40C891",
    fontSize: moderateScale(FONT.xs),
    marginTop: moderateScale(2),
  },
  previewText: {
    color: "#DFE6E9",
    fontSize: moderateScale(FONT.sm),
    marginTop: moderateScale(2),
    letterSpacing: -0.1,
  },
  rightSection: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: moderateScale(8),
    gap: moderateScale(4),
  },
  liveDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: "#39D88A",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default LiveChatBannerComponent;
