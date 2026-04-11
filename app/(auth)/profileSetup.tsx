import { router } from 'expo-router';
import type { UserCredential } from 'firebase/auth';
import { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { saveUserInfo } from './functions/saveUserFunction';
import { clearPendingUserCredential, getPendingUserCredential } from './functions/userCredentialStore';

import { ThemedText as Text } from '@/components/themed-text';

const SKILL_LEVELS = [
  { id: 'beginner', icon: '🚀', label: '입문자', hint: '30+' },
  { id: 'amateur', icon: '⛳', label: '아마추어', hint: '20-30' },
  { id: 'intermediate', icon: '🥂', label: '중급자', hint: '10-20' },
  { id: 'advanced', icon: '🏆', label: '싱글', hint: '<10' },
] as const;

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [handicap, setHandicap] = useState('');
  const [skillLevel, setSkillLevel] = useState<(typeof SKILL_LEVELS)[number]['id'] | null>(null);
  const avatarShake = useRef(new Animated.Value(0)).current;

  const hasNameValue = name.trim().length > 0;
  const hasHandicapValue = handicap.trim().length > 0;
  const hasInvalidHandicapChars = /[^\d.]/.test(handicap);
  const hasInvalidNameChars = /[^가-힣a-zA-Z0-9\s]/.test(name);
  const hasNameTooLong = name.trim().length > 10;

  const isNextEnabled = useMemo(() => {
    return hasNameValue && hasHandicapValue && !hasInvalidHandicapChars && !hasInvalidNameChars && !hasNameTooLong && skillLevel !== null;
  }, [hasHandicapValue, hasInvalidHandicapChars, hasInvalidNameChars, hasNameTooLong, hasNameValue, skillLevel]);

  const handleNext = async () => {
    if (!isNextEnabled) {
      return;
    }

    const userCredential = getPendingUserCredential();

    if (!userCredential) {
      Alert.alert('인증 정보 없음', '다시 인증 후 시도해주세요.');
      router.replace('/(auth)');
      return;
    }

    try {
      const result = await saveUserInfo(userCredential as UserCredential, {
        name,
        handicap: parseFloat(handicap),
        skillLevel,
        test: 'name',
      });

      if (!result.saved && (result.reason === 'already_saved' || result.reason === 'existing_user')) {
        clearPendingUserCredential();
        Alert.alert('이미 가입된 계정', '이미 저장된 계정입니다. 로그인 해주세요.');
        router.replace('/(auth)/login');
        return;
      }

      if (!result.saved) {
        Alert.alert('저장 실패', '프로필 저장 중 오류가 발생했어요. 다시 시도해주세요.');
        return;
      }

      clearPendingUserCredential();
      router.push('/(auth)/locationSetup');
    } catch (error) {
      Alert.alert('저장 실패', '프로필 저장 중 오류가 발생했어요. 다시 시도해주세요.');
    }
  };

  const handleAvatarPress = () => {
    avatarShake.stopAnimation();
    avatarShake.setValue(0);

    Animated.sequence([
      Animated.timing(avatarShake, {
        toValue: -4,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(avatarShake, {
        toValue: 4,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(avatarShake, {
        toValue: -3,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(avatarShake, {
        toValue: 3,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(avatarShake, {
        toValue: 0,
        duration: 35,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Alert.alert('안내', '프로필 이미지 기능은 곧 추가될 예정이에요.');
    });
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
            <View style={styles.progressSegment} />
            <View style={styles.progressSegment} />
          </View>
        </View>

        <View style={styles.body}>
          <Text type="barlowHard" style={styles.title}>
            프로필 설정
          </Text>
          <Text style={styles.subtitle}>나중에 언제든지 변경할 수 있어요</Text>

          <Animated.View style={[styles.avatarWrap, { transform: [{ translateX: avatarShake }] }]}>
            <Pressable onPress={handleAvatarPress} style={styles.avatarPressable}>
              <View style={styles.avatarCircle}>
                <Text type="barlowHard" style={styles.avatarQuestion}>
                  ?
                </Text>
              </View>
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>✏️</Text>
              </View>
            </Pressable>
          </Animated.View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>이름 *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="홍길동"
              placeholderTextColor="#6A7278"
              style={[
                styles.textField,
                hasNameValue && styles.textFieldActive,
                (hasInvalidNameChars || hasNameTooLong) && styles.textFieldInvalid
              ]}
              selectionColor="#4FB78A"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>본서 핸디캡 *</Text>
            <View
              style={[
                styles.handicapWrap,
                hasHandicapValue && styles.handicapWrapActive,
                hasInvalidHandicapChars && styles.handicapWrapInvalid,
              ]}
            >
              <TextInput
                value={handicap}
                onChangeText={setHandicap}
                keyboardType="decimal-pad"
                placeholder="예: 12.4"
                placeholderTextColor="#6A7278"
                style={styles.handicapInput}
                selectionColor="#4FB78A"
              />
              <Text style={styles.chevron}>▾</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>실력 수준 (선택)</Text>
            <View style={styles.skillRow}>
              {SKILL_LEVELS.map((item) => {
                const isSelected = item.id === skillLevel;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSkillLevel(item.id)}
                    style={[styles.skillChip, isSelected && styles.skillChipSelected]}
                  >
                    <Text style={styles.skillChipText}>
                      {item.icon} {item.label} <Text style={styles.skillChipHint}>{item.hint}</Text>
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
    lineHeight: moderateScale(24),
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
    lineHeight: moderateScale(30),
  },
  subtitle: {
    marginTop: moderateScale(6),
    color: '#656D73',
    fontSize: moderateScale(13),
    fontFamily: 'Pretendard-Regular',
  },
  avatarWrap: {
    marginTop: moderateScale(26),
    alignSelf: 'center',
    width: moderateScale(90),
    height: moderateScale(90),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#57BD91',
    borderWidth: 2,
    borderColor: '#2D8E66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarQuestion: {
    color: '#E8FFF5',
    fontSize: moderateScale(34),
    lineHeight: moderateScale(36),
  },
  editBadge: {
    position: 'absolute',
    right: moderateScale(-2),
    bottom: moderateScale(-2),
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: 999,
    backgroundColor: '#1A222A',
    borderWidth: 2,
    borderColor: '#0C1116',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: {
    fontSize: moderateScale(12),
  },
  fieldGroup: {
    marginTop: moderateScale(18),
    gap: moderateScale(8),
  },
  fieldLabel: {
    color: '#5E666D',
    fontSize: moderateScale(11),
    fontFamily: 'Pretendard-Regular',
  },
  textField: {
    minHeight: moderateScale(52),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#252C31',
    backgroundColor: '#13191F',
    color: '#EAF3EF',
    paddingHorizontal: moderateScale(14),
    fontSize: moderateScale(17),
    fontFamily: 'Pretendard-Regular',
  },
  textFieldActive: {
    borderColor: '#4FB78A',
  },
  textFieldInvalid: {
    borderColor: '#DE5A5A',
  },
  handicapWrap: {
    minHeight: moderateScale(52),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#252C31',
    backgroundColor: '#13191F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: moderateScale(12),
  },
  handicapWrapActive: {
    borderColor: '#4FB78A',
  },
  handicapWrapInvalid: {
    borderColor: '#DE5A5A',
  },
  handicapInput: {
    flex: 1,
    height: '100%',
    color: '#EAF3EF',
    paddingHorizontal: moderateScale(14),
    fontSize: moderateScale(17),
    fontFamily: 'Pretendard-Regular',
  },
  chevron: {
    color: '#8C949A',
    fontSize: moderateScale(15),
    fontFamily: 'Pretendard-Bold',
  },
  skillRow: {
    marginTop: moderateScale(2),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  skillChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#20262C',
    backgroundColor: '#11161B',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
  },
  skillChipSelected: {
    borderColor: '#4FB78A',
    backgroundColor: '#143025',
  },
  skillChipText: {
    color: '#D1D6DA',
    fontSize: moderateScale(11),
    fontFamily: 'Pretendard-Regular',
  },
  skillChipHint: {
    color: '#717980',
    fontSize: moderateScale(10),
    fontFamily: 'Pretendard-Regular',
  },
  nextButton: {
    width: '100%',
    minHeight: moderateScale(52),
    borderRadius: 14,
    backgroundColor: '#4FB78A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#171B1F',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontFamily: 'Pretendard-Bold',
  },
  nextTextDisabled: {
    color: '#5D646A',
  },
});
