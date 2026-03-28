import { ThemedText as Text } from "@/components/themed-text";
import Feather from "@expo/vector-icons/Feather";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

export default function CaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView>(null);
  const { holes, shotIndex, photos } = useLocalSearchParams<{
    holes?: string;
    shotIndex?: string;
    photos?: string;
  }>();
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

  const toggledText = [
    "빛 반사를 피해 살짝 각도를 조절해 보세요",
    "밝은 곳에서 촬영하면 인식률이 높아져요",
    "원형 카드 전체를 동그라미 안에 맞추세요",
  ];
  const [currentTipIndex, setCurrentTipIndex] = React.useState(0);
  const [isFlashOn, setFlashOn] = React.useState(false);
  const [isCapturing, setIsCapturing] = React.useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync();
      if (!photo?.uri) return;

      const updatedPhotos = [...parsedPhotos, photo.uri];

      router.push({
        pathname: "./preview",
        params: {
          photoUri: photo.uri,
          holes,
          shotIndex: String(currentShotIndex),
          photos: JSON.stringify(updatedPhotos),
        },
      });
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % toggledText.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [toggledText.length]);

  if (!permission) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Text type="barlowLight" style={styles.permissionText}>
            카메라 권한을 확인 중입니다...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Text type="barlowLight" style={styles.permissionText}>
            스캔을 위해 카메라 권한이 필요해요
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text type="barlowHard" style={styles.permissionButtonText}>
              권한 허용하기
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={isFlashOn}
        />

        {/* 
        <Text type="barlowLight" style={styles.helperText}>
          원형 스코어카드를 안에 맞춰주세요
        </Text>
        */}

        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Feather name="x" size={moderateScale(20)} color="#D4D9DB" />
          </Pressable>

          <Text type="barlowHard" style={styles.titleText}>
            스캔
          </Text>

          <Pressable style={styles.iconButton} onPress={() => setFlashOn(!isFlashOn)}>
            <Feather
              name={isFlashOn ? "zap" : "zap-off"}
              size={moderateScale(18)}
              color={isFlashOn ? "#D4D9DB" : "#8E9498"}
            />
          </Pressable>
        </View>

        <View style={styles.circleArea}>
          <View style={styles.scanCircle} />
        </View>

        <View style={styles.bottomArea}>
          <View style={styles.tipRow}>
            <Animated.View 
                style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(6) }}
                key={currentTipIndex}
                entering={FadeInUp.duration(300)}
                exiting={FadeOutDown.duration(300)}
            >
                <Feather name="sun" size={moderateScale(12)} color="#C9CED1" />
                <Text type="barlowLight" style={styles.tipText}>
                    {toggledText[currentTipIndex]}
                </Text>

            </Animated.View>
          </View>

          <View style={styles.controlsRow}>
            <Pressable style={styles.sideActionButton}>
              <Feather name="image" size={moderateScale(18)} color="#D6DBDE" />
            </Pressable>

            <Pressable style={styles.captureButton} onPress={handleCapture} disabled={isCapturing}>
              <View style={styles.captureButtonInner} />
            </Pressable>

            <Pressable style={styles.sideActionButton}>
              <Feather name="refresh-cw" size={moderateScale(18)} color="#D6DBDE" />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020405",
  },
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(14),
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(24),
    gap: moderateScale(12),
  },
  permissionText: {
    color: "#D4D9DB",
    textAlign: "center",
    fontSize: moderateScale(14),
  },
  permissionButton: {
    borderWidth: 1,
    borderColor: "#2A3134",
    backgroundColor: "#0E1214",
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(18),
  },
  permissionButtonText: {
    color: "#E9ECEE",
    fontSize: moderateScale(13),
  },
  helperText: {
    textAlign: "center",
    color: "#A8AFB3",
    fontSize: moderateScale(11),
    marginTop: moderateScale(4),
  },
  headerRow: {
    marginTop: moderateScale(18),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  titleText: {
    fontSize: moderateScale(20),
    color: "#E9ECEE",
    letterSpacing: moderateScale(0.5),
  },
  circleArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanCircle: {
    width: "95%",
    aspectRatio: 1,
    borderRadius: moderateScale(157.5),
    borderWidth: 1,
    borderStyle: "dotted",
    borderColor: "#7FA4A0",
    backgroundColor: "transparent",
  },
  bottomArea: {
    paddingBottom: moderateScale(12),
    gap: moderateScale(22),
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
  },
  tipText: {
    color: "#C9CED1",
    fontSize: moderateScale(12),
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(12),
    marginBottom: moderateScale(4),
  },
  sideActionButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#20272A",
    backgroundColor: "#0E1214",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: moderateScale(74),
    height: moderateScale(74),
    borderRadius: moderateScale(37),
    borderWidth: 2,
    borderColor: "#B2EAD7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6FE1B7",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  captureButtonInner: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: "#53B88F",
  },
});
