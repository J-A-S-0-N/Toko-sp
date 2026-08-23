import { ThemedText as Text } from "@/components/themed-text";
import { EventYoutubeVideoItem, fetchLatestYoutubeVideosByChannelId } from "@/services/eventService";
import React from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

const SCAN_TAB_VIDEO_CHANNEL_ID = "UCxFGRoEhJ9bdBIGoblsVrUA";

function extractYoutubeVideoId(url: string): string {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  const shortMatch = trimmedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch?.[1]) return shortMatch[1];

  const watchMatch = trimmedUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch?.[1]) return watchMatch[1];

  const embedMatch = trimmedUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch?.[1]) return embedMatch[1];

  const shortsMatch = trimmedUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch?.[1]) return shortsMatch[1];

  return "";
}

function resolveYoutubeThumbnailUrl(video: EventYoutubeVideoItem): string {
  if (video.thumbnailUrl.trim().length > 0) return video.thumbnailUrl;

  const videoId = extractYoutubeVideoId(video.url);
  if (!videoId) return "";

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export default function LatestYoutubeVideoSection() {
  const [isVideoLoading, setIsVideoLoading] = React.useState(true);
  const [videoLoadError, setVideoLoadError] = React.useState("");
  const [latestVideo, setLatestVideo] = React.useState<EventYoutubeVideoItem | null>(null);

  React.useEffect(() => {
    const fetchLatestVideo = async () => {
      try {
        const videos = await fetchLatestYoutubeVideosByChannelId(SCAN_TAB_VIDEO_CHANNEL_ID, 1);
        setLatestVideo(videos[0] ?? null);
        setVideoLoadError("");
      } catch (error) {
        console.error("Failed to fetch latest YouTube video on scan tab:", error);
        setVideoLoadError("최신 영상을 불러오지 못했습니다.");
      } finally {
        setIsVideoLoading(false);
      }
    };

    fetchLatestVideo();
  }, []);

  const handleOpenLatestVideo = React.useCallback(async () => {
    if (!latestVideo?.url) return;

    try {
      await Linking.openURL(latestVideo.url);
    } catch (error) {
      console.error("Failed to open latest YouTube video:", error);
      Alert.alert("오류", "영상을 여는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
    }
  }, [latestVideo?.url]);

  return (
    <View style={styles.youtubeContainer}>
      <View style={styles.youtubeHeaderRow}>
        <View style={styles.youtubeDot} />
        <View style={styles.youtubeHeaderTextWrap}>
          <Text style={styles.youtubeTitle}>공식 유튜브 최신 영상</Text>
          <Text style={styles.youtubeSubtitle}>스코어 기록 후 바로 확인해보세요</Text>
        </View>
      </View>

      {isVideoLoading ? (
        <View style={styles.youtubeNoticeBox}>
          <ActivityIndicator size="small" color="#8ED0AA" />
        </View>
      ) : videoLoadError ? (
        <View style={styles.youtubeNoticeBox}>
          <Text style={styles.youtubeNoticeText}>{videoLoadError}</Text>
        </View>
      ) : !latestVideo ? (
        <View style={styles.youtubeNoticeBox}>
          <Text style={styles.youtubeNoticeText}>표시할 영상이 없습니다.</Text>
        </View>
      ) : (
        <Pressable style={styles.youtubeCard} onPress={() => { void handleOpenLatestVideo(); }}>
          {resolveYoutubeThumbnailUrl(latestVideo) ? (
            <Image
              source={{ uri: resolveYoutubeThumbnailUrl(latestVideo) }}
              style={styles.youtubeThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.youtubeThumb, styles.youtubeThumbFallback]} />
          )}

          <View style={styles.youtubeTextWrap}>
            <Text style={styles.youtubeVideoTitle} numberOfLines={2}>
              {latestVideo.title}
            </Text>
            <Text style={styles.youtubeOpenLabel}>YouTube에서 보기</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  youtubeContainer: {
    marginTop: moderateScale(2),
    marginBottom: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    gap: moderateScale(8),
  },
  youtubeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  youtubeDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#1DD98A",
  },
  youtubeHeaderTextWrap: {
    gap: moderateScale(2),
  },
  youtubeTitle: {
    color: "#EDF2EF",
    fontSize: moderateScale(16),
    fontFamily: "Pretendard-Bold",
  },
  youtubeSubtitle: {
    color: "#86918E",
    fontSize: moderateScale(12),
    fontFamily: "Pretendard-Regular",
  },
  youtubeCard: {
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#273430",
    backgroundColor: "#161D1B",
    padding: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    minHeight: moderateScale(112),
  },
  youtubeThumb: {
    width: moderateScale(136),
    height: moderateScale(84),
    borderRadius: moderateScale(12),
    backgroundColor: "#28302D",
  },
  youtubeThumbFallback: {
    borderWidth: 1,
    borderColor: "#32423C",
  },
  youtubeTextWrap: {
    flex: 1,
    gap: moderateScale(7),
  },
  youtubeVideoTitle: {
    color: "#F0F4F1",
    fontSize: moderateScale(15),
    lineHeight: moderateScale(21),
    fontFamily: "Pretendard-Bold",
  },
  youtubeOpenLabel: {
    color: "#7FD7A7",
    fontSize: moderateScale(11),
    fontFamily: "Pretendard-Regular",
  },
  youtubeNoticeBox: {
    borderRadius: moderateScale(14),
    backgroundColor: "#18211F",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
  },
  youtubeNoticeText: {
    color: "#8FA7A0",
    fontSize: moderateScale(13),
    fontFamily: "Pretendard-Regular",
  },
});
