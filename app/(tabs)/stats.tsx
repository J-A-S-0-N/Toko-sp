import { ThemedText as Text } from "@/components/themed-text";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

import { EventItem, EventYoutubeVideoItem, fetchEventsByStatus, fetchLatestYoutubeVideosByChannelId } from "@/services/eventService";

const ONGOING_EVENT_URL = "https://www.youtube.com/@토코스포츠파크골프/posts";
const EVENT_VIDEO_CHANNEL_ID = "UCxFGRoEhJ9bdBIGoblsVrUA";

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

export default function StatsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState<string>("");
  const [ongoingEvent, setOngoingEvent] = useState<EventItem | null>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<EventYoutubeVideoItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const events = await fetchEventsByStatus("ongoing");
        setOngoingEvent(events[0] ?? null);
      } catch (error) {
        console.error("Failed to fetch ongoing event data:", error);
      } finally {
        setIsEventLoading(false);
      }

      try {
        const videos = await fetchLatestYoutubeVideosByChannelId(EVENT_VIDEO_CHANNEL_ID, 5);
        setYoutubeVideos(videos);
        setVideoLoadError("");
      } catch (error) {
        console.error("Failed to fetch event videos:", error);
        setVideoLoadError("영상 목록을 불러오지 못했습니다.");
      } finally {
        setIsVideoLoading(false);
      }
    };

    fetchData();
  }, []);

  const openOngoingEventUrl = async () => {
    try {
      await Linking.openURL(ONGOING_EVENT_URL);
    } catch (error) {
      console.error("Failed to open ongoing event URL:", error);
    }
  };

  const openVideoUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open video URL:", error);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + moderateScale(150) }]}
      >
        <View>
          <Text type="barlowHard" style={styles.pageTitle}>경품 이벤트</Text>
          <Text type="barlowLight" style={styles.pageSubtitle}>스코어를 기록하고 경품 이벤트에 참여해보세요.</Text>
        </View>

        <View style={styles.mainCard}>
          <Pressable style={styles.bannerPressable} onPress={openOngoingEventUrl}>
            <LinearGradient
              colors={["#00A45A", "#17C975", "#43DB90"]}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <View style={styles.bannerGlow} />
              <Text type="barlowLight" style={styles.bannerLabel}>토코기록기 공식 유튜브</Text>
              <Text type="barlowHard" style={styles.bannerTitle}>이벤트와{"\n"}당첨 결과 확인</Text>
              <View style={styles.bannerPlayCircle}>
                <Text type="barlowHard" style={styles.bannerPlayIcon}>▶</Text>
              </View>
            </LinearGradient>
          </Pressable>

          {isEventLoading ? (
            <View style={styles.noticeBox}>
              <ActivityIndicator size="small" color="#8ED0AA" />
            </View>
          ) : (
            <>
              <Text type="barlowHard" style={styles.cardTitle}>{ongoingEvent?.title || "진행중인 이벤트를 확인해보세요!"}</Text>
              <Text type="barlowLight" style={styles.cardDescription}>
                {ongoingEvent?.description || "토코기록기 공식 유튜브 커뮤니티에서 현재 진행 중인 이벤트, 참여 안내, 추첨 결과를 확인할 수 있습니다."}
              </Text>
            </>
          )}

          <Text type="barlowLight" style={styles.ongoingHint}>버튼을 누르면 유튜브 채널로 이동합니다.</Text>

          <Pressable style={styles.actionButton} onPress={openOngoingEventUrl}>
            <Text type="barlowHard" style={styles.actionButtonText}>결과 및 이벤트 확인하기</Text>
          </Pressable>

          <View style={styles.videoSectionHeader}>
            <Text type="barlowHard" style={styles.videoSectionTitle}>관련 영상</Text>
            <Text type="barlowLight" style={styles.videoSectionSubTitle}>채널 최신 영상 5개</Text>
          </View>

          {isVideoLoading ? (
            <View style={styles.noticeBox}>
              <ActivityIndicator size="small" color="#8ED0AA" />
            </View>
          ) : videoLoadError ? (
            <View style={styles.noticeBox}>
              <Text type="barlowLight" style={styles.noticeText}>{videoLoadError}</Text>
            </View>
          ) : youtubeVideos.length === 0 ? (
            <View style={styles.noticeBox}>
              <Text type="barlowLight" style={styles.noticeText}>등록된 영상이 없습니다.</Text>
            </View>
          ) : (
            <View style={styles.videoList}>
              {youtubeVideos.map((video) => {
                const thumbnailUrl = resolveYoutubeThumbnailUrl(video);
                return (
                  <Pressable key={video.id} style={styles.videoCard} onPress={() => openVideoUrl(video.url)}>
                    {thumbnailUrl ? (
                      <Image source={{ uri: thumbnailUrl }} style={styles.videoThumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.videoThumb, styles.videoThumbFallback]}>
                        <Text type="barlowHard" style={styles.videoThumbFallbackText}>VIDEO</Text>
                      </View>
                    )}

                    <View style={styles.videoTextBox}>
                      <Text type="barlowMedium" style={styles.videoTitle} numberOfLines={2} ellipsizeMode="tail">{video.title}</Text>
                      <Text type="barlowLight" style={styles.videoLinkLabel}>YouTube로 열기</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  container: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  content: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(8),
    gap: moderateScale(16),
  },
  pageTitle: {
    fontSize: moderateScale(26),
    color: "#F3F5F4",
  },
  pageSubtitle: {
    fontSize: moderateScale(15),
    color: "#8E9592",
  },
  mainCard: {
    backgroundColor: "#171919",
    borderRadius: moderateScale(24),
    padding: moderateScale(14),
    gap: moderateScale(14),
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  banner: {
    borderRadius: moderateScale(24),
    backgroundColor: "#1CD37A",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(18),
    minHeight: moderateScale(136),
    overflow: "hidden",
    justifyContent: "space-between",
  },
  bannerGlow: {
    position: "absolute",
    right: moderateScale(36),
    top: moderateScale(-18),
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(55),
    backgroundColor: "rgba(171, 235, 198, 0.26)",
  },
  bannerLabel: {
    color: "#CEEFDA",
    fontSize: moderateScale(8),
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    marginTop: moderateScale(8),
    lineHeight: moderateScale(25),
  },
  bannerPressable: {
    borderRadius: moderateScale(24),
    overflow: "hidden",
  },
  bannerPlayCircle: {
    position: "absolute",
    right: moderateScale(22),
    bottom: moderateScale(16),
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: "rgba(196, 255, 222, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerPlayIcon: {
    color: "#E8FFF2",
    fontSize: moderateScale(18),
    marginLeft: moderateScale(3),
  },
  bannerGift: {
    position: "absolute",
    right: moderateScale(22),
    bottom: moderateScale(16),
    fontSize: moderateScale(30),
  },
  cardTitle: {
    fontSize: moderateScale(23),
    color: "#F2F4F3",
  },
  cardDescription: {
    fontSize: moderateScale(17),
    color: "#8E9592",
    lineHeight: moderateScale(24),
  },
  actionButton: {
    borderRadius: moderateScale(18),
    backgroundColor: "#0DDC7A",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(18),
  },
  actionButtonText: {
    color: "#08130D",
    fontSize: moderateScale(18),
  },
  ongoingHint: {
    textAlign: "center",
    color: "#7F8A86",
    fontSize: moderateScale(12),
  },
  videoSectionHeader: {
    gap: moderateScale(3),
    marginTop: moderateScale(6),
  },
  videoSectionTitle: {
    fontSize: moderateScale(18),
    color: "#F0F3F2",
  },
  videoSectionSubTitle: {
    fontSize: moderateScale(12),
    color: "#8E9592",
  },
  videoList: {
    gap: moderateScale(10),
  },
  videoCard: {
    flexDirection: "row",
    gap: moderateScale(10),
    borderRadius: moderateScale(14),
    backgroundColor: "#1F2222",
    padding: moderateScale(10),
    alignItems: "center",
  },
  videoThumb: {
    width: moderateScale(112),
    height: moderateScale(70),
    borderRadius: moderateScale(10),
    backgroundColor: "#2A2E2D",
  },
  videoThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  videoThumbFallbackText: {
    color: "#AAB2AF",
    fontSize: moderateScale(12),
  },
  videoTextBox: {
    flex: 1,
    gap: moderateScale(5),
  },
  videoTitle: {
    fontSize: moderateScale(17),
    color: "#EFF2F1",
    lineHeight: moderateScale(23),
  },
  videoLinkLabel: {
    fontSize: moderateScale(11),
    color: "#7ED2A1",
  },
  noticeBox: {
    borderRadius: moderateScale(18),
    backgroundColor: "#1D2B22",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(4),
  },
  noticeText: {
    color: "#8ED0AA",
    fontSize: moderateScale(16),
  },
});
