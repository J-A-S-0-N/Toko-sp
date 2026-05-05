import { getCurrentUid } from '@/app/(auth)/functions/loginFetchUserFunction';
import { db } from '@/config/firebase';
import { FONT } from '@/constants/theme';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { moderateScale } from 'react-native-size-matters';

import { ThemedText as Text } from '@/components/themed-text';

const POPULAR_CITIES = [
  '서울', '부산', '인천', '대구', '대전',
  '광주', '수원', '제주', '울산', '창원',
];

const ALL_CITIES = [
  '서울', '부산', '인천', '대구', '대전', '광주', '울산', '세종',
  '수원', '고양', '성남', '용인', '부천', '안산', '안양', '남양주',
  '화성', '평택', '의정부', '시흥', '파주', '김포', '광명', '군포',
  '이천', '오산', '하남', '구리', '양주', '안성', '포천', '의왕',
  '여주', '동두천', '과천',
  '청주', '충주', '제천',
  '천안', '아산', '서산', '논산', '계룡', '당진', '공주', '보령',
  '전주', '익산', '군산', '정읍', '남원', '김제',
  '여수', '순천', '목포', '광양', '나주',
  '포항', '경주', '구미', '안동', '영주', '영천', '상주', '문경', '경산',
  '창원', '진주', '김해', '거제', '양산', '통영', '사천', '밀양', '의령',
  '제주', '서귀포',
  '춘천', '원주', '강릉', '동해', '태백', '속초', '삼척',
];

const GPS_NORMALIZE_MAP: Record<string, string> = {
  '서울특별시': '서울', '서울시': '서울', 'Seoul': '서울',
  '부산광역시': '부산', '부산시': '부산', 'Busan': '부산',
  '인천광역시': '인천', '인천시': '인천', 'Incheon': '인천',
  '대구광역시': '대구', '대구시': '대구', 'Daegu': '대구',
  '대전광역시': '대전', '대전시': '대전', 'Daejeon': '대전',
  '광주광역시': '광주', 'Gwangju': '광주',
  '울산광역시': '울산', '울산시': '울산', 'Ulsan': '울산',
  '세종특별자치시': '세종', '세종시': '세종', 'Sejong': '세종',
  '수원시': '수원', 'Suwon': '수원',
  '고양시': '고양', 'Goyang': '고양',
  '성남시': '성남', 'Seongnam': '성남',
  '용인시': '용인', 'Yongin': '용인',
  '부천시': '부천', 'Bucheon': '부천',
  '안산시': '안산', 'Ansan': '안산',
  '안양시': '안양', 'Anyang': '안양',
  '남양주시': '남양주', 'Namyangju': '남양주',
  '화성시': '화성', 'Hwaseong': '화성',
  '평택시': '평택', 'Pyeongtaek': '평택',
  '의정부시': '의정부', 'Uijeongbu': '의정부',
  '시흥시': '시흥', 'Siheung': '시흥',
  '파주시': '파주', 'Paju': '파주',
  '김포시': '김포', 'Gimpo': '김포',
  '광명시': '광명', 'Gwangmyeong': '광명',
  '군포시': '군포', 'Gunpo': '군포',
  '이천시': '이천', 'Icheon': '이천',
  '오산시': '오산', 'Osan': '오산',
  '하남시': '하남', 'Hanam': '하남',
  '구리시': '구리', 'Guri': '구리',
  '양주시': '양주', 'Yangju': '양주',
  '안성시': '안성', 'Anseong': '안성',
  '포천시': '포천', 'Pocheon': '포천',
  '의왕시': '의왕', 'Uiwang': '의왕',
  '여주시': '여주', 'Yeoju': '여주',
  '동두천시': '동두천', 'Dongducheon': '동두천',
  '과천시': '과천', 'Gwacheon': '과천',
  '청주시': '청주', 'Cheongju': '청주',
  '충주시': '충주', 'Chungju': '충주',
  '제천시': '제천', 'Jecheon': '제천',
  '천안시': '천안', 'Cheonan': '천안',
  '아산시': '아산', 'Asan': '아산',
  '서산시': '서산', 'Seosan': '서산',
  '논산시': '논산', 'Nonsan': '논산',
  '계룡시': '계룡', 'Gyeryong': '계룡',
  '당진시': '당진', 'Dangjin': '당진',
  '공주시': '공주', 'Gongju': '공주',
  '보령시': '보령', 'Boryeong': '보령',
  '전주시': '전주', 'Jeonju': '전주',
  '익산시': '익산', 'Iksan': '익산',
  '군산시': '군산', 'Gunsan': '군산',
  '정읍시': '정읍', 'Jeongeup': '정읍',
  '남원시': '남원', 'Namwon': '남원',
  '김제시': '김제', 'Gimje': '김제',
  '여수시': '여수', 'Yeosu': '여수',
  '순천시': '순천', 'Suncheon': '순천',
  '목포시': '목포', 'Mokpo': '목포',
  '광양시': '광양', 'Gwangyang': '광양',
  '나주시': '나주', 'Naju': '나주',
  '포항시': '포항', 'Pohang': '포항',
  '경주시': '경주', 'Gyeongju': '경주',
  '구미시': '구미', 'Gumi': '구미',
  '안동시': '안동', 'Andong': '안동',
  '영주시': '영주', 'Yeongju': '영주',
  '영천시': '영천', 'Yeongcheon': '영천',
  '상주시': '상주', 'Sangju': '상주',
  '문경시': '문경', 'Mungyeong': '문경',
  '경산시': '경산', 'Gyeongsan': '경산',
  '창원시': '창원', 'Changwon': '창원',
  '진주시': '진주', 'Jinju': '진주',
  '김해시': '김해', 'Gimhae': '김해',
  '거제시': '거제', 'Geoje': '거제',
  '양산시': '양산', 'Yangsan': '양산',
  '통영시': '통영', 'Tongyeong': '통영',
  '사천시': '사천', 'Sacheon': '사천',
  '밀양시': '밀양', 'Miryang': '밀양',
  '의령군': '의령',
  '제주시': '제주', 'Jeju': '제주', '제주특별자치도': '제주', '제주도': '제주',
  '서귀포시': '서귀포', 'Seogwipo': '서귀포',
  '춘천시': '춘천', 'Chuncheon': '춘천',
  '원주시': '원주', 'Wonju': '원주',
  '강릉시': '강릉', 'Gangneung': '강릉',
  '동해시': '동해', 'Donghae': '동해',
  '태백시': '태백', 'Taebaek': '태백',
  '속초시': '속초', 'Sokcho': '속초',
  '삼척시': '삼척', 'Samcheok': '삼척',
};

const normalizeCity = (raw: string): string | null => {
  const direct = GPS_NORMALIZE_MAP[raw];
  if (direct) return direct;
  if (ALL_CITIES.includes(raw)) return raw;
  return null;
};

export default function LocationSetupScreen() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);

  // Animation values
  const buttonAnimation = useSharedValue(0);
  const checkmarkOpacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0.6);
  const rotation = useSharedValue(0);

  const isNextEnabled = selectedLocation !== null || isUsingCurrentLocation || detected !== null;

  const handleNext = async () => {
    if (!isNextEnabled) return;
    const uid = getCurrentUid();
    if (uid && selectedLocation) {
      try {
        await updateDoc(doc(db, 'Users', uid), { city: selectedLocation });
      } catch (e) {
        console.error('Failed to save city:', e);
      }
    }
    router.push('/(auth)/courseSelection');
  };

  const handleCancelDetection = () => {
    setDetecting(false);
    setDetected(null);
    rotation.value = 0;
  };

  const handleCurrentLocation = async () => {
    setDetecting(true);
    setDetected(null);
    setIsUsingCurrentLocation(false);
    setSelectedLocation(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const geocoded = await Location.reverseGeocodeAsync(location.coords);
        
        const rawCity = geocoded[0]?.city ?? geocoded[0]?.region ?? null;
        const normalized = rawCity ? normalizeCity(rawCity) : null;

        if (normalized) {
          setDetected(normalized);
          setSelectedLocation(normalized);
          setIsUsingCurrentLocation(true);
        } else {
          throw new Error('No matching city');
        }
      } else {
        throw new Error('Permission denied');
      }
    } catch (error) {
      setTimeout(() => {
        setDetecting(false);
      }, 1000);
      return;
    }

    setDetecting(false);
  };

  // Start spinner animation when detecting
  useEffect(() => {
    if (detecting) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 900, easing: Easing.linear }),
        -1
      );
    } else {
      rotation.value = 0;
    }
  }, [detecting]);

  // Animate button when detected
  useEffect(() => {
    if (detected) {
      buttonAnimation.value = withTiming(1, { duration: 300 });
      checkmarkOpacity.value = withTiming(1, { duration: 250 });
      checkmarkScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      buttonAnimation.value = withTiming(0, { duration: 300 });
      checkmarkOpacity.value = withTiming(0, { duration: 250 });
      checkmarkScale.value = withTiming(0.6, { duration: 250 });
    }
  }, [detected]);

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: detected 
      ? `rgba(76, 175, 130, ${0.1 * buttonAnimation.value})`
      : '#1F2222',
    borderColor: detected 
      ? `rgba(76, 175, 130, ${buttonAnimation.value})`
      : 'rgba(255, 255, 255, 0.07)',
  }));

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkmarkOpacity.value,
    transform: [{ scale: checkmarkScale.value }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleCitySelect = (city: string) => {
    setSelectedLocation(city);
    setIsUsingCurrentLocation(false);
    setDetected(null);
    setDetecting(false);
    rotation.value = 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerWrap}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={styles.progressRow}>
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment]} />
          </View>
        </View>

        <View style={styles.body}>
          <Text type="barlowHard" style={styles.title}>
            주로 어디서 치세요?
          </Text>
          <Text style={styles.subtitle}>
            근처 코스 추천에 사용됩니다
          </Text>

          {/* Use Current Location Button */}
          <Animated.View style={[styles.locationButton, buttonAnimatedStyle]}>
            <Pressable 
              style={styles.locationButtonPressable} 
              onPress={detecting ? handleCancelDetection : handleCurrentLocation}
            >
              <View style={styles.locationButtonContent}>
                <View style={styles.iconContainer}>
                  {!detecting && !detected && (
                    <Text style={styles.locationIcon}>📍</Text>
                  )}
                  {detecting && (
                    <View style={styles.spinnerContainer}>
                      <View style={styles.spinnerRing} />
                      <Animated.View style={[styles.spinnerArc, spinStyle]} />
                    </View>
                  )}
                  {!detecting && detected && (
                    <Text style={styles.locationIcon}>📍</Text>
                  )}
                </View>
                <View style={styles.locationText}>
                  <Text style={styles.locationTitle}>
                    {detected ? detected : '현재 위치 사용'}
                  </Text>
                  <Text style={styles.locationSubtitle}>
                    {detecting ? '위치 감지 중...' : 'GPS로 자동 감지'}
                  </Text>
                </View>
                <Animated.View style={[styles.checkmarkContainer, checkmarkAnimatedStyle]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </Animated.View>
              </View>
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는 직접 입력</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="도시 검색..."
              placeholderTextColor="#6A7278"
              style={styles.searchInput}
              selectionColor="#4FB78A"
            />
          </View>

          {/* Cities Grid */}
          <View style={styles.citiesGrid}>
            {(searchQuery.trim() === ''
              ? POPULAR_CITIES
              : ALL_CITIES.filter((city) => city.includes(searchQuery.trim()))
            ).map((city) => {
              const isSelected = selectedLocation === city;
              return (
                <Pressable
                  key={city}
                  style={[
                    styles.cityButton,
                    isSelected && styles.cityButtonSelected
                  ]}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text style={[
                    styles.cityButtonText,
                    isSelected && styles.cityButtonTextSelected
                  ]}>
                    {city}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.nextButton, !isNextEnabled && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!isNextEnabled}
      >
        <Text style={[styles.nextText, !isNextEnabled && styles.nextTextDisabled]}>다음</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05080B',
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(28),
  },
  content: {
    flex: 1,
  },
  headerWrap: {
    gap: moderateScale(18),
  },
  iconButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#E6ECEF',
    fontSize: moderateScale(FONT.xl),
    fontFamily: 'Pretendard-Bold',
  },
  progressRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 99,
    backgroundColor: '#1B2126',
  },
  progressSegmentActive: {
    backgroundColor: '#4FB78A',
  },
  body: {
    marginTop: moderateScale(28),
  },
  title: {
    color: '#F4F7F6',
    fontSize: moderateScale(FONT.xl),
  },
  subtitle: {
    marginTop: moderateScale(6),
    color: '#656D73',
    fontSize: moderateScale(FONT.xs),
    fontFamily: 'Pretendard-Regular',
  },
  locationButton: {
    marginTop: moderateScale(26),
    minHeight: moderateScale(64),
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#13191F',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  locationButtonPressable: {
    flex: 1,
  },
  locationButtonSelected: {
    borderColor: '#4FB78A',
    backgroundColor: '#1A2F27',
  },
  locationButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    gap: moderateScale(12),
  },
  iconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(76, 175, 130, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: moderateScale(FONT.sm),
  },
  spinnerContainer: {
    width: moderateScale(16),
    height: moderateScale(16),
  },
  spinnerRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: moderateScale(8),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  spinnerArc: {
    position: 'absolute',
    inset: 0,
    borderRadius: moderateScale(8),
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#4CAF82',
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#4CAF82',
    fontSize: moderateScale(FONT.sm),
    fontWeight: '700',
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    color: '#EAF3EF',
    fontSize: moderateScale(FONT.sm),
    fontFamily: 'Pretendard-Medium',
  },
  locationSubtitle: {
    marginTop: moderateScale(2),
    color: '#8C949A',
    fontSize: moderateScale(FONT.xs),
    fontFamily: 'Pretendard-Regular',
  },
  divider: {
    marginTop: moderateScale(24),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#252C31',
  },
  dividerText: {
    color: '#656D73',
    fontSize: moderateScale(FONT.xxs),
    fontFamily: 'Pretendard-Regular',
  },
  searchContainer: {
    marginTop: moderateScale(24),
    minHeight: moderateScale(52),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#252C31',
    backgroundColor: '#13191F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(12),
  },
  searchIcon: {
    fontSize: moderateScale(FONT.sm),
    color: '#8C949A',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#EAF3EF',
    fontSize: moderateScale(FONT.sm),
    fontFamily: 'Pretendard-Regular',
  },
  citiesGrid: {
    marginTop: moderateScale(24),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  cityButton: {
    //minHeight: moderateScale(44),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#252C31',
    backgroundColor: '#13191F',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityButtonSelected: {
    borderColor: '#4FB78A',
    backgroundColor: '#1A2F27',
  },
  cityButtonText: {
    color: '#EAF3EF',
    fontSize: moderateScale(FONT.xs),
    fontFamily: 'Pretendard-Medium',
  },
  cityButtonTextSelected: {
    color: '#4FB78A',
  },
  nextButton: {
    minHeight: moderateScale(52),
    borderRadius: 12,
    backgroundColor: '#4FB78A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#1B2126',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT.sm),
    fontFamily: 'Pretendard-Medium',
  },
  nextTextDisabled: {
    color: '#656D73',
  },
});
