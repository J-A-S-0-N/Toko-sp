import * as Location from 'expo-location';
import { router } from 'expo-router';
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
  '광주', '수원', '제주', '울산', '창원'
];

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

  const handleNext = () => {
    if (!isNextEnabled) return;
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
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        // Get current position
        const location = await Location.getCurrentPositionAsync({});
        
        // Reverse geocode to get city name
        const geocoded = await Location.reverseGeocodeAsync(location.coords);
        
        if (geocoded.length > 0 && geocoded[0].city) {
          const city = geocoded[0].city;
          setDetected(city);
          setSelectedLocation(city);
          setIsUsingCurrentLocation(true);
        } else {
          // Fallback if no city found
          throw new Error('No city found');
        }
      } else {
        // Permission denied, use fallback
        throw new Error('Permission denied');
      }
    } catch (error) {
      // Fallback to mock location
      setTimeout(() => {
        setDetected('서울');
        setSelectedLocation('서울');
        setIsUsingCurrentLocation(true);
        setDetecting(false);
      }, 1600);
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

          {/* Popular Cities Grid */}
          <View style={styles.citiesGrid}>
            {POPULAR_CITIES.map((city) => {
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
    fontSize: moderateScale(26),
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
    fontSize: moderateScale(25),
  },
  subtitle: {
    marginTop: moderateScale(6),
    color: '#656D73',
    fontSize: moderateScale(13),
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
    fontSize: moderateScale(16),
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
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    color: '#EAF3EF',
    fontSize: moderateScale(16),
    fontFamily: 'Pretendard-Medium',
  },
  locationSubtitle: {
    marginTop: moderateScale(2),
    color: '#8C949A',
    fontSize: moderateScale(13),
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
    fontSize: moderateScale(12),
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
    fontSize: moderateScale(16),
    color: '#8C949A',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#EAF3EF',
    fontSize: moderateScale(16),
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
    fontSize: moderateScale(14),
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
    fontSize: moderateScale(16),
    fontFamily: 'Pretendard-Medium',
  },
  nextTextDisabled: {
    color: '#656D73',
  },
});
