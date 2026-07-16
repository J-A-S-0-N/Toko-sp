import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

const PHASES = [
  "신체 관절 추적",
  "백스윙 · 임팩트 분석",
  "밸런스 계산",
] as const;

export default function SwingLoadingScreen() {
  const router = useRouter();
  const { swingVideoId } = useLocalSearchParams<{ swingVideoId?: string }>();
  const [progress, setProgress] = React.useState(0);
  const [isDone, setIsDone] = React.useState(false);
  const [analysisStatus, setAnalysisStatus] = React.useState<string>("uploaded");
  const [analysisErrorMessage, setAnalysisErrorMessage] = React.useState<string>("");
  const ringProgress = useSharedValue(0);
  const hasNavigatedRef = React.useRef(false);

  React.useEffect(() => {
    ringProgress.value = withRepeat(
      withTiming(1, {
        duration: 1800,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      false,
    );
  }, [ringProgress]);

  React.useEffect(() => {
    if (!swingVideoId) {
      setIsDone(true);
      return;
    }

    const swingVideoRef = doc(db, "SwingVideos", swingVideoId);
    const unsubscribe = onSnapshot(swingVideoRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      const status = typeof data?.status === "string" ? data.status : "uploaded";
      setAnalysisStatus(status);
      setAnalysisErrorMessage(
        typeof data?.analysisErrorMessage === "string" ? data.analysisErrorMessage : ""
      );

      if (data?.status === "done") {
        setIsDone(true);
      }
    });

    return () => unsubscribe();
  }, [swingVideoId]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const cap = isDone ? 100 : 95;
        const step = isDone ? 4 : 2;
        const next = Math.min(prev + step, cap);
        if (isDone && next >= 100 && !hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          clearInterval(interval);
          setTimeout(() => {
            router.replace({
              pathname: "./result",
              params: {
                swingVideoId,
              },
            });
          }, 400);
        }
        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isDone, router, swingVideoId]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringProgress.value * 360}deg` }],
  }));

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        <Text type="barlowHard" style={styles.topTitle}>
          AI 분석 중
        </Text>

        <View style={styles.ringWrap}>
          <View style={styles.ringTrack}>
            <Animated.View style={[styles.ringArc, ringStyle]} />
          </View>
        </View>

        <Text type="barlowHard" style={styles.mainTitle}>
          스윙을 분석하고 있어요
        </Text>
        <Text type="barlowLight" style={styles.subtitle}>
          몸의 주요 관절 움직임과 스윙 템포를 비교하고 있습니다.
        </Text>

        {analysisStatus === "analyzing" ? (
          <Text type="barlowLight" style={styles.statusText}>
            분석 중
          </Text>
        ) : null}

        {analysisStatus === "error" && analysisErrorMessage ? (
          <Text type="barlowLight" style={styles.errorText}>
            {analysisErrorMessage}
          </Text>
        ) : null}

        <View style={styles.phaseCard}>
          {PHASES.map((phase, idx) => {
            const phaseThreshold = Math.round(((idx + 1) / PHASES.length) * 100);
            const done = progress >= phaseThreshold;
            const active = !done && progress >= phaseThreshold - 30;

            return (
              <View key={phase} style={[styles.phaseRow, idx === PHASES.length - 1 && styles.phaseRowLast]}>
                <Text type="barlowLight" style={styles.phaseLabel}>
                  {phase}
                </Text>
                <Text
                  type="barlowHard"
                  style={[
                    styles.phaseStatus,
                    done && styles.phaseStatusDone,
                    active && styles.phaseStatusActive,
                  ]}
                >
                  {done ? "완료" : active ? "분석 중" : "대기"}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020A09",
  },
  container: {
    flex: 1,
    backgroundColor: "#020A09",
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(18),
  },
  topTitle: {
    color: "#EFF5F2",
    textAlign: "center",
    fontSize: moderateScale(FONT.xl),
    marginBottom: moderateScale(30),
  },
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(34),
  },
  ringTrack: {
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(100),
    borderWidth: moderateScale(10),
    borderColor: "#102523",
    alignItems: "center",
    justifyContent: "center",
  },
  ringArc: {
    position: "absolute",
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(100),
    borderWidth: moderateScale(10),
    borderColor: "transparent",
    borderTopColor: "#12E1A0",
    borderRightColor: "#12E1A0",
  },
  mainTitle: {
    color: "#F4F8F6",
    fontSize: moderateScale(FONT.xl),
    textAlign: "left",
    marginBottom: moderateScale(8),
  },
  subtitle: {
    color: "#94A5A1",
    fontSize: moderateScale(FONT.xs),
    fontFamily: "Pretendard-Regular",
    marginBottom: moderateScale(24),
  },
  statusText: {
    color: "#E5EFEC",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(8),
    fontFamily: "Pretendard-Regular",
  },
  errorText: {
    color: "#FF8F8F",
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(12),
    fontFamily: "Pretendard-Regular",
  },
  phaseCard: {
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#1A302C",
    backgroundColor: "#071310",
    overflow: "hidden",
  },
  phaseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(18),
    borderBottomWidth: 1,
    borderBottomColor: "#152522",
  },
  phaseRowLast: {
    borderBottomWidth: 0,
  },
  phaseLabel: {
    color: "#E7EEEB",
    fontSize: moderateScale(FONT.sm),
    fontFamily: "Pretendard-Regular",
  },
  phaseStatus: {
    color: "#5F6E69",
    fontSize: moderateScale(FONT.sm),
  },
  phaseStatusDone: {
    color: "#12E3A2",
  },
  phaseStatusActive: {
    color: "#E7EFEC",
  },
});
