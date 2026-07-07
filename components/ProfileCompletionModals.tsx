import { ThemedText as Text } from '@/components/themed-text';
import { FONT } from '@/constants/theme';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';

type PhoneRequiredModalProps = {
  visible: boolean;
  formattedPhoneNumber: string;
  confirmationPhoneNumber: string;
  hasPhoneValue: boolean;
  isPhoneValid: boolean;
  isSubmitting: boolean;
  isConfirmationStep: boolean;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  onBackFromConfirmation: () => void;
  onConfirmSubmit: () => void;
};

type CompleteProfileModalProps = {
  visible: boolean;
  name: string;
  formattedPhoneNumber: string;
  confirmationPhoneNumber: string;
  hasNameValue: boolean;
  hasPhoneValue: boolean;
  isNameValid: boolean;
  isPhoneValid: boolean;
  isSubmitting: boolean;
  isConfirmationStep: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  onBackFromConfirmation: () => void;
  onConfirmSubmit: () => void;
};

export function PhoneRequiredModal({
  visible,
  formattedPhoneNumber,
  confirmationPhoneNumber,
  hasPhoneValue,
  isPhoneValid,
  isSubmitting,
  isConfirmationStep,
  onPhoneChange,
  onSubmit,
  onBackFromConfirmation,
  onConfirmSubmit,
}: PhoneRequiredModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        {isConfirmationStep ? (
          <View style={styles.card}>
            <Text type="barlowHard" style={styles.title}>번호를 마지막으로 확인해주세요</Text>
            <Text style={styles.description}>인증 없이 저장되므로 번호를 꼭 다시 확인해주세요.</Text>
            <View style={styles.confirmationPhoneBox}>
              <Text style={styles.confirmationPhoneText}>{confirmationPhoneNumber}</Text>
            </View>

            <View style={styles.confirmationButtonsRow}>
              <Pressable
                style={[styles.secondaryButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={onBackFromConfirmation}
                disabled={isSubmitting}
              >
                <Text style={styles.secondaryButtonText}>수정하기</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={onConfirmSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>저장</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text type="barlowHard" style={styles.title}>전화번호 등록이 필요해요</Text>
            <Text style={styles.description}>이전 가입 계정이라 전화번호가 비어있어요. 계속하려면 번호를 등록해주세요.</Text>

            <TextInput
              value={formattedPhoneNumber}
              onChangeText={onPhoneChange}
              keyboardType="number-pad"
              placeholder="010-0000-0000"
              placeholderTextColor="#6A7278"
              style={[
                styles.input,
                hasPhoneValue && styles.inputActive,
                hasPhoneValue && !isPhoneValid && styles.inputInvalid,
              ]}
              maxLength={13}
              editable={!isSubmitting}
            />

            <Pressable
              style={[styles.submitButton, (!isPhoneValid || isSubmitting) && styles.submitButtonDisabled]}
              onPress={onSubmit}
              disabled={!isPhoneValid || isSubmitting}
            >
              <Text style={styles.submitText}>다음</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

export function CompleteProfileModal({
  visible,
  name,
  formattedPhoneNumber,
  confirmationPhoneNumber,
  hasNameValue,
  hasPhoneValue,
  isNameValid,
  isPhoneValid,
  isSubmitting,
  isConfirmationStep,
  onNameChange,
  onPhoneChange,
  onSubmit,
  onBackFromConfirmation,
  onConfirmSubmit,
}: CompleteProfileModalProps) {
  const canSubmit = isNameValid && isPhoneValid && !isSubmitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        {isConfirmationStep ? (
          <View style={styles.card}>
            <Text type="barlowHard" style={styles.title}>번호를 마지막으로 확인해주세요</Text>
            <Text style={styles.description}>인증 없이 저장되므로 번호를 꼭 다시 확인해주세요.</Text>
            <View style={styles.confirmationPhoneBox}>
              <Text style={styles.confirmationPhoneText}>{confirmationPhoneNumber}</Text>
            </View>

            <View style={styles.confirmationButtonsRow}>
              <Pressable
                style={[styles.secondaryButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={onBackFromConfirmation}
                disabled={isSubmitting}
              >
                <Text style={styles.secondaryButtonText}>수정하기</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={onConfirmSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>저장</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text type="barlowHard" style={styles.title}>프로필 입력이 필요해요</Text>
            <Text style={styles.description}>계정 정보가 비어있어요. 사용자명과 전화번호를 입력하면 바로 계속할 수 있어요.</Text>

            <TextInput
              value={name}
              onChangeText={onNameChange}
              placeholder="사용자명"
              placeholderTextColor="#6A7278"
              style={[
                styles.input,
                hasNameValue && styles.inputActive,
                hasNameValue && !isNameValid && styles.inputInvalid,
              ]}
              maxLength={10}
              editable={!isSubmitting}
            />

            <TextInput
              value={formattedPhoneNumber}
              onChangeText={onPhoneChange}
              keyboardType="number-pad"
              placeholder="010-0000-0000"
              placeholderTextColor="#6A7278"
              style={[
                styles.input,
                hasPhoneValue && styles.inputActive,
                hasPhoneValue && !isPhoneValid && styles.inputInvalid,
              ]}
              maxLength={13}
              editable={!isSubmitting}
            />

            <Pressable
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={onSubmit}
              disabled={!canSubmit}
            >
              <Text style={styles.submitText}>다음</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(24),
  },
  card: {
    width: '100%',
    borderRadius: moderateScale(14),
    backgroundColor: '#11161B',
    borderWidth: 1,
    borderColor: '#252C31',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(20),
    gap: moderateScale(10),
  },
  title: {
    color: '#F4F7F6',
    fontSize: moderateScale(FONT.lg),
  },
  description: {
    color: '#9BA4AA',
    fontSize: moderateScale(FONT.xs),
    fontFamily: 'Pretendard-Regular',
  },
  input: {
    minHeight: moderateScale(48),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#252C31',
    backgroundColor: '#13191F',
    color: '#EAF3EF',
    paddingHorizontal: moderateScale(14),
    fontSize: moderateScale(FONT.md),
    fontFamily: 'Pretendard-Regular',
  },
  inputActive: {
    borderColor: '#4FB78A',
  },
  inputInvalid: {
    borderColor: '#DE5A5A',
  },
  submitButton: {
    minHeight: moderateScale(48),
    borderRadius: moderateScale(10),
    backgroundColor: '#4FB78A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(34),
  },
  submitButtonDisabled: {
    backgroundColor: '#1A2026',
  },
  secondaryButton: {
    flex: 1,
    minHeight: moderateScale(48),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#384149',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171D23',
    paddingHorizontal: moderateScale(34),
  },
  secondaryButtonText: {
    color: '#D6DEE4',
    fontSize: moderateScale(FONT.sm),
    fontFamily: 'Pretendard-Bold',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT.sm),
    fontFamily: 'Pretendard-Bold',
  },
  confirmationPhoneBox: {
    minHeight: moderateScale(56),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#4FB78A',
    backgroundColor: '#12271E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(12),
  },
  confirmationPhoneText: {
    color: '#F4F7F6',
    fontSize: moderateScale(FONT.md),
    fontFamily: 'Pretendard-Bold',
    letterSpacing: 0.2,
  },
  confirmationButtonsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
});
