import { ThemedText as Text } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';

export default function ProfileScreen() {
  const { username } = useAuth();
  const initial = (username ?? '').slice(0, 1);
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Ionicons name="flag-outline" size={moderateScale(18)} color="#49C895" />
            <Text type="barlowHard" style={styles.brandText}>
              CADDIE
            </Text>
          </View>

          <View style={styles.profileChip}>
            <Text type="barlowLight" style={styles.profileChipText}>
              프로필
            </Text>
          </View>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            <Text type="barlowHard" style={styles.avatarInitials}>
              {initial}
            </Text>
          </View>

          <Text type="barlowHard" style={styles.nameText}>
            {username ?? ''}
          </Text>

          <Text type="barlowLight" style={styles.memberSinceText}>
            2024년 1월부터 회원
          </Text>

          <View style={styles.handicapChip}>
            <Ionicons name="flag-outline" size={moderateScale(16)} color="#49C895" />
            <Text type="barlowLight" style={styles.handicapText}>
              4.2 핸디캡
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.roundStatValue}>
              24
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              라운드 수
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.statValue}>
              8
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              코스
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.statValue}>
              78
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              최고 라운드
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.statValue}>
              80.4
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              평균 스코어
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.statValue}>
              43
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              총 버디
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text type="barlowHard" style={styles.statValue}>
              6
            </Text>
            <Text type="barlowLight" style={styles.statLabel}>
              최장 연속
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090B0C',
  },
  container: {
    flex: 1,
    backgroundColor: '#090B0C',
  },
  content: {
    paddingHorizontal: moderateScale(18),
    paddingBottom: moderateScale(22),
  },
  topBar: {
    marginTop: moderateScale(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  brandText: {
    color: '#E5E7E7',
    fontSize: moderateScale(26),
    letterSpacing: moderateScale(0.5),
  },
  profileChip: {
    borderWidth: 1,
    borderColor: '#2C3032',
    backgroundColor: '#161A1D',
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(17),
    paddingVertical: moderateScale(8),
  },
  profileChipText: {
    color: '#7A7F83',
    fontSize: moderateScale(14),
    letterSpacing: moderateScale(0.3),
  },
  heroSection: {
    marginTop: moderateScale(28),
    alignItems: 'center',
  },
  avatarCircle: {
    width: moderateScale(86),
    height: moderateScale(86),
    borderRadius: moderateScale(43),
    backgroundColor: '#48B68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: moderateScale(24),
  },
  nameText: {
    marginTop: moderateScale(16),
    color: '#F2F3F3',
    fontSize: moderateScale(25),
  },
  memberSinceText: {
    marginTop: moderateScale(8),
    color: '#656B70',
    fontSize: moderateScale(13),
  },
  handicapChip: {
    marginTop: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    borderWidth: 1,
    borderColor: '#1B6F56',
    backgroundColor: '#0F2620',
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
  },
  handicapText: {
    color: '#49C895',
    fontSize: moderateScale(14),
  },
  divider: {
    marginTop: moderateScale(30),
    height: 1,
    backgroundColor: '#1A1F22',
  },
  statsGrid: {
    marginTop: moderateScale(18),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: moderateScale(12),
  },
  statCard: {
    width: '48.5%',
    minHeight: moderateScale(86),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: '#2A2F33',
    backgroundColor: '#1A1E20',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(15),
    justifyContent: 'space-between',
  },
  statValue: {
    color: '#F3F4F4',
    fontSize: moderateScale(26),
  },
  roundStatValue: {
    color: '#D4AF37',
    fontSize: moderateScale(26),
  },
  statLabel: {
    color: '#6D7377',
    fontSize: moderateScale(12),
  },
});
