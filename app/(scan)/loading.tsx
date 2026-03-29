import { ThemedText as Text } from "@/components/themed-text";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

import { db } from "@/config/firebase";

const tips = [
  {
    icon: "target",
    title: "흔들림 방지",
    description: "촬영 시 손을 최대한 고정해 주세요",
  },
  {
    icon: "circle",
    title: "원 안에 맞추기",
    description: "스코어카드가 프레임 안에 전부 들어오게 해주세요",
  },
  {
    icon: "sun",
    title: "밝기 확인",
    description: "어두우면 인식률이 낮아질 수 있어요",
  },
  {
    icon: "rotate-cw",
    title: "각도 조절",
    description: "반사가 보이면 카드를 살짝 기울여 주세요",
  },
] as const;

const title = [
  "스코어카드 스캔 중...",
  "잠시만 기다려 주세요...",
  "거의 완료..."
] as const;

const TIP_INTERVAL_MS = 4500;
const TITLE_INTERVAL_MS = 8000;
const TAB_GAP = moderateScale(6);
const DOT_PHASE_STEP = (2 * Math.PI) / 3;

export default function LoadingScreen() {
  const router = useRouter();
  const { holes, photos } = useLocalSearchParams<{
    holes?: string;
    photos?: string;
  }>();

  const [tipIndex, setTipIndex] = useState(0);
  const [tabsWidth, setTabsWidth] = useState(0);
  const [titleIndex, setTitleIndex] = useState(0);
  const uploadStartedRef = React.useRef(false);

  const holesCount = holes === "18" ? 18 : 9;
  const parsedPhotos = useMemo(() => {
    if (!photos) return [] as string[];

    try {
      const decoded = JSON.parse(photos);
      if (Array.isArray(decoded)) {
        return decoded.filter((item) => typeof item === "string") as string[];
      }

      return [] as string[];
    } catch {
      return [] as string[];
    }
  }, [photos]);

  const indicatorTranslateX = useSharedValue(0);
  const dotsPhase = useSharedValue(0);
  const statusDotPulse = useSharedValue(0);


  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % title.length);
    }, TITLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, TIP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!tabsWidth) return;
    const segmentWidth = (tabsWidth - TAB_GAP * (tips.length - 1)) / tips.length;

    indicatorTranslateX.value = withTiming(tipIndex * (segmentWidth + TAB_GAP), {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [indicatorTranslateX, tabsWidth, tipIndex]);

  useEffect(() => {
    dotsPhase.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: 1250,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [dotsPhase]);

  useEffect(() => {
    statusDotPulse.value = withRepeat(
      withTiming(1, {
        duration: 900,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [statusDotPulse]);

  //this is testing only!!!!!!
  useEffect(() => {
    router.replace({
      pathname: "./resultPreview",
      params: {
        holes: String(holesCount),
      },
    });
  }, []);

  useEffect(() => {
    if (uploadStartedRef.current) return;
    if (!parsedPhotos.length) return;

    uploadStartedRef.current = true;
    let unsubscribeStatusListener: (() => void) | null = null;
    let isActive = true;

    const persistScan = async () => {
      try {
        const storage = getStorage();
        const uploadTimestamp = Date.now();

        const uploadedPhotoUrls = await Promise.all(
          parsedPhotos.map(async (uri, index) => {
            const response = await fetch(uri);
            const blob = await response.blob();

            const storageRef = ref(
              storage,
              `scans/${uploadTimestamp}-${index + 1}-${Math.random().toString(36).slice(2)}.jpg`
            );

            await uploadBytes(storageRef, blob);
            return getDownloadURL(storageRef);
          })
        );

        const scanDocRef = doc(collection(db, "Scans"));
        await setDoc(scanDocRef, {
          holes: holesCount,
          photoUrls: uploadedPhotoUrls,
          status: "pending",
          createdAt: serverTimestamp(),
        });

        unsubscribeStatusListener = onSnapshot(scanDocRef, (snapshot) => {
          const status = snapshot.data()?.status;
          if (status === "pending") return;

          console.error("somethings changed", status);

          unsubscribeStatusListener?.();
          unsubscribeStatusListener = null;

          if (isActive) {
            router.replace({
              pathname: "./resultPreview",
              params: {
                holes: String(holesCount),
              },
            });
          }
        });
      } catch (error) {
        console.error("Failed to upload scan photos:", error);
        Alert.alert("업로드 실패", "사진 업로드 중 오류가 발생했어요. 다시 시도해 주세요.", [
          {
            text: "확인",
            onPress: () => router.back(),
          },
        ]);
      }
    };

    persistScan();

    return () => {
      isActive = false;
      unsubscribeStatusListener?.();
    };
  }, [holesCount, parsedPhotos, router]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorTranslateX.value }],
  }));

  const dotOneStyle = useAnimatedStyle(() => {
    const intensity = (Math.sin(dotsPhase.value) + 1) / 2;
    return {
      opacity: 0.35 + intensity * 0.65,
      transform: [{ scale: 0.8 + intensity * 0.45 }],
    };
  });

  const dotTwoStyle = useAnimatedStyle(() => {
    const intensity = (Math.sin(dotsPhase.value + DOT_PHASE_STEP) + 1) / 2;
    return {
      opacity: 0.35 + intensity * 0.65,
      transform: [{ scale: 0.8 + intensity * 0.45 }],
    };
  });

  const dotThreeStyle = useAnimatedStyle(() => {
    const intensity = (Math.sin(dotsPhase.value + DOT_PHASE_STEP * 2) + 1) / 2;
    return {
      opacity: 0.35 + intensity * 0.65,
      transform: [{ scale: 0.8 + intensity * 0.45 }],
    };
  });

  const statusDotStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + statusDotPulse.value * 0.35,
    transform: [{ scale: 1 + statusDotPulse.value * 0.25 }],
  }));

  const segmentWidth = useMemo(() => {
    if (!tabsWidth) return 0;
    return (tabsWidth - TAB_GAP * (tips.length - 1)) / tips.length;
  }, [tabsWidth]);

  const handleTabsLayout = (event: LayoutChangeEvent) => {
    setTabsWidth(event.nativeEvent.layout.width);
  };

  const activeTip = tips[tipIndex];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topStatusRow}>
          <Animated.View style={[styles.statusDot, statusDotStyle]} />
          <Text type="barlowLight" style={styles.statusText}>
            분석 중
          </Text>
        </View>

        <View style={styles.centerSection}>
          <View style={styles.pulseDotsRow}>
            <Animated.View style={[styles.pulseDot, dotOneStyle]} />
            <Animated.View style={[styles.pulseDot, dotTwoStyle]} />
            <Animated.View style={[styles.pulseDot, dotThreeStyle]} />
          </View>

          <View style={styles.titleBlock}>
            <Animated.View
              key={titleIndex}
              entering={FadeInUp.duration(550)}
              exiting={FadeOutUp.duration(400)}
            >
              <Text type="barlowHard" style={styles.titleText}>
                {title[titleIndex]}
              </Text>
            </Animated.View>
            <Text type="barlowLight" style={styles.subtitleText}>
              잠시만 기다려 주세요
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text type="barlowLight" style={styles.tipLabel}>
            촬영 팁
          </Text>

          <View style={styles.tipContentArea}>
            <Animated.View
              key={tipIndex}
              entering={FadeInUp.duration(400)}
              exiting={FadeOutUp.duration(400)}
              style={styles.tipContentRow}
            >
              <View style={styles.tipIconWrap}>
                <Feather name={activeTip.icon} size={moderateScale(14)} color="#F2CF56" />
              </View>

              <View style={styles.tipCopyWrap}>
                <Text type="barlowHard" style={styles.tipTitle}>
                  {activeTip.title}
                </Text>
                <Text type="barlowLight" style={styles.tipDescription}>
                  {activeTip.description}
                </Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.tabsTrack} onLayout={handleTabsLayout}>
            {tips.map((item) => (
              <View key={item.title} style={styles.tabSegment} />
            ))}

            {segmentWidth > 0 ? (
              <Animated.View
                entering={FadeIn.duration(400)}
                exiting={FadeOut.duration(400)}
                style={[styles.activeTab, { width: segmentWidth }, indicatorStyle]}
              />
            ) : null}
          </View>
        </View>
      </View>
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
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(12),
    justifyContent: "space-between",
    backgroundColor: "#0F1010",
  },
  topStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginTop: moderateScale(6),
  },
  statusDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    backgroundColor: "#22C783",
    shadowColor: "#22C783",
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    color: "#818E95",
    fontSize: moderateScale(12),
  },
  centerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: moderateScale(28),
  },
  pulseDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  pulseDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    backgroundColor: "#C8D0CD",
  },
  titleBlock: {
    alignItems: "center",
    gap: moderateScale(5),
  },
  titleText: {
    color: "#F2F4F5",
    fontSize: moderateScale(20),
    //letterSpacing: moderateScale(0.2),
  },
  subtitleText: {
    color: "#8E9A9F",
    fontSize: moderateScale(14),
  },
  tipCard: {
    backgroundColor: "#181A1A",
    borderRadius: moderateScale(16),
    borderWidth: 0.5,
    borderColor: "#282A2A",
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(12),
    gap: moderateScale(10),
    marginBottom: moderateScale(6),
  },
  tipLabel: {
    color: "#73828A",
    fontSize: moderateScale(11),
  },
  tipContentArea: {
    minHeight: moderateScale(58),
    justifyContent: "center",
  },
  tipContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  tipIconWrap: {
    padding: moderateScale(14),
    borderRadius: moderateScale(8),
    backgroundColor: "#1C2622",
    borderWidth: 1,
    borderColor: "#1E414B",
    justifyContent: "center",
    alignItems: "center",
  },
  tipCopyWrap: {
    flex: 1,
    gap: moderateScale(2),
  },
  tipTitle: {
    color: "#E4E8EA",
    fontSize: moderateScale(20),
  },
  tipDescription: {
    color: "#88959C",
    fontSize: moderateScale(12),
  },
  tabsTrack: {
    position: "relative",
    flexDirection: "row",
    gap: TAB_GAP,
    marginTop: moderateScale(2),
  },
  tabSegment: {
    flex: 1,
    height: moderateScale(2),
    borderRadius: moderateScale(1),
    backgroundColor: "#2A3135",
  },
  activeTab: {
    position: "absolute",
    left: 0,
    top: 0,
    height: moderateScale(2),
    borderRadius: moderateScale(1),
    backgroundColor: "#4CAF82",
  },
});