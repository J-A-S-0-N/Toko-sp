/* import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha'; */
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';

// recaptcha function

import { ThemedText as Text } from '@/components/themed-text';
import { moderateScale } from 'react-native-size-matters';
import { sendVerification } from './functions/authFunctions';
import { checkUserExistsByPhoneNumber } from './functions/loginFetchUserFunction';

export default function SignupScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const countryShake = useRef(new Animated.Value(0)).current;

  const formattedPhoneNumber = useMemo(() => {
    const digits = phoneNumber.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }, [phoneNumber]);

  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 10;
  const hasPhoneValue = phoneNumber.replace(/\D/g, '').length > 0;

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setPhoneNumber(digits);
  };

  const recaptchaVerifier = useRef(null);

  const handleCountryPress = () => {
    countryShake.stopAnimation();
    countryShake.setValue(0);

    Animated.sequence([
      Animated.timing(countryShake, {
        toValue: -4,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(countryShake, {
        toValue: 4,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(countryShake, {
        toValue: -3,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(countryShake, {
        toValue: 3,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(countryShake, {
        toValue: 0,
        duration: 35,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Alert.alert('안내', '현재 서비스는 대한민국(+82)에서만 이용할 수 있어요.');
    });
  };
  
  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!isPhoneValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      const e164PhoneNumber = `+82${digitsOnly.replace(/^0/, '')}`;
      const existingUserExists = await checkUserExistsByPhoneNumber(e164PhoneNumber);

      if (existingUserExists) {
        Alert.alert('이미 가입된 번호예요', '로그인으로 진행해주세요.');
        router.replace('/(auth)/login');
        return;
      }

      const confirmation = await sendVerification(e164PhoneNumber);
      //const verificationId = await sendVerification(e164PhoneNumber, recaptchaVerifier);

      router.push({
        pathname: '/(auth)/verification',
        params: { phone: phoneNumber, verificationId: confirmation.verificationId },
      });
    } catch (error) {
      console.error(error);
      Alert.alert('인증 실패', '인증번호 전송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }; 

  return (
    <>
{/*       <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={false}
      /> */}
      <View style={styles.container}>
          <View style={styles.mainArea}>
            <View style={styles.header}>
              <Pressable style={styles.iconButton} onPress={() => router.back()}>
                <Text style={styles.backArrow}>‹</Text>
              </Pressable>

              <View style={styles.progressRow}>
                <View style={[styles.progressSegment, styles.progressSegmentActive]} />
                <View style={styles.progressSegment} />
                <View style={styles.progressSegment} />
                <View style={styles.progressSegment} />
                <View style={styles.progressSegment} />
              </View>
            </View>

            <View style={styles.content}>
              <Text type="barlowHard" style={styles.title}>
                전화번호 입력
              </Text>
              <Text style={styles.description}>인증 코드를 문자로 발송합니다</Text>

              <Animated.View style={{ transform: [{ translateX: countryShake }] }}>
                <Pressable style={styles.countryInput} onPress={handleCountryPress}>
                  <View style={styles.countryLeft}>
                    <Text style={styles.countryFlag}>🇰🇷</Text>
                    <Text style={styles.countryLabel}>한국</Text>
                    <Text style={styles.countryCode}>+82</Text>
                  </View>
                  <Text style={styles.countryChevron}>▾</Text>
                </Pressable>
              </Animated.View>

              <View style={[styles.phoneInputWrap, hasPhoneValue && styles.phoneInputWrapActive]}>
                <Text style={styles.phonePrefix}>+82</Text>
                <TextInput
                  value={formattedPhoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="number-pad"
                  placeholder="010-0000-0000"
                  placeholderTextColor="#586068"
                  style={styles.phoneInput}
                  maxLength={13}
                />
              </View>

              <Text style={styles.hint}>번호는 인증 목적으로만 사용됩니다</Text>
            </View>
          </View>

          <Pressable
            style={[styles.submitButton, (!isPhoneValid || isSubmitting) && styles.submitButtonDisabled]}
            disabled={!isPhoneValid || isSubmitting}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitText, (!isPhoneValid || isSubmitting) && styles.submitTextDisabled]}>
              인증번호 받기
            </Text>
          </Pressable>
      </View>

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4FB78A" />
          <Text style={styles.loadingText}>보안 인증 준비 중...</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05080B',
    paddingHorizontal: moderateScale(10),
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(28),
  },
  mainArea: {
    flex: 1,
  },
  header: {
    width: '100%',
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
  content: {
    width: '100%',
    marginTop: moderateScale(36),
  },
  title: {
    color: '#F4F7F6',
    fontSize: moderateScale(36),
  },
  description: {
    color: '#656D73',
    fontSize: moderateScale(13),
    fontFamily: 'Pretendard-Regular',
    marginTop: moderateScale(5),
  },
  countryInput: {
    marginTop: moderateScale(26),
    width: '100%',
    minHeight: moderateScale(48),
    borderRadius: 12,
    backgroundColor: '#171C20',
    borderWidth: 1,
    borderColor: '#1E2429',
    paddingHorizontal: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  countryFlag: {
    fontSize: moderateScale(13),
  },
  countryLabel: {
    color: '#B4BDC4',
    fontSize: moderateScale(12),
    fontFamily: 'Pretendard-Regular',
  },
  countryCode: {
    color: '#7A8389',
    fontSize: moderateScale(12),
    fontFamily: 'Pretendard-Regular',
  },
  countryChevron: {
    color: '#7A8389',
    fontSize: moderateScale(14),
  },
  phoneInputWrap: {
    marginTop: moderateScale(8),
    width: '100%',
    minHeight: moderateScale(48),
    borderRadius: 12,
    backgroundColor: '#171C20',
    borderWidth: 1,
    borderColor: '#1E2429',
    paddingHorizontal: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  phoneInputWrapActive: {
    borderColor: '#4FB78A',
  },
  phonePrefix: {
    color: '#7A8389',
    fontSize: moderateScale(13),
    fontFamily: 'Pretendard-Regular',
  },
  phoneInput: {
    flex: 1,
    color: '#DCE4E8',
    fontSize: moderateScale(16),
    fontFamily: 'Pretendard-Regular',
    paddingVertical: moderateScale(10),
  },
  hint: {
    marginTop: moderateScale(8),
    color: '#515A61',
    fontSize: moderateScale(11),
    fontFamily: 'Pretendard-Regular',
  },
  submitButton: {
    width: '100%',
    minHeight: moderateScale(52),
    borderRadius: 14,
    backgroundColor: '#4FB78A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#171B1F',
  },
  submitText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontFamily: 'Pretendard-Bold',
  },
  submitTextDisabled: {
    color: '#5D646A',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 8, 11, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(12),
    zIndex: 100,
  },
  loadingText: {
    color: '#DCE4E8',
    fontSize: moderateScale(14),
    fontFamily: 'Pretendard-Medium',
  },
});
