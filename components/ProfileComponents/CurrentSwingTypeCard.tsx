import { ThemedText as Text } from '@/components/themed-text';
import { FONT } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

export default function CurrentSwingTypeCard() {
  return (
    <View style={styles.swingTypeCard}>
      <View style={styles.swingTypeAccentOuter}>
        <View style={styles.swingTypeAccentInner} />
      </View>

      <Text type="barlowHard" style={styles.swingTypeLabel}>
        나의 현재 스윙 타입
      </Text>
      <Text type="barlowHard" style={styles.swingTypeTitle}>
        안정형 스윙어
      </Text>
      <Text type="barlowLight" style={styles.swingTypeDescription}>
        큰 힘보다 균형과 피니시가 강점입니다. 최근에는 리듬도 빠르게 좋아지고 있어요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  swingTypeCard: {
    marginTop: moderateScale(16),
    width: '100%',
    borderRadius: moderateScale(28),
    backgroundColor: '#EEFBCF',
    borderWidth: 1,
    borderColor: '#E2F4B8',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(20),
    overflow: 'hidden',
  },
  swingTypeAccentOuter: {
    position: 'absolute',
    right: moderateScale(-38),
    top: moderateScale(-24),
    width: moderateScale(210),
    height: moderateScale(210),
    borderRadius: moderateScale(105),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(235, 250, 179, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swingTypeAccentInner: {
    width: moderateScale(135),
    height: moderateScale(135),
    borderRadius: moderateScale(67.5),
    backgroundColor: 'rgba(210, 241, 107, 0.7)',
  },
  swingTypeLabel: {
    color: '#577044',
    fontSize: moderateScale(FONT.xxs),
  },
  swingTypeTitle: {
    color: '#1F2A1A',
    fontSize: moderateScale(FONT.xl),
  },
  swingTypeDescription: {
    marginTop: moderateScale(10),
    color: '#4A5D3F',
    fontSize: moderateScale(FONT.xxs),
    lineHeight: moderateScale(24),
    paddingRight: moderateScale(80),
  },
});
