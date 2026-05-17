import { useNetwork } from '@/context/NetworkContext';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

export default function OfflineBlocker() {
  const { isConnected, isChecking, checkConnection } = useNetwork();

  // Don't show blocker if connected
  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        {isChecking ? (
          <ActivityIndicator size="large" color="#3CC06E" />
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Ionicons
                name="cloud-offline-outline"
                size={moderateScale(40)}
                color="#3CC06E"
              />
            </View>
            <Text style={styles.title}>연결 상태를{'\n'}확인해주세요</Text>
            <Text style={styles.subtitle}>
              현재 인터넷에 연결되어 있지 않습니다.{'\n'}
              Wi-Fi 또는 모바일 데이터를 확인한 뒤{'\n'}
              다시 시도해주세요.
            </Text>
            <Pressable style={styles.retryButton} onPress={checkConnection}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </Pressable>
            <Text style={styles.footerText}>
              연결 후 자동으로 다시 동기화됩니다.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F1412',
    zIndex: 9999,
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(32),
    width: '100%',
  },
  iconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(20),
    backgroundColor: '#1A2620',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(28),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(32),
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: '#8A9491',
    marginBottom: moderateScale(32),
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
  retryButton: {
    backgroundColor: '#3CC06E',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(32),
    width: '100%',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  retryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#0F1412',
  },
  footerText: {
    fontSize: moderateScale(12),
    color: '#5A6260',
    textAlign: 'center',
  },
});
