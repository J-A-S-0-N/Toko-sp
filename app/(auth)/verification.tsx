import { FONT } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import { getAuth, signOut } from '@react-native-firebase/auth';

import { ThemedText as Text } from '@/components/themed-text';
import { Alert } from 'react-native';
import { confirmCode } from './functions/authFunctions';
import { checkUserExistsByUid } from './functions/loginFetchUserFunction';
import { setPendingUserCredential } from './functions/userCredentialStore';

const CODE_LENGTH = 6;

export default function VerificationScreen() {
  const { phone, verificationId } = useLocalSearchParams<{ phone?: string; verificationId?: string }>();
  const [codeDigits, setCodeDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [resendSeconds, setResendSeconds] = useState(53);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  const displayPhone = useMemo(() => {
    const rawDigits = String(phone ?? '').replace(/\D/g, '');

    if (!rawDigits) {
      return '+8210XXXXXXXX';
    }

    const withoutLeadingZero = rawDigits.startsWith('0') ? rawDigits.slice(1) : rawDigits;
    return `+82${withoutLeadingZero}`;
  }, [phone]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (codeDigits.length !== CODE_LENGTH) {
      setCodeDigits(Array(CODE_LENGTH).fill(''));
    }
  }, [codeDigits.length]);

  const isCodeValid = codeDigits.every((digit) => digit.length === 1);

  const handleDigitChange = (index: number, value: string) => {
    const nextDigit = value.replace(/\D/g, '').slice(0, 1);
    setCodeDigits((prev) => {
      const next = [...prev];
      next[index] = nextDigit;
      return next;
    });

    if (nextDigit && index < codeDigits.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== 'Backspace') {
      return;
    }

    if (codeDigits[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const submitting = useRef(false);

  const handleConfirm = async () => {
    if (!isCodeValid || submitting.current) {
      return;
    }

    if (!verificationId) {
      Alert.alert('인증 정보 없음', '인증번호를 다시 요청해주세요.');
      router.replace('/(auth)/signup');
      return;
    }

    submitting.current = true;

    try {
      const userCredential = await confirmCode(verificationId, codeDigits.join(''));
      const uid = userCredential.user?.uid ?? '';
      const existingUser = await checkUserExistsByUid(uid);

      if (existingUser) {
        //await auth().signOut();
        await signOut(getAuth());
        Alert.alert('이미 가입된 번호예요', '로그인으로 진행해주세요.');
        router.replace('/(auth)/login');
        return;
      }

      setPendingUserCredential(userCredential);
      console.log("Logged in user:", userCredential.user.uid);
      router.push('/verifying');
    } catch (error) {
      submitting.current = false;
      setCodeDigits(Array(CODE_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
      console.log("Invalid code or error:", error);
      Alert.alert("잘못된 인증번호", "다시 시도해주세요");
    }
  };

  const handleResendCode = () => {
    if (resendSeconds > 0) {
      return;
    }

    setCodeDigits(Array(CODE_LENGTH).fill(''));
    setResendSeconds(53);
    inputsRef.current[0]?.focus();
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainArea}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View style={styles.progressRow}>
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={[styles.progressSegment, styles.progressSegmentActive]} />
            <View style={styles.progressSegment} />
            <View style={styles.progressSegment} />
            <View style={styles.progressSegment} />
          </View>
        </View>

        <View style={styles.content}>
          <Text type="barlowHard" style={styles.title}>
            인증번호 확인
          </Text>

          <Text style={styles.description}>{displayPhone}으로 6자리 코드를 보냈습니다</Text>

          {/*           
          <Text style={styles.testCode}>
            테스트용 코드: <Text style={styles.testCodeAccent}>123456</Text>
          </Text> */}

          <View style={styles.codeRow}>
            {codeDigits.map((digit, index) => (
              <TextInput
                key={`code-${index}`}
                ref={(ref) => {
                  inputsRef.current[index] = ref;
                }}
                value={digit}
                onChangeText={(value) => handleDigitChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.codeInput}
                selectionColor="#4FB78A"
                returnKeyType="next"
              />
            ))}
          </View>

          <Pressable style={styles.resendButton} onPress={handleResendCode} disabled={resendSeconds > 0}>
            <Text style={[styles.resendButtonText, resendSeconds > 0 && styles.resendButtonTextDisabled]}>
              {resendSeconds > 0 ? `${resendSeconds}초 후 재발송 가능` : '인증번호 재발송'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, !isCodeValid && styles.submitButtonDisabled]}
        disabled={!isCodeValid}
        onPress={handleConfirm}
      >
        <Text style={[styles.submitText, !isCodeValid && styles.submitTextDisabled]}>확인</Text>
      </Pressable>
    </View>
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
  content: {
    width: '100%',
    marginTop: moderateScale(36),
  },
  title: {
    color: '#F4F7F6',
    fontSize: moderateScale(FONT.xl),
  },
  description: {
    marginTop: moderateScale(8),
    color: '#656D73',
    fontSize: moderateScale(FONT.xs),
    fontFamily: 'Pretendard-Regular',
  },
  testCode: {
    marginTop: moderateScale(10),
    color: '#7A8389',
    fontSize: moderateScale(FONT.xxs),
    fontFamily: 'Pretendard-Regular',
  },
  testCodeAccent: {
    color: '#4FB78A',
    fontFamily: 'Pretendard-Bold',
  },
  codeRow: {
    marginTop: moderateScale(20),
    flexDirection: 'row',
    width: '100%',
    gap: moderateScale(6),
  },
  codeInput: {
    flex: 1,
    maxWidth: moderateScale(54),
    minHeight: moderateScale(52),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4FB78A',
    backgroundColor: '#102018',
    color: '#EAF3EF',
    textAlign: 'center',
    fontSize: moderateScale(FONT.xl),
    fontFamily: 'Pretendard-Bold',
  },
  resendButton: {
    marginTop: moderateScale(16),
    alignSelf: 'center',
  },
  resendButtonText: {
    color: '#4FB78A',
    fontSize: moderateScale(FONT.xxs),
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  resendButtonTextDisabled: {
    color: 'white',
    textDecorationColor: 'none',
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
    fontSize: moderateScale(FONT.md),
    fontFamily: 'Pretendard-Bold',
  },
  submitTextDisabled: {
    color: '#5D646A',
  },
});
