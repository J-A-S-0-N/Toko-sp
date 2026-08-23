import { ThemedText as Text } from '@/components/themed-text';
import { FONT } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

const getKoreanTimeGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return '좋은 아침이에요';
  }

  if (hour < 18) {
    return '좋은 오후에요';
  }

  return '좋은 저녁이에요';
};

export default function HomeTopGreetingHeader() {
  const { username } = useAuth();

  const safeUsername = typeof username === 'string' && username.trim().length > 0 ? username.trim() : '회원';
  const firstCharacter = safeUsername.slice(0, 1).toUpperCase();
  const greetingLabel = `${getKoreanTimeGreeting()}, ${safeUsername}님!`;

  return (
    <View style={styles.wrapper}>
      <View style={styles.textColumn}>
        <Text type="barlowHard" style={styles.greetingText}>
          {greetingLabel}
        </Text>
        <Text type="barlowHard" style={styles.headlineText}>
          오늘도 한번{`\n`}가볍게 쳐볼까요?
        </Text>
      </View>

      <View style={styles.badgeShadowWrap}>
        <LinearGradient
          colors={['#64D7A7', '#419A74', '#1B4D39']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Text type="barlowHard" style={styles.badgeText}>
            {firstCharacter}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: moderateScale(2),
    paddingVertical: moderateScale(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    paddingRight: moderateScale(12),
  },
  greetingText: {
    color: '#6FBF9A',
    fontSize: moderateScale(FONT.xxs),
    marginBottom: moderateScale(8),
  },
  headlineText: {
    color: '#F3F7F5',
    fontSize: moderateScale(FONT.xxl - 4),
    lineHeight: moderateScale(31),
    letterSpacing: -0.35,
  },
  badgeShadowWrap: {
    borderRadius: moderateScale(24),
    shadowColor: '#5ACF9E',
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10,
  },
  badge: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT.md),
  },
});
