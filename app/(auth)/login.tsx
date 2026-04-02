import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText as Text } from '@/components/themed-text';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text type="barlowHard" style={styles.title}>
        로그인
      </Text>
      <Text style={styles.description}>여기서 로그인 화면을 구현하면 됩니다.</Text>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>이전으로</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111312',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  title: {
    color: '#F4F7F6',
    fontSize: 48,
  },
  description: {
    color: '#778188',
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1A2328',
  },
  backText: {
    color: '#E5EAED',
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
  },
});
