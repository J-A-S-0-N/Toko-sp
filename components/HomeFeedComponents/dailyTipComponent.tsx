import { ThemedText } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { moderateScale } from 'react-native-size-matters';

const DAILY_TIPS = [
  '퍼팅 전에 목표 지점을 먼저 정하고 셋업하세요.',
  '백스윙과 팔로스루 길이를 비슷하게 맞춰보세요.',
  '손목 힘을 빼면 스트로크가 더 일정해집니다.',
  '공 뒤 20cm 지점에 중간 목표를 설정해보세요.',
  '오르막 퍼트는 평소보다 짧게 끊어 치지 마세요.',
  '내리막 퍼트는 스탠스를 조금 더 좁혀 안정감을 주세요.',
  '퍼팅 리듬을 일정하게 유지하는 것이 방향성의 핵심입니다.',
  '어깨로 스트로크하면 페이스 흔들림이 줄어듭니다.',
  '홀컵 반 바퀴 앞을 지나가게 치는 속도를 목표로 하세요.',
  '짧은 퍼트일수록 루틴을 더 간단하고 확실하게 가져가세요.',
  '퍼터 그립 압력은 10점 만점에 4~5 정도로 유지해보세요.',
  '발끝과 어깨 라인이 목표와 평행한지 먼저 확인하세요.',
  '퍼팅 전 한 번의 깊은 호흡이 긴장을 줄여줍니다.',
  '스트로크 시작을 급하게 하지 말고 템포를 지키세요.',
  '왼손(리드손)으로 방향, 오른손으로 거리감을 조절해보세요.',
  '거리 퍼트는 홀보다 라인 끝 지점에 시선을 두면 좋습니다.',
  '공의 로고를 목표선에 맞추면 정렬 실수가 줄어듭니다.',
  '실수 후에는 기술보다 리듬부터 다시 점검하세요.',
  '짧은 퍼트는 공 중심보다 약간 안쪽 이미지를 가지세요.',
  '긴 퍼트는 홀까지가 아닌 중간 지점 단위로 읽어보세요.',
  '같은 거리 연습을 반복하면 체감 거리가 빠르게 안정됩니다.',
  '퍼팅 자세에서는 시선이 공 바로 위에 오도록 맞추세요.',
  '그린 경사를 볼 때는 공 뒤와 홀 뒤를 모두 확인하세요.',
  '평평해 보이는 라인도 마지막 1m 경사를 꼭 읽으세요.',
  '바람보다 그린 경사와 속도 판단을 우선하세요.',
  '미스가 나면 헤드업 여부를 먼저 확인해보세요.',
  '클럽 헤드가 목표를 지나가도록 끝까지 밀어주세요.',
  '퍼팅은 강하게보다 정확한 라인과 일정한 속도가 중요합니다.',
  '홀컵을 정면으로 보며 한 번 더 라인을 이미지화해보세요.',
  '연습 스트로크 횟수는 항상 같게 유지하면 도움이 됩니다.',
  '발바닥 체중을 좌우 균등하게 두고 시작하세요.',
  '퍼트 전 루틴 시간을 일정하게 유지해 심박을 안정시키세요.',
  '짧은 오르막 퍼트는 컵 중앙을 강하게 공략해보세요.',
  '내리막에서는 폴로스루를 줄이고 부드럽게 맞춰보세요.',
  '퍼터 페이스 중앙에 맞추는 감각 연습을 자주 하세요.',
  '경사 심한 퍼트는 과감하게 바깥 라인을 선택해보세요.',
  '루틴 마지막 시선은 목표보다 공에 두는 편이 안정적입니다.',
  '실전에서는 새로운 그립보다 익숙한 감각을 우선하세요.',
  '퍼팅 감이 떨어질 땐 1m 직선 퍼트로 리셋하세요.',
  '좋은 퍼트는 결과보다 의도한 라인과 속도를 지킨 퍼트입니다.',
];

const ROTATE_MS = 10000;
const SLIDE_MS = 300;
const PAUSE_MS = 450;
const TIP_HEIGHT = moderateScale(40);
const TIP_GAP = moderateScale(20);

const DailyTipComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);

  const runTransition = useCallback(() => {
    if (isAnimatingRef.current || DAILY_TIPS.length < 2) {
      return;
    }

    const upcomingIndex = (currentIndex + 1) % DAILY_TIPS.length;
    setNextIndex(upcomingIndex);
    isAnimatingRef.current = true;
    progress.setValue(0);

    Animated.sequence([
      Animated.delay(PAUSE_MS),
      Animated.timing(progress, {
        toValue: 1,
        duration: SLIDE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex(upcomingIndex);
      setNextIndex(null);
      progress.setValue(0);
      isAnimatingRef.current = false;
    });
  }, [currentIndex, progress]);

  useEffect(() => {
    const intervalId = setInterval(runTransition, ROTATE_MS);
    return () => clearInterval(intervalId);
  }, [runTransition]);

  const tipTrackTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(TIP_HEIGHT + TIP_GAP)],
  });

  return (
    <LinearGradient
      colors={["#0D1B34", "#0B1A31", "#0A1629"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Text style={styles.tipIcon}>💡</Text>
        <ThemedText type="barlowLight" style={styles.headerText}>
          오늘의 팁 · 퍼팅 팁
        </ThemedText>
      </View>

      <View style={styles.tipViewport}>
        <Animated.View
          style={[
            styles.tipTrack,
            {
              transform: [{ translateY: tipTrackTranslateY }],
            },
          ]}
        >
          <ThemedText type="barlowLight" numberOfLines={2} style={styles.tipText}>
            {DAILY_TIPS[currentIndex]}
          </ThemedText>
          <ThemedText type="barlowLight" numberOfLines={2} style={styles.tipText}>
            {DAILY_TIPS[nextIndex ?? currentIndex]}
          </ThemedText>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    borderColor: "#173254",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginBottom: moderateScale(10),
  },
  tipIcon: {
    fontSize: moderateScale(FONT.sm),
    color: "#A8C5FF",
  },
  headerText: {
    color: "#A8C5FF",
    fontSize: moderateScale(FONT.sm),
  },
  tipText: {
    height: TIP_HEIGHT,
    color: "#F4F8FF",
    fontSize: moderateScale(FONT.sm),
    lineHeight: moderateScale(20),
    letterSpacing: -0.2,
  },
  tipViewport: {
    height: TIP_HEIGHT,
    overflow: "hidden",
    justifyContent: "flex-start",
  },
  tipTrack: {
    height: TIP_HEIGHT * 2 + TIP_GAP,
    gap: TIP_GAP,
  },
});

export default DailyTipComponent;
