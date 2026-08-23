import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { createSwingVideoRecord } from "@/services/swingVideoService";
import Feather from "@expo/vector-icons/Feather";
import { ResizeMode, Video, type AVPlaybackStatus } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

function formatTime(seconds: number) {
  return `00:${seconds.toFixed(1).padStart(4, "0")}`;
}

export default function SwingTrimScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { duration, videoUri } = useLocalSearchParams<{ duration?: string; videoUri?: string }>();
  const parsedDuration = Number(duration);
  const totalDuration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? Math.max(parsedDuration, 0.2) : 6;
  const minRangeWidth = moderateScale(38);
  const timelineInset = moderateScale(12);
  const videoRef = React.useRef<Video>(null);
  const previewLoopIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPreviewSeekAtRef = React.useRef(0);

  const minGap = Math.min(0.8, Math.max(totalDuration - 0.05, 0.1));
  const minGapRatio = minGap / totalDuration;
  const initialTrimStart = Math.max(0, Math.min(1.5, totalDuration - minGap));
  const initialTrimEnd = Math.min(totalDuration, Math.max(initialTrimStart + minGap, totalDuration - 0.5));

  const [trimStart, setTrimStart] = React.useState(initialTrimStart);
  const [trimEnd, setTrimEnd] = React.useState(initialTrimEnd);
  const [isScrollEnabled, setIsScrollEnabled] = React.useState(true);
  const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (videoUri) return;

    Alert.alert("영상 없음", "촬영된 영상이 없어요. 다시 촬영 화면으로 이동합니다.", [
      {
        text: "확인",
        onPress: () => router.back(),
      },
    ]);
  }, [router, videoUri]);

  const stopPreviewLoop = React.useCallback(() => {
    if (!previewLoopIntervalRef.current) return;
    clearInterval(previewLoopIntervalRef.current);
    previewLoopIntervalRef.current = null;
  }, []);

  const stopPreview = React.useCallback(async () => {
    stopPreviewLoop();
    setIsPreviewPlaying(false);
    try {
      await videoRef.current?.pauseAsync();
    } catch {
      // no-op
    }
  }, [stopPreviewLoop]);

  React.useEffect(() => {
    return () => {
      stopPreviewLoop();
    };
  }, [stopPreviewLoop]);

  const timelineWidth = useSharedValue(1);
  const startRatio = useSharedValue(Math.max(0, Math.min(initialTrimStart / totalDuration, 1 - minGapRatio)));
  const endRatio = useSharedValue(Math.max(minGapRatio, Math.min(initialTrimEnd / totalDuration, 1)));
  const startPanOrigin = useSharedValue(startRatio.value);
  const endPanOrigin = useSharedValue(endRatio.value);

  const syncTrimTimesFromRatios = React.useCallback(
    (nextStartRatio: number, nextEndRatio: number) => {
      const nextStart = Number((nextStartRatio * totalDuration).toFixed(1));
      const nextEnd = Number((nextEndRatio * totalDuration).toFixed(1));
      setTrimStart(nextStart);
      setTrimEnd(nextEnd);
    },
    [totalDuration]
  );

  const seekPreviewToSec = React.useCallback(
    (targetSec: number) => {
      if (!videoUri || isSubmitting) return;

      const now = Date.now();
      if (now - lastPreviewSeekAtRef.current < 80) return;
      lastPreviewSeekAtRef.current = now;

      const clampedSec = Math.max(0, Math.min(targetSec, totalDuration));

      void (async () => {
        try {
          stopPreviewLoop();
          setIsPreviewPlaying(false);
          await videoRef.current?.pauseAsync();
          await videoRef.current?.setPositionAsync(Math.round(clampedSec * 1000));
        } catch {
          // no-op
        }
      })();
    },
    [isSubmitting, stopPreviewLoop, totalDuration, videoUri]
  );

  useAnimatedReaction(
    () => {
      const nextStart = Number((startRatio.value * totalDuration).toFixed(1));
      const nextEnd = Number((endRatio.value * totalDuration).toFixed(1));
      return { nextStart, nextEnd };
    },
    (current, previous) => {
      if (!previous || current.nextStart !== previous.nextStart || current.nextEnd !== previous.nextEnd) {
        runOnJS(syncTrimTimesFromRatios)(startRatio.value, endRatio.value);
      }
    },
    [totalDuration, syncTrimTimesFromRatios]
  );

  const startHandlePan = Gesture.Pan()
    .onBegin(() => {
      startPanOrigin.value = startRatio.value;
      runOnJS(setIsScrollEnabled)(false);
    })
    .onUpdate((event) => {
      const width = Math.max(timelineWidth.value - timelineInset * 2, 1);
      const deltaRatio = event.translationX / width;
      const maxStart = endRatio.value - minGapRatio;
      const nextStart = Math.max(0, Math.min(startPanOrigin.value + deltaRatio, maxStart));
      startRatio.value = nextStart;
      runOnJS(seekPreviewToSec)(nextStart * totalDuration);
    })
    .onFinalize(() => {
      runOnJS(syncTrimTimesFromRatios)(startRatio.value, endRatio.value);
      runOnJS(setIsScrollEnabled)(true);
    });

  const endHandlePan = Gesture.Pan()
    .onBegin(() => {
      endPanOrigin.value = endRatio.value;
      runOnJS(setIsScrollEnabled)(false);
    })
    .onUpdate((event) => {
      const width = Math.max(timelineWidth.value - timelineInset * 2, 1);
      const deltaRatio = event.translationX / width;
      const minEnd = startRatio.value + minGapRatio;
      const nextEnd = Math.min(1, Math.max(endPanOrigin.value + deltaRatio, minEnd));
      endRatio.value = nextEnd;
      runOnJS(seekPreviewToSec)(nextEnd * totalDuration);
    })
    .onFinalize(() => {
      runOnJS(syncTrimTimesFromRatios)(startRatio.value, endRatio.value);
      runOnJS(setIsScrollEnabled)(true);
    });

  const activeRangeAnimatedStyle = useAnimatedStyle(() => {
    const usableWidth = Math.max(timelineWidth.value - timelineInset * 2, 1);
    const left = timelineInset + startRatio.value * usableWidth;
    const width = Math.max((endRatio.value - startRatio.value) * usableWidth, minRangeWidth);
    return {
      left,
      width,
    };
  }, [timelineInset, minRangeWidth]);

  const handleTogglePreview = async () => {
    if (!videoUri || isSubmitting) return;

    if (isPreviewPlaying) {
      await stopPreview();
      return;
    }

    const startMs = Math.max(0, Math.round(trimStart * 1000));
    const endMs = Math.max(startMs + 100, Math.round(trimEnd * 1000));

    try {
      await videoRef.current?.setPositionAsync(startMs);
      await videoRef.current?.playAsync();
      setIsPreviewPlaying(true);
      stopPreviewLoop();

      previewLoopIntervalRef.current = setInterval(() => {
        void (async () => {
          const status = (await videoRef.current?.getStatusAsync()) as AVPlaybackStatus | undefined;
          if (!status || !status.isLoaded) return;

          if (status.positionMillis >= endMs) {
            stopPreviewLoop();
            await videoRef.current?.pauseAsync();
            await videoRef.current?.setPositionAsync(startMs);
            setIsPreviewPlaying(false);
          }
        })();
      }, 120);
    } catch {
      stopPreviewLoop();
      setIsPreviewPlaying(false);
      Alert.alert("미리보기 실패", "영상 미리보기를 재생하지 못했어요. 다시 시도해주세요.");
    }
  };

  const handleConfirm = async () => {
    if (!videoUri) {
      Alert.alert("영상 없음", "촬영된 영상이 없어 저장할 수 없습니다.");
      return;
    }

    if (!user?.uid) {
      Alert.alert("로그인 필요", "영상을 저장하려면 로그인 상태가 필요합니다.");
      return;
    }

    if (isSubmitting) return;

    syncTrimTimesFromRatios(startRatio.value, endRatio.value);
    const confirmedStart = Number((startRatio.value * totalDuration).toFixed(1));
    const confirmedEnd = Number((endRatio.value * totalDuration).toFixed(1));

    if (confirmedEnd <= confirmedStart) {
      Alert.alert("구간 확인", "종료 시점은 시작 시점보다 뒤여야 합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      await stopPreview();
      const result = await createSwingVideoRecord({
        userId: user.uid,
        originalVideoUri: videoUri,
        trimStartSec: confirmedStart,
        trimEndSec: confirmedEnd,
        sourceDurationSec: totalDuration,
      });

      router.push({
        pathname: "./loading",
        params: {
          trimStart: confirmedStart.toFixed(1),
          trimEnd: confirmedEnd.toFixed(1),
          swingVideoId: result.swingVideoId,
        },
      });
    } catch {
      Alert.alert(
        "저장 실패",
        "영상 업로드를 자동으로 다시 시도했지만 완료하지 못했어요. 네트워크를 확인한 뒤 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <LinearGradient colors={["#03110F", "#020A09", "#010605"]} style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={isScrollEnabled}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerRow}>
            <Pressable style={styles.iconButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={moderateScale(20)} color="#DDE4E2" />
            </Pressable>

            <Text type="barlowHard" style={styles.headerTitle}>
              스윙 구간 선택
            </Text>

            <Pressable style={styles.iconButton} onPress={handleConfirm}>
              <Feather name="check" size={moderateScale(20)} color="#DDE4E2" />
            </Pressable>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressOn} />
            <View style={styles.progressOn} />
            <View style={styles.progressOff} />
          </View>

          <Text type="barlowHard" style={styles.titleText}>
            스윙의 시작과 끝을{"\n"}직접 맞춰주세요
          </Text>
          <Text type="barlowLight" style={styles.subtitleText}>
            준비 동작은 제외하고, 실제 스윙 구간만 선택해주세요.
          </Text>

          <View style={styles.previewCard}>
            {videoUri ? (
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                isLooping={false}
                shouldPlay={false}
                useNativeControls={false}
              />
            ) : (
              <View style={styles.previewMissingWrap}>
                <Text type="barlowLight" style={styles.previewMissingText}>
                  촬영 영상 없음
                </Text>
              </View>
            )}

            <Pressable style={styles.playButton} onPress={() => void handleTogglePreview()} disabled={!videoUri || isSubmitting}>
              <Feather name={isPreviewPlaying ? "pause" : "play"} size={moderateScale(24)} color="#EBF3F0" />
            </Pressable>
          </View>

          <View style={styles.trimCard}>
            <View style={styles.trimHeaderRow}>
              <View>
                <Text type="barlowHard" style={styles.trimLabel}>
                  START
                </Text>
                <Text type="barlowHard" style={styles.trimValue}>
                  {formatTime(trimStart)}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text type="barlowHard" style={styles.trimLabel}>
                  END
                </Text>
                <Text type="barlowHard" style={styles.trimValue}>
                  {formatTime(trimEnd)}
                </Text>
              </View>
            </View>

            <View
              style={styles.timelineRow}
              onLayout={(event) => {
                timelineWidth.value = event.nativeEvent.layout.width;
              }}
            >
              <View style={styles.timelineTrack} />
              <Animated.View style={[styles.activeRange, activeRangeAnimatedStyle]}>
                <View pointerEvents="none" style={styles.activeRangeLine} />
                <GestureDetector gesture={startHandlePan}>
                  <Animated.View style={styles.rangeHandle}>
                    <View pointerEvents="none" style={styles.handleGrip}>
                      <View style={styles.handleGripLine} />
                      <View style={styles.handleGripLine} />
                    </View>
                  </Animated.View>
                </GestureDetector>
                <GestureDetector gesture={endHandlePan}>
                  <Animated.View style={styles.rangeHandle}>
                    <View pointerEvents="none" style={styles.handleGrip}>
                      <View style={styles.handleGripLine} />
                      <View style={styles.handleGripLine} />
                    </View>
                  </Animated.View>
                </GestureDetector>
              </Animated.View>
            </View>

            <View style={styles.trimDivider} />

            <View style={styles.helperRow}>
              <Feather name="code" size={moderateScale(16)} color="#11E2A0" />
              <View style={styles.helperTextRow}>
                <Text type="barlowHard" style={styles.helperTitleText}>
                  양쪽 손잡이
                </Text>
                <Text type="barlowLight" style={styles.helperSubText}>
                  를 드래그해 구간을 조정하세요
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomButtonWrap}>
            <Pressable
              style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
              onPress={() => void handleConfirm()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#021C14" />
                  <Text type="barlowHard" style={styles.confirmButtonText}>
                    처리 중...
                  </Text>
                </>
              ) : (
                <>
                  <Text type="barlowHard" style={styles.confirmButtonText}>
                    이 구간으로 분석하기
                  </Text>
                  <Feather name="arrow-right" size={moderateScale(24)} color="#021C14" />
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
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
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(8),
  },
  scrollContent: {
    paddingBottom: moderateScale(16),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(16),
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
  progressRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginBottom: moderateScale(18),
  },
  progressOn: {
    flex: 1,
    height: moderateScale(6),
    borderRadius: moderateScale(6),
    backgroundColor: "#11E1A0",
  },
  progressOff: {
    flex: 1,
    height: moderateScale(6),
    borderRadius: moderateScale(6),
    backgroundColor: "#1F2A27",
  },
  stepLabel: {
    color: "#11E2A0",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(6),
    letterSpacing: moderateScale(1.4),
  },
  titleText: {
    color: "#F3F7F5",
    fontSize: moderateScale(FONT.xl),
    lineHeight: moderateScale(34),
  },
  subtitleText: {
    marginTop: moderateScale(8),
    color: "#94A3A0",
    fontSize: moderateScale(FONT.xs),
    fontFamily: "Pretendard-Regular",
    marginBottom: moderateScale(16),
  },
  previewCard: {
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#1A3732",
    backgroundColor: "rgba(6,16,14,0.8)",
    height: moderateScale(300),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: moderateScale(16),
  },
  previewMissingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A1412",
  },
  previewMissingText: {
    color: "#A7B5B1",
    fontSize: moderateScale(FONT.xs),
    fontFamily: "Pretendard-Regular",
  },
  playButton: {
    position: "absolute",
    width: moderateScale(74),
    height: moderateScale(74),
    borderRadius: moderateScale(37),
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  trimCard: {
    borderRadius: moderateScale(22),
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent",
    paddingHorizontal: moderateScale(2),
    paddingVertical: moderateScale(6),
    marginTop: moderateScale(4),
  },
  trimHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  trimLabel: {
    color: "#11E2A0",
    fontSize: moderateScale(FONT.xxxs),
    marginBottom: moderateScale(2),
  },
  trimValue: {
    color: "#ECF3F0",
    fontSize: moderateScale(FONT.xl),
  },
  timelineRow: {
    height: moderateScale(64),
    borderRadius: moderateScale(16),
    backgroundColor: "rgba(75,175,130,0.12)",
    borderWidth: 1,
    borderColor: "rgba(75,175,130,0.18)",
    justifyContent: "center",
    paddingHorizontal: moderateScale(4),
    marginBottom: moderateScale(14),
    overflow: "hidden",
  },
  timelineTrack: {
    position: "absolute",
    left: moderateScale(12),
    right: moderateScale(12),
    height: moderateScale(8),
    borderRadius: moderateScale(999),
    backgroundColor: "#1E2C29",
  },
  activeRange: {
    position: "absolute",
    top: "50%",
    height: moderateScale(52),
    marginTop: -moderateScale(26),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "visible",
  },
  activeRangeLine: {
    position: "absolute",
    left: moderateScale(17),
    right: moderateScale(17),
    top: "50%",
    height: moderateScale(6),
    marginTop: -moderateScale(3),
    borderRadius: moderateScale(999),
    backgroundColor: "#4BAF82",
  },
  rangeHandle: {
    width: moderateScale(34),
    borderRadius: moderateScale(12),
    height: moderateScale(52),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4BAF82",
  },
  handleGrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(4),
  },
  handleGripLine: {
    width: moderateScale(3),
    height: moderateScale(18),
    borderRadius: moderateScale(3),
    backgroundColor: "#0F6A4F",
  },
  trimDivider: {
    height: 1,
    backgroundColor: "#1C302C",
    marginBottom: moderateScale(12),
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  helperTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  helperTitleText: {
    color: "#E9F0EE",
    fontSize: moderateScale(FONT.xs),
  },
  helperSubText: {
    color: "#8C9A97",
    fontSize: moderateScale(FONT.xs),
    fontFamily: "Pretendard-Regular",
  },
  bottomButtonWrap: {
    marginTop: moderateScale(14),
  },
  confirmButton: {
    minHeight: moderateScale(68),
    borderRadius: moderateScale(20),
    backgroundColor: "#12E2A0",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: moderateScale(10),
  },
  confirmButtonDisabled: {
    opacity: 0.8,
  },
  confirmButtonText: {
    color: "#021C14",
    fontSize: moderateScale(FONT.md),
    fontFamily: "Pretendard-SemiBold",
  },
});
