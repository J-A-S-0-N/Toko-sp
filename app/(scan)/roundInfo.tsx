import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Animated, {
    Easing,
    type SharedValue,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

import { useAuth } from "@/context/AuthContext";
import Feather from "@expo/vector-icons/Feather";
import { type DocumentReference, onSnapshot, updateDoc } from "firebase/firestore";
import { deletePendingScan } from "./scanCleanup";
import { createPendingScan } from "./scanFirebase";

const INACTIVE_COLOR = "#162923";
const ACTIVE_COLOR = "#53B88F";

export default function RoundInfoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { holes, photos } = useLocalSearchParams<{
    holes?: string;
    photos?: string;
  }>();

  const [courseName, setCourseName] = useState("");
  const [location, setLocation] = useState("");
  const [memo, setMemo] = useState("");
  const [isActivated, setIsActivated] = useState(false);
  const [scanDocId, setScanDocId] = useState<string | null>(null);
  const [scores, setScores] = useState<number[] | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"uploading" | "analyzing" | "done" | "error">("uploading");
  const scanDocRefLocal = useRef<DocumentReference | null>(null);
  const uploadStartedRef = useRef(false);

  const holesCount = holes === "18" ? 18 : 9;
  const parsedPhotos = useMemo(() => {
    if (!photos) return [] as string[];
    try {
      const decoded = JSON.parse(photos);
      if (Array.isArray(decoded)) return decoded.filter((item: unknown) => typeof item === "string") as string[];
      return [] as string[];
    } catch {
      return [] as string[];
    }
  }, [photos]);

  const courseGlow = useSharedValue(0);
  const locationGlow = useSharedValue(0);
  const memoGlow = useSharedValue(0);

  const courseRowStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(courseGlow.value, [0, 1], ["#232828", "#22C783"]),
    shadowOpacity: courseGlow.value * 0.25,
  }));
  const locationRowStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(locationGlow.value, [0, 1], ["#232828", "#22C783"]),
    shadowOpacity: locationGlow.value * 0.25,
  }));
  const memoRowStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(memoGlow.value, [0, 1], ["#232828", "#22C783"]),
    shadowOpacity: memoGlow.value * 0.25,
  }));

  const glowIn = (sv: SharedValue<number>) => {
    sv.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) });
  };
  const glowOut = (sv: SharedValue<number>) => {
    sv.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
  };

  const activatedRef = useRef(false);
  const buttonScale = useSharedValue(1);
  const colorProgress = useSharedValue(0);
  const dotPulse = useSharedValue(0);

  useEffect(() => {
    dotPulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [dotPulse]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + dotPulse.value * 0.3,
    transform: [{ scale: 1 + dotPulse.value * 0.15 }],
  }));

  const activate = useCallback(() => {
    if (activatedRef.current) return;
    activatedRef.current = true;
    setIsActivated(true);

    buttonScale.value = withSequence(
      withSpring(1.015, { damping: 14, stiffness: 400 }),
      withSpring(1, { damping: 16, stiffness: 300 }),
    );

    colorProgress.value = withTiming(1, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, [buttonScale, colorProgress]);

  const allRequiredFilled = courseName.trim().length > 0 && location.trim().length > 0;

  useEffect(() => {
    if (allRequiredFilled) activate();
  }, [allRequiredFilled, activate]);

  useEffect(() => {
    if (uploadStartedRef.current) return;
    if (!parsedPhotos.length) return;
    uploadStartedRef.current = true;

    let unsubscribe: (() => void) | null = null;
    let isActive = true;

    (async () => {
      try {
        const docRef = await createPendingScan(holesCount, parsedPhotos, user?.uid ?? "");
        if (!isActive) return;
        scanDocRefLocal.current = docRef;
        setScanDocId(docRef.id);
        setUploadPhase("analyzing");

        unsubscribe = onSnapshot(docRef, (snap) => {
          const data = snap.data();
          if (data?.status !== "done") return;

          const s: number[] = [];
          for (let i = 1; i <= holesCount; i++) s.push(data[`hole${i}`] ?? 0);
          if (isActive) {
            setScores(s);
            setUploadPhase("done");
            activate();
          }
          unsubscribe?.();
        });
      } catch (error) {
        console.error("Background upload failed:", error);
        if (isActive) setUploadPhase("error");
      }
    })();

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [holesCount, parsedPhotos, activate]);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    backgroundColor: interpolateColor(colorProgress.value, [0, 1], [INACTIVE_COLOR, ACTIVE_COLOR]),
  }));

  const handleNext = () => {
    if (!isActivated) return;

    const effectiveScanDocId = scanDocRefLocal.current?.id ?? scanDocId;

    if (scanDocRefLocal.current) {
      updateDoc(scanDocRefLocal.current, {
        courseName: courseName.trim(),
        location: location.trim(),
        memo: memo.trim(),
      }).catch((e) => console.error("Failed to save round info:", e));
    }

    if (scores) {
      router.replace({
        pathname: "./resultPreview",
        params: {
          holes: String(holesCount),
          scores: JSON.stringify(scores),
          courseName: courseName.trim(),
          ...(effectiveScanDocId ? { scanDocId: effectiveScanDocId } : {}),
        },
      });
    } else {
      router.replace({
        pathname: "./loading",
        params: {
          holes: String(holesCount),
          photos,
          courseName: courseName.trim(),
          ...(effectiveScanDocId ? { scanDocId: effectiveScanDocId } : {}),
        },
      });
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.glowContainer}>
        <View style={styles.glowOrbLeft} />
        <View style={styles.glowOrbRight} />
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.topRow}>
          <View style={styles.statusLeft}>
            <Pressable style={styles.backButton} onPress={() => {
              Alert.alert(
                "스캔을 중단하시겠어요?",
                "지금까지의 진행 내용이 사라집니다.",
                [
                  { text: "취소", style: "cancel" },
                  {
                    text: "나가기",
                    style: "destructive",
                    onPress: () => {
                      if (scanDocId) deletePendingScan(scanDocId);
                      router.replace("/(tabs)/scan");
                    },
                  },
                ]
              );
            }}>
              <Feather name="x" size={moderateScale(18)} color="#D4D9DB" />
            </Pressable>
            <Animated.View style={[styles.statusDot, dotStyle]} />
            <Text type="barlowLight" style={styles.statusText}>
              {uploadPhase === "done" ? "분석 완료" : uploadPhase === "analyzing" ? "백그라운드 분석 중" : uploadPhase === "error" ? "오류 발생" : "업로드 중"}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text type="barlowLight" style={styles.sectionLabel}>
            라운드 정보
          </Text>
          <Text type="barlowHard" style={styles.title}>
            어디서 치셨나요?
          </Text>
          <Text type="barlowLight" style={styles.subtitle}>
            분석하는 동안 입력해 주세요
          </Text>

          <View style={styles.inputGroup}>
            <Animated.View style={[styles.inputRow, courseRowStyle]}>
              <Text style={styles.inputIcon}>⛳</Text>
              <TextInput
                style={styles.textInput}
                placeholder="코스명"
                placeholderTextColor="#5C6366"
                value={courseName}
                onChangeText={setCourseName}
                onFocus={() => glowIn(courseGlow)}
                onBlur={() => glowOut(courseGlow)}
                returnKeyType="next"
              />
            </Animated.View>

            <Animated.View style={[styles.inputRow, locationRowStyle]}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.textInput}
                placeholder="위치 (예: 제주도, 경기도)"
                placeholderTextColor="#5C6366"
                value={location}
                onChangeText={setLocation}
                onFocus={() => glowIn(locationGlow)}
                onBlur={() => glowOut(locationGlow)}
                returnKeyType="next"
              />
            </Animated.View>

            <Animated.View style={[styles.inputRow, styles.memoRow, memoRowStyle]}>
              <Text style={[styles.inputIcon, styles.memoIcon]}>✏️</Text>
              <TextInput
                style={[styles.textInput, styles.memoInput]}
                placeholder="메모 (선택사항)"
                placeholderTextColor="#5C6366"
                value={memo}
                onChangeText={setMemo}
                onFocus={() => glowIn(memoGlow)}
                onBlur={() => glowOut(memoGlow)}
                multiline
                textAlignVertical="top"
                returnKeyType="default"
              />
            </Animated.View>
          </View>
        </View>
        </ScrollView>

        <Animated.View style={[styles.button, buttonAnimStyle]}>
          <Pressable style={styles.buttonPressable} onPress={handleNext} disabled={!isActivated}>
            <Text type="barlowHard" style={[styles.buttonText, !isActivated && styles.buttonTextInactive]}>
              {scores ? "결과 보기 →" : "다음 →"}
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0D0E",
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  glowOrbLeft: {
    position: "absolute",
    top: moderateScale(-60),
    left: moderateScale(-40),
    width: moderateScale(180),
    height: moderateScale(180),
    borderRadius: moderateScale(90),
    backgroundColor: "#22C783",
    opacity: 0.06,
  },
  glowOrbRight: {
    position: "absolute",
    top: moderateScale(-30),
    right: moderateScale(-50),
    width: moderateScale(160),
    height: moderateScale(160),
    borderRadius: moderateScale(80),
    backgroundColor: "#22C783",
    opacity: 0.04,
  },
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(14),
  },
  scrollContent: {
    flexGrow: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(24),
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  backButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#1F2528",
    backgroundColor: "#0A0D0F",
    justifyContent: "center",
    alignItems: "center",
  },
  statusDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    backgroundColor: "#22C783",
    shadowColor: "#22C783",
    shadowOpacity: 0.55,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    color: "#22C783",
    fontSize: moderateScale(FONT.xxs),
  },
  progressText: {
    color: "#22C783",
    fontSize: moderateScale(FONT.xs),
  },
  content: {
    flex: 1,
  },
  sectionLabel: {
    color: "#888888",
    fontSize: moderateScale(FONT.xs),
    marginBottom: moderateScale(8),
  },
  title: {
    color: "#F2F4F5",
    fontSize: moderateScale(FONT.h2),
    marginBottom: moderateScale(8),
  },
  subtitle: {
    color: "#6B7578",
    fontSize: moderateScale(FONT.xs),
    marginBottom: moderateScale(28),
  },
  inputGroup: {
    gap: moderateScale(10),
    marginHorizontal: moderateScale(-8),
    paddingHorizontal: moderateScale(8),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151919",
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#232828",
    paddingHorizontal: moderateScale(14),
    minHeight: moderateScale(52),
    shadowColor: "#22C783",
    shadowOpacity: 0,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  inputIcon: {
    fontSize: moderateScale(FONT.sm),
    marginRight: moderateScale(10),
  },
  textInput: {
    flex: 1,
    color: "#E4E8EA",
    fontSize: moderateScale(FONT.xs),
    paddingVertical: moderateScale(14),
  },
  memoRow: {
    alignItems: "flex-start",
    minHeight: moderateScale(110),
  },
  memoIcon: {
    marginTop: moderateScale(14),
  },
  memoInput: {
    minHeight: moderateScale(90),
    paddingTop: moderateScale(14),
  },
  button: {
    borderRadius: moderateScale(18),
    overflow: "hidden",
    marginTop: moderateScale(10),
  },
  buttonPressable: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(58),
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.md),
  },
  buttonTextInactive: {
    color: "#5C7A70",
  },
});
