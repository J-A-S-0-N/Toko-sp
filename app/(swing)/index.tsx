import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import Feather from "@expo/vector-icons/Feather";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function SwingCaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView>(null);
  const elapsedSecondsRef = React.useRef(0);
  const [isFlashOn, setIsFlashOn] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  React.useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  React.useEffect(() => {
    if (!isRecording) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const routeToTrim = (duration: number, videoUri: string) => {
    router.push({
      pathname: "./trim",
      params: {
        duration: String(duration),
        videoUri,
      },
    });
  };

  const handleStartRecording = async () => {
    if (!permission?.granted) {
      Alert.alert("권한 필요", "스윙 촬영을 위해 카메라 권한이 필요합니다.");
      await requestPermission();
      return;
    }

    if (!cameraRef.current || isRecording) return;

    try {
      setElapsedSeconds(0);
      setIsRecording(true);

      const recordPromise = cameraRef.current.recordAsync({
        maxDuration: 20,
      }) as Promise<{ uri: string } | undefined>;

      const video = await recordPromise;
      if (!video?.uri) {
        Alert.alert("촬영 실패", "영상 파일을 찾을 수 없어요. 다시 촬영해주세요.");
        return;
      }

      const duration = Math.max(elapsedSecondsRef.current, 5);
      routeToTrim(duration, video.uri);
    } catch {
      Alert.alert("촬영 실패", "촬영 중 문제가 발생했어요. 다시 시도해주세요.");
    } finally {
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (!isRecording) return;
    cameraRef.current?.stopRecording();
  };

  const handleCapturePress = () => {
    if (!isRecording) {
      void handleStartRecording();
      return;
    }

    handleStopRecording();
  };

  return (
    <View style={styles.safeArea}>
      <LinearGradient
        colors={["#03110F", "#020A09", "#010605"]}
        style={[styles.container, { paddingTop: moderateScale(8) + insets.top }]}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={moderateScale(20)} color="#DDE4E2" />
          </Pressable>

          <Text type="barlowHard" style={styles.headerTitle}>
            스윙 촬영
          </Text>

          <Pressable style={styles.iconButton} onPress={() => setIsFlashOn((prev) => !prev)}>
            <Feather
              name={isFlashOn ? "zap" : "zap-off"}
              size={moderateScale(18)}
              color={isFlashOn ? "#12E5A1" : "#A8B4B0"}
            />
          </Pressable>
        </View>

        <View style={styles.captureCard}>
          {permission?.granted && (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={isFlashOn}
              mode="video"
              mute
            />
          )}
          <View pointerEvents="none" style={styles.captureDarkOverlay} />

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isRecording && styles.statusDotRecording]} />
            <Text type="barlowHard" style={styles.statusLabel}>
              {isRecording ? "촬영 중" : "준비"}
            </Text>
          </View>

          <View pointerEvents="none" style={styles.guideFrame}>
            <View style={[styles.guideCorner, styles.guideCornerTopLeft]} />
            <View style={[styles.guideCorner, styles.guideCornerTopRight]} />
            <View style={[styles.guideCorner, styles.guideCornerBottomLeft]} />
            <View style={[styles.guideCorner, styles.guideCornerBottomRight]} />
          </View>

          <Text pointerEvents="none" type="barlowLight" style={styles.guideText}>
            {isRecording ? `${formatDuration(elapsedSeconds)} · 스윙 동작을 끝까지 촬영해주세요` : "전신이 화면 안에 들어오도록 맞춰주세요"}
          </Text>

          <View style={styles.captureButtonRow}>
            <Pressable
              onPress={handleCapturePress}
              style={[styles.captureButton, isRecording && styles.captureButtonActive]}
            >
              <View style={[styles.captureButtonInner, isRecording && styles.captureButtonInnerActive]} />
            </Pressable>
          </View>

          {!permission?.granted && (
            <View style={styles.permissionFallbackWrap}>
              <Text type="barlowLight" style={styles.permissionFallbackText}>
                {permission ? "카메라 권한을 허용하면 실시간 촬영 화면이 보여요" : "카메라 권한을 확인 중입니다..."}
              </Text>
              {!!permission && !permission.granted && (
                <Pressable style={styles.permissionButton} onPress={() => void requestPermission()}>
                  <Text type="barlowHard" style={styles.permissionButtonText}>
                    권한 허용하기
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
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
    paddingBottom: moderateScale(16),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(18),
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
    fontSize: moderateScale(FONT.lg),
    color: "#EFF4F1",
  },
  captureCard: {
    flex: 1,
    borderRadius: moderateScale(28),
    borderWidth: 1,
    borderColor: "#14302B",
    backgroundColor: "#0A1412",
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(20),
    overflow: "hidden",
  },
  captureDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 10, 9, 0.35)",
  },
  statusRow: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "rgba(45, 63, 58, 0.9)",
    backgroundColor: "rgba(1, 12, 10, 0.75)",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    zIndex: 2,
  },
  statusDot: {
    width: moderateScale(9),
    height: moderateScale(9),
    borderRadius: moderateScale(10),
    backgroundColor: "#FF5C5C",
    marginRight: moderateScale(6),
  },
  statusDotRecording: {
    backgroundColor: "#12E5A1",
  },
  statusLabel: {
    fontSize: moderateScale(FONT.xxs),
    color: "#EAF0ED",
  },
  guideFrame: {
    flex: 1,
    marginTop: moderateScale(14),
    marginBottom: moderateScale(10),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  guideCorner: {
    position: "absolute",
    width: moderateScale(28),
    height: moderateScale(28),
    borderColor: "#0EE0B0",
  },
  guideCornerTopLeft: {
    top: moderateScale(20),
    left: moderateScale(16),
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: moderateScale(10),
  },
  guideCornerTopRight: {
    top: moderateScale(20),
    right: moderateScale(16),
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: moderateScale(10),
  },
  guideCornerBottomLeft: {
    bottom: moderateScale(20),
    left: moderateScale(16),
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: moderateScale(10),
  },
  guideCornerBottomRight: {
    bottom: moderateScale(20),
    right: moderateScale(16),
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: moderateScale(10),
  },
  guideText: {
    color: "#C6D0CC",
    fontSize: moderateScale(FONT.xxs),
    textAlign: "center",
    fontFamily: "Pretendard-Regular",
    paddingHorizontal: moderateScale(12),
    marginBottom: moderateScale(14),
    zIndex: 2,
  },
  permissionFallbackWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(20),
    gap: moderateScale(12),
    backgroundColor: "rgba(2,10,9,0.45)",
    zIndex: 4,
  },
  permissionFallbackText: {
    color: "#C6D0CC",
    fontSize: moderateScale(FONT.xs),
    textAlign: "center",
    fontFamily: "Pretendard-Regular",
  },
  permissionButton: {
    minHeight: moderateScale(44),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#2A5A50",
    backgroundColor: "rgba(7,27,23,0.9)",
    paddingHorizontal: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  permissionButtonText: {
    color: "#D8EEE7",
    fontSize: moderateScale(FONT.xxs),
  },
  captureButtonRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(2),
    marginBottom: moderateScale(2),
    zIndex: 2,
  },
  captureButton: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonActive: {
    backgroundColor: "#F4FFF9",
  },
  captureButtonInner: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D5DAD8",
  },
  captureButtonInnerActive: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    borderColor: "#0D1A17",
    backgroundColor: "#0E1D19",
  },
});
