import { ThemedText as Text } from "@/components/themed-text";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

const qualityChecks = [
  {
    label: "카드 전체가 화면에 들어왔는지 확인하세요",
    status: "양호",
    type: "good",
  },
  {
    label: "빛 반사나 흐림이 없는지 확인하세요",
    status: "양호",
    type: "good",
  },
  {
    label: "빛글씨가 선명하게 보이면 준비됐어요 반사",
    status: "주의",
    type: "warning",
  },
] as const;

const rotatingTitles = [
  "사진이 잘 찍혔나요?",
  "카드 인식 상태가 좋아요",
  "한 번 더 확인해볼까요?",
] as const;

const AnimatedThemedText = Animated.createAnimatedComponent(Text);

export default function PreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { photoUri } = useLocalSearchParams<{ photoUri?: string | string[] }>();
  const { holes, shotIndex, photos } = useLocalSearchParams<{
    holes?: string;
    shotIndex?: string;
    photos?: string;
  }>();
  const [titleIndex, setTitleIndex] = useState(0);
  const titleSlideAnim = useRef(new Animated.Value(0)).current;
  const statusDotPulseAnim = useRef(new Animated.Value(0)).current;

  const previewUri = Array.isArray(photoUri) ? photoUri[0] : photoUri;
  const holesCount = holes === "18" ? 18 : 9;
  const requiredShots = holesCount === 18 ? 2 : 1;
  const currentShotIndex = shotIndex === "2" ? 2 : 1;
  const parsedPhotos = React.useMemo(() => {
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

  const handleRoute = () => {
    if (currentShotIndex < requiredShots) {
      router.replace({
        pathname: "./capture",
        params: {
          holes: String(holesCount),
          shotIndex: String(currentShotIndex + 1),
          photos: JSON.stringify(parsedPhotos),
        },
      });
      return;
    }

    if (!parsedPhotos.length) {
      Alert.alert("사진 없음", "업로드할 사진을 먼저 촬영해 주세요.");
      return;
    }

    router.replace({
      pathname: "./roundInfo",
      params: {
        holes: String(holesCount),
        photos: JSON.stringify(parsedPhotos),
      },
    });
  };

  const primaryButtonLabel = currentShotIndex < requiredShots ? "후반 9홀 찍기" : "분석 시작";

  const titleTranslateX = titleSlideAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-24, 0, 24],
  });

  const titleOpacity = titleSlideAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0, 1, 0],
  });

  const statusDotScale = statusDotPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const statusDotOpacity = statusDotPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.55],
  });

  useEffect(() => {
    let isMounted = true;

    const animateNextTitle = () => {
      Animated.timing(titleSlideAnim, {
        toValue: -1,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        if (!isMounted) return;

        setTitleIndex((prevIndex) => (prevIndex + 1) % rotatingTitles.length);
        titleSlideAnim.setValue(1);

        Animated.timing(titleSlideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }).start();
      });
    };

    const intervalId = setInterval(animateNextTitle, 3500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      titleSlideAnim.stopAnimation();
    };
  }, [titleSlideAnim]);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(statusDotPulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(statusDotPulseAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
      statusDotPulseAnim.stopAnimation();
    };
  }, [statusDotPulseAnim]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.contentLayer}>
          <View style={styles.headerRow}>
            <Pressable style={styles.iconButton} onPress={() => {
              Alert.alert(
                "스캔을 중단하시겠어요?",
                "지금까지의 진행 내용이 사라집니다.",
                [
                  { text: "취소", style: "cancel" },
                  {
                    text: "나가기",
                    style: "destructive",
                    onPress: () => router.replace("/(tabs)/scan"),
                  },
                ]
              );
            }}>
              <Feather name="x" size={moderateScale(20)} color="#D4D9DB" />
            </Pressable>
            <View style={styles.headerDot} />
          </View>

          <View style={styles.previewCard}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.previewPlaceholder} />
            )}
          </View>

          <View style={styles.bottomPanel}>
            <View style={styles.statusChip}>
              <Animated.View
                style={[
                  styles.statusChipDot,
                  {
                    opacity: statusDotOpacity,
                    transform: [{ scale: statusDotScale }],
                  },
                ]}
              />
              <Text type="barlowLight" style={styles.statusChipText}>
                스코어카드 인식 완료
              </Text>
            </View>

            <View style={styles.titleSliderContainer}>
              <AnimatedThemedText
                type="barlowHard"
                style={[
                  styles.titleText,
                  {
                    opacity: titleOpacity,
                    transform: [{ translateX: titleTranslateX }],
                  },
                ]}
              >
                {rotatingTitles[titleIndex]}
              </AnimatedThemedText>
            </View>
            <Text type="barlowLight" style={styles.descriptionText}>
              카드가 그리드 안에 들어오도록{"\n"}
              맞춰서 촬영해 주세요.
            </Text>

            <View style={styles.divider} />

            <View style={styles.checkList}>
              {qualityChecks.map((item) => (
                <View key={item.label} style={styles.checkRow}>
                  <View
                    style={{
                      width: moderateScale(5),
                      height: moderateScale(5),
                      borderRadius: moderateScale(5),
                      backgroundColor: "#D4D9DB",
                    }}
                  />
                  <Text type="barlowLight" style={{ color: "white" }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
              <View style={styles.buttonGapLayer}>
                <View style={styles.buttonInnerLayer}>
                  <Text type="barlowHard" style={styles.secondaryButtonText}>
                    다시 찍기
                  </Text>
                </View>
              </View>
            </Pressable>

            <Pressable style={styles.primaryButton} onPress={handleRoute}>
              <View style={styles.primaryButtonGapLayer}>
                <View style={styles.primaryButtonInnerLayer}>
                  <Text type="barlowHard" style={styles.primaryButtonText}>
                    {primaryButtonLabel}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
      <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020405",
  },
  bottomSafeArea: {
    backgroundColor: "#020405",
  },
  container: {
    flex: 1,
    backgroundColor: "#020405",
    paddingHorizontal: moderateScale(14),
  },
  contentLayer: {
    flex: 1,
    paddingTop: moderateScale(8),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#1F2528",
    backgroundColor: "#0A0D0F",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#F5F7F8",
    fontSize: moderateScale(18),
  },
  headerDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#FF4A3A",
  },
  previewCard: {
    height: moderateScale(300),
    borderRadius: moderateScale(20),
    overflow: "hidden",
    backgroundColor: "#0A0D10",
    borderWidth: 1,
    borderColor: "#11181C",
    marginBottom: moderateScale(17),
  },
  previewPlaceholder: {
    flex: 1,
    backgroundColor: "#111417",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewGuideLine: {
    position: "absolute",
    left: moderateScale(22),
    right: moderateScale(22),
    bottom: moderateScale(30),
    height: moderateScale(2),
    borderRadius: moderateScale(1),
    backgroundColor: "#2CCB98",
  },
  previewGuideIndicator: {
    position: "absolute",
    left: moderateScale(20),
    bottom: moderateScale(20),
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(5),
    backgroundColor: "#40D9A7",
  },
  titleText: {
    color: "#F3F5F6",
    fontSize: moderateScale(42 / 2),
  },
  titleSliderContainer: {
    marginBottom: moderateScale(6),
    overflow: "hidden",
    minHeight: moderateScale(26),
    justifyContent: "center",
  },
  descriptionText: {
    color: "#5B6167",
    fontSize: moderateScale(26 / 2),
    marginBottom: moderateScale(14),
  },
  bottomPanel: {
    flex: 1,
  },
  statusChip: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    backgroundColor: "#093024",
    borderWidth: 1,
    borderColor: "#10664C",
    borderRadius: moderateScale(18),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  statusChipDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(5),
    backgroundColor: "#36DC9F",
    marginRight: moderateScale(8),
  },
  statusChipText: {
    color: "#36DC9F",
    fontSize: moderateScale(11),
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#1A1F22",
    marginBottom: moderateScale(14),
  },
  checkList: {
    gap: moderateScale(10),
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    //justifyContent: "space-between",
    gap: moderateScale(20),
  },
  checkLabel: {
    //color: "#7B8086",
    color:"white",
    fontSize: moderateScale(12),
  },
  checkStatusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  checkIconGood: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: "#0F2F25",
    justifyContent: "center",
    alignItems: "center",
  },
  checkIconWarning: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: "#2D230F",
    justifyContent: "center",
    alignItems: "center",
  },
  checkTextGood: {
    color: "#38DBA1",
    fontSize: moderateScale(15),
  },
  checkTextWarning: {
    color: "#F9B24D",
    fontSize: moderateScale(15),
  },
  actionRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginTop: "auto",
    marginBottom: moderateScale(10),
  },
  secondaryButton: {
    flex: 1,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: "#363B3F",
    padding: moderateScale(1),
  },
  primaryButton: {
    flex: 1.35,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: "#0F3A2A",
    padding: moderateScale(1),
  },
  buttonGapLayer: {
    flex: 1,
    borderRadius: moderateScale(11),
    backgroundColor: "#020405",
    padding: moderateScale(1),
  },
  buttonInnerLayer: {
    flex: 1,
    borderRadius: moderateScale(10),
    backgroundColor: "#020405",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonGapLayer: {
    flex: 1,
    borderRadius: moderateScale(11),
    backgroundColor: "#0B2E21",
    padding: moderateScale(1),
  },
  primaryButtonInnerLayer: {
    flex: 1,
    borderRadius: moderateScale(10),
    backgroundColor: "#082419",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#F4F6F7",
    fontSize: moderateScale(14),
  },
  primaryButtonText: {
    color: "#F4F6F7",
    fontSize: moderateScale(14),
  },
});
