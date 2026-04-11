import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import { ThemedText as Text } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AuthEntryScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>⛳️</Text>
        </View>

        <Text type="barlowHard" style={styles.title}>
          TOKO스포츠
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
            <Text type="barlowLight" style={styles.startText}>
              회원가입
            </Text>
            <IconSymbol 
              name="chevron.right" 
              size={20} 
              color="#F5F9F7" 
              style={styles.arrowIcon}
            />
          </View>
        </Pressable>  

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
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(24),
    backgroundColor: '#00BA87',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F5A3A',
    shadowOpacity: 0.38,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
  },
  logoEmoji: {
    fontSize: moderateScale(18),
  },
  title: {
    marginTop: 10,
    fontSize: moderateScale(28),
    color: '#F4F7F6',
    lineHeight: moderateScale(30),
    //letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: moderateScale(16),
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
    shadowColor: '#55BA8D',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  startText: {
    fontWeight: '800',
    paddingRight: moderateScale(4),
    fontSize: moderateScale(18),
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
  loginRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginHint: {
    fontSize: moderateScale(12),
    color: '#586068',
    //fontFamily: 'Pretendard-Regular',
  },
  loginLink: {
    fontSize: moderateScale(12),
    color: '#4CAF82',
  },
});
