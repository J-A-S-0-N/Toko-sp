import { FONT } from '@/constants/theme';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import { ThemedText as Text } from '@/components/themed-text';

// ===== GOOGLE AUTH (added) START — remove this block to revert =====

import db from '@/config/firebase';
import { isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { CommonActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { signInWithGoogle } from './functions/authFunctions';
import { checkUserExistsByUid } from './functions/loginFetchUserFunction';
import { setPendingUserCredential } from './functions/userCredentialStore';

// ===== GOOGLE AUTH (added) END =====

export default function AuthEntryScreen() {

  // ===== GOOGLE AUTH (added) START — remove this block to revert =====

  const navigation = useNavigation();
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const resetToTabs = () => {
    const root = navigation.getParent() ?? navigation;
    root.dispatch(CommonActions.reset({ index: 0, routes: [{ name: '(tabs)' }] }));
  };

  const checkIfGoogleisDisabled = async () => {
    const snap = await getDoc(doc(db, "DisableComponent", "GoogleVerficationButton"));
    const disabled = snap.exists() ? Boolean(snap.data()?.isDisabled) : false;
    setIsDisabled(disabled);
  }

  const handleGoogleSignIn = async () => {
    if (isGoogleSubmitting) {
      return;
    }

    setIsGoogleSubmitting(true);

    try {
      const credential = await signInWithGoogle();
      const uid = credential.user?.uid ?? '';
      const existingUser = await checkUserExistsByUid(uid);

      if (existingUser) {
        resetToTabs();
        return;
      }

      setPendingUserCredential(credential);
      router.push('/(auth)/verified');
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      const errorCode = (error as { code?: string })?.code ?? 'unknown';
      const errorMessage = (error as { message?: string })?.message ?? 'unknown error';
      console.error('[GOOGLE_SIGNIN_FAIL]', { errorCode, errorMessage, error });
      Alert.alert('Google 인증 실패', `${errorCode}\n${errorMessage}`);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  useEffect(() => {
    checkIfGoogleisDisabled();
  }, []);

  // ===== GOOGLE AUTH (added) END =====

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} resizeMode="contain" />
        </View>

        <Text type="barlowHard" style={styles.title}>
          토코기록기
        </Text>
        <Text style={styles.subtitle}>골프를 더 스마트하게</Text>

        <View style={styles.divider} />

{/*         <Pressable style={styles.startButton} onPress={() => router.push('/(auth)/signup')}> */}

        {/* 
        this is testing only!!
        */}
{/*         <Pressable style={styles.startButton} onPress={() => router.push('/(tabs)')}> */}
        <Pressable
          style={styles.startButton}
          onPress={() => {
            router.push('/(auth)/signup');
          }}
        >
          <View style={styles.startTextContainer}>
            {/* ===== GOOGLE AUTH (added) START — original text was: 회원가입 ===== */}
            <Text type="barlowLight" style={styles.startText}>
              전화번호로 가입하기
            </Text>
            {/* ===== GOOGLE AUTH (added) END ===== */}
          </View>
        </Pressable>  

        {/* ===== GOOGLE AUTH (added) START — remove this block to revert ===== */}

        {!isDisabled && (
          <Pressable
            style={[styles.googleButton, isGoogleSubmitting && styles.googleButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleSubmitting}
          >
            {isGoogleSubmitting ? (
              <ActivityIndicator size="small" color="#1F1F1F" />
            ) : (
              <Text style={styles.googleButtonText}>Google로 시작하기</Text>
            )}
          </Pressable>

        )}

        {/* ===== GOOGLE AUTH (added) END ===== */}

        <View style={styles.loginRow}>
          <Text style={styles.loginHint}>이미 계정이 있으신가요? </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>로그인</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05080B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  logoWrap: {
    width: moderateScale(92),
    height: moderateScale(92),
    borderRadius: moderateScale(28),
    backgroundColor: '#00BA87',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F5A3A',
    shadowOpacity: 0.38,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
  },
  logoImage: {
    width: moderateScale(84),
    height: moderateScale(84),
    borderRadius: moderateScale(24),
  },
  title: {
    marginTop: 10,
    fontSize: moderateScale(FONT.xxl),
    color: '#F4F7F6',
    //letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: moderateScale(FONT.sm),
    color: '#6E757D',
    fontFamily: 'Pretendard-Regular',
  },
  divider: {
    width: 52,
    height: 3,
    borderRadius: 99,
    backgroundColor: '#1C6B53',
    marginVertical: 14,
  },
  startButton: {
    width: '80%',
    padding: moderateScale(10),
    //height: 56,
    borderRadius: moderateScale(15),
    backgroundColor: '#55BA8D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    fontWeight: '800',
    paddingRight: moderateScale(4),
    fontSize: moderateScale(FONT.md),
    letterSpacing: 0.8, // <-- key fix
    color: '#F5F9F7',
  },
  startTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  arrowIcon: {
    marginLeft: 4,
  },
  // ===== GOOGLE AUTH (added) START — remove this block to revert =====

  googleButton: {
    marginTop: 12,
    width: '80%',
    minHeight: moderateScale(44),
    padding: moderateScale(10),
    borderRadius: moderateScale(15),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: moderateScale(FONT.md),
    color: '#1F1F1F',
    fontFamily: 'Pretendard-Bold',
  },

  // ===== GOOGLE AUTH (added) END =====

  loginRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginHint: {
    fontSize: moderateScale(FONT.xxs),
    color: '#586068',
    //fontFamily: 'Pretendard-Regular',
  },
  loginLink: {
    fontSize: moderateScale(FONT.xxs),
    color: '#4CAF82',
  },
});
