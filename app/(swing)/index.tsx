import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import Feather from "@expo/vector-icons/Feather";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    View
} from "react-native";
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
  const [cameraFacing, setCameraFacing] = React.useState<"back" | "front">("back");
  const [isFlashOn, setIsFlashOn] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPickingFromLibrary, setIsPickingFromLibrary] = React.useState(false);
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

      const duration = Math.max(elapsedSecondsRef.current, 0.2);
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

  const handlePickVideoFromLibrary = async () => {
    if (isRecording || isPickingFromLibrary) return;

    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("권한 필요", "갤러리에서 영상을 가져오려면 사진 보관함 권한이 필요합니다.");
      return;
    }

    setIsPickingFromLibrary(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) return;
      const selected = result.assets[0];
      if (!selected?.uri) {
        Alert.alert("선택 실패", "선택한 영상을 불러오지 못했어요. 다시 시도해주세요.");
        return;
      }

      const pickedDurationSec = (selected.duration ?? 0) / 1000;
      const durationSec = pickedDurationSec > 0 ? pickedDurationSec : 6;
      routeToTrim(durationSec, selected.uri);
    } catch {
      Alert.alert("선택 실패", "영상 선택 중 문제가 발생했어요. 다시 시도해주세요.");
    } finally {
      setIsPickingFromLibrary(false);
    }
  };

  const modeLabel = cameraFacing === "back" ? "후면" : "전면";

  return (
    <View style={styles.safeArea}>
      <LinearGradient
        colors={["#1C4F39", "#103626", "#061A13"]}
        style={styles.container}
      >
        {permission?.granted && (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={cameraFacing}
            enableTorch={isFlashOn}
            mode="video"
            mute
          />
        )}

        <View pointerEvents="none" style={styles.captureDarkOverlay} />

        <View pointerEvents="none" style={styles.gridOverlay}>
          <View style={[styles.gridLineVertical, styles.gridVerticalOne]} />
          <View style={[styles.gridLineVertical, styles.gridVerticalTwo]} />
          <View style={[styles.gridLineHorizontal, styles.gridHorizontalOne]} />
          <View style={[styles.gridLineHorizontal, styles.gridHorizontalTwo]} />
        </View>

        <View style={[styles.headerRow, { paddingTop: insets.top + moderateScale(6) }]}>
          <Pressable style={styles.topIconButton} onPress={() => router.back()}>
            <Feather name="x" size={moderateScale(24)} color="#E7F0EC" />
          </Pressable>

          <View style={styles.modeChip}>
            <Text type="barlowHard" style={styles.modeChipText}>
              {isRecording
                ? `${formatDuration(elapsedSeconds)} · 촬영 중`
                : `${modeLabel} · 전신 모드`}
            </Text>
          </View>

          <Pressable style={styles.topIconButton} onPress={() => setIsFlashOn((prev) => !prev)}>
            <Feather
              name={isFlashOn ? "zap" : "zap-off"}
              size={moderateScale(18)}
              color={isFlashOn ? "#F4FF6E" : "#D8E2DC"}
            />
          </Pressable>
        </View>

        <View style={styles.centerGuideWrap} pointerEvents="none">
          <View style={styles.guideFrame}>
          </View>

          <Text type="barlowHard" style={styles.guideText}>
            몸 전체가 가이드 안에 들어오게 해주세요
          </Text>
        </View>

        <View style={styles.bottomControlsWrap}>
          <View style={styles.bottomControlsRow}>
            <Pressable style={styles.sideControlButton} onPress={() => void handlePickVideoFromLibrary()}>
              <Feather name="image" size={moderateScale(18)} color="#AAB6B0" />
            </Pressable>

            <Pressable
              onPress={handleCapturePress}
              style={[styles.captureButton, isRecording && styles.captureButtonActive]}
            >
              <View style={[styles.captureButtonInner, isRecording && styles.captureButtonInnerActive]} />
            </Pressable>

            <Pressable
              style={styles.sideControlButton}
              onPress={() => setCameraFacing((prev) => (prev === "back" ? "front" : "back"))}
            >
              <Feather name="refresh-cw" size={moderateScale(18)} color="#E7F0EC" />
            </Pressable>
          </View>
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
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#061A13",
  },
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 5,
  },
  topIconButton: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: "rgba(8, 26, 20, 0.58)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeChip: {
    minHeight: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "rgba(10, 39, 29, 0.66)",
    paddingHorizontal: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  modeChipText: {
    color: "#F5FAF7",
    fontSize: moderateScale(FONT.xxs),
  },
  captureDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 12, 9, 0.28)",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  gridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(139, 180, 161, 0.08)",
  },
  gridVerticalOne: {
    left: "33%",
  },
  gridVerticalTwo: {
    left: "66%",
  },
  gridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(139, 180, 161, 0.08)",
  },
  gridHorizontalOne: {
    top: "33%",
  },
  gridHorizontalTwo: {
    top: "66%",
  },
  centerGuideWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: moderateScale(42),
    zIndex: 3,
  },
  guideFrame: {
    width: moderateScale(244),
    height: moderateScale(520),
    borderRadius: moderateScale(120),
    borderWidth: 2,
    borderColor: "rgba(206, 219, 213, 0.74)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  silhouetteHead: {
    position: "absolute",
    top: moderateScale(138),
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: "rgba(203, 214, 208, 0.54)",
  },
  silhouetteBody: {
    position: "absolute",
    top: moderateScale(182),
    width: moderateScale(68),
    height: moderateScale(168),
    borderRadius: moderateScale(34),
    backgroundColor: "rgba(203, 214, 208, 0.54)",
  },
  silhouetteLeg: {
    position: "absolute",
    bottom: moderateScale(54),
    width: moderateScale(28),
    height: moderateScale(200),
    borderRadius: moderateScale(14),
    backgroundColor: "rgba(203, 214, 208, 0.54)",
  },
  silhouetteLegLeft: {
    left: moderateScale(68),
    transform: [{ rotate: "4deg" }],
  },
  silhouetteLegRight: {
    left: moderateScale(114),
    transform: [{ rotate: "-4deg" }],
  },
  silhouetteClub: {
    position: "absolute",
    left: moderateScale(-56),
    bottom: moderateScale(60),
    width: moderateScale(30),
    height: moderateScale(228),
    borderRadius: moderateScale(16),
    backgroundColor: "rgba(203, 214, 208, 0.48)",
    transform: [{ rotate: "-4deg" }],
  },
  guideText: {
    color: "rgba(231, 240, 236, 0.9)",
    fontSize: moderateScale(FONT.xxxs),
    textAlign: "center",
    marginTop: moderateScale(20),
    fontFamily: "Pretendard-SemiBold",
  },
  bottomControlsWrap: {
    paddingBottom: moderateScale(15),
    zIndex: 5,
  },
  bottomControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(12),
  },
  sideControlButton: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(20),
    backgroundColor: "rgba(2, 16, 12, 0.66)",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionFallbackWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(20),
    gap: moderateScale(12),
    backgroundColor: "rgba(2,10,9,0.58)",
    zIndex: 8,
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
  captureButton: {
    width: moderateScale(65),
    height: moderateScale(65),
    borderRadius: moderateScale(100),
    borderWidth: 3,
    borderColor: "#F1F4F2",
    backgroundColor: "#0D1815",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonActive: {
    backgroundColor: "#13241E",
  },
  captureButtonInner: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(38),
    backgroundColor: "#D5F85A",
  },
  captureButtonInnerActive: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(8),
    backgroundColor: "#D5F85A",
  },
});
