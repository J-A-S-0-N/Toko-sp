import {
    getUserProfileGateSnapshot,
} from '@/app/(auth)/functions/loginFetchUserFunction';
import {
    ProfileGateSaveError,
    ProfileGateStatus,
    formatPhoneNumber,
    isValidName,
    isValidPhoneDigits,
    normalizePhoneDigits,
    saveMissingProfile,
} from '@/app/(auth)/functions/profileGateShared';
import CustomSplash from '@/components/CustomSplash';
import { CompleteProfileModal, PhoneRequiredModal } from '@/components/ProfileCompletionModals';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

export default function EntryScreen() {
  const { user, loading, setUsername } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [profileGateLoading, setProfileGateLoading] = useState(false);
  const [profileGateRetryKey, setProfileGateRetryKey] = useState(0);
  const [profileGateStatus, setProfileGateStatus] = useState<ProfileGateStatus>('ready');
  const [userDocExists, setUserDocExists] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isConfirmationStep, setIsConfirmationStep] = useState(false);

  const formattedPhoneNumber = useMemo(() => formatPhoneNumber(phoneDigits), [phoneDigits]);
  const hasPhoneValue = normalizePhoneDigits(phoneDigits).length > 0;
  const isPhoneValid = isValidPhoneDigits(phoneDigits);
  const hasNameValue = nameInput.trim().length > 0;
  const nameIsValid = isValidName(nameInput);
  const requiresName = profileGateStatus === 'requires_phone_and_name';

  // Ensure splash screen is shown for at least 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Dismiss splash only after both auth resolves and minimum time has passed
  useEffect(() => {
    if (!loading && minTimeElapsed) {
      const timer = setTimeout(() => setShowSplash(false), 950);
      return () => clearTimeout(timer);
    }
  }, [loading, minTimeElapsed]);

  useEffect(() => {
    setIsConfirmationStep(false);
  }, [profileGateStatus, user?.uid]);

  useEffect(() => {
    let cancelled = false;

    const resolveProfileGate = async () => {
      if (!user?.uid) {
        setProfileGateStatus('ready');
        setUserDocExists(false);
        setNameInput('');
        setPhoneDigits('');
        setProfileGateLoading(false);
        return;
      }

      setProfileGateLoading(true);

      try {
        const snapshot = await getUserProfileGateSnapshot(user.uid);

        if (cancelled) {
          return;
        }

        setUserDocExists(snapshot.exists);

        const resolvedName = snapshot.name ?? '';
        setNameInput(resolvedName);
        if (resolvedName) {
          setUsername(resolvedName);
        }

        const hasName = resolvedName.length > 0;
        const hasPhone = Boolean(snapshot.phoneNumber);

        if (!hasName && !hasPhone) {
          setProfileGateStatus('requires_phone_and_name');
        } else if (hasName && !hasPhone) {
          setProfileGateStatus('requires_phone');
        } else {
          setProfileGateStatus('ready');
        }
      } catch (error) {
        console.error('Failed to resolve profile gate:', error);
        if (!cancelled) {
          setProfileGateStatus('ready');
          Alert.alert(
            '네트워크 오류',
            '인터넷 연결을 확인한 뒤 다시 시도해주세요.',
            [
              {
                text: '나중에',
                style: 'cancel',
              },
              {
                text: '다시 시도',
                onPress: () => setProfileGateRetryKey((prev) => prev + 1),
              },
            ],
            { cancelable: true }
          );
        }
      } finally {
        if (!cancelled) {
          setProfileGateLoading(false);
        }
      }
    };

    void resolveProfileGate();

    return () => {
      cancelled = true;
    };
  }, [profileGateRetryKey, setUsername, user?.uid]);

  const handlePhoneChange = (value: string) => {
    setPhoneDigits(normalizePhoneDigits(value));
  };

  const handleSubmitGateInput = () => {
    if (isSavingProfile) {
      return;
    }

    if (!isPhoneValid) {
      return;
    }

    if (requiresName && !nameIsValid) {
      return;
    }

    setIsConfirmationStep(true);
  };

  const handleConfirmGateSave = async () => {
    if (!user?.uid || isSavingProfile) {
      return;
    }

    if (!isConfirmationStep) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const { savedName } = await saveMissingProfile({
        uid: user.uid,
        requiresName,
        nameInput,
        phoneDigits,
        userDocExists,
      });

      if (savedName) {
        setUsername(savedName);
      }

      setUserDocExists(true);
      setProfileGateStatus('ready');
      setPhoneDigits('');
      setIsConfirmationStep(false);
    } catch (error) {
      if (error instanceof ProfileGateSaveError) {
        if (error.code === 'DUPLICATE_USERNAME') {
          Alert.alert('이미 사용 중인 사용자명이에요', '다른 사용자명으로 변경해주세요.');
        } else if (error.code === 'INVALID_NAME') {
          Alert.alert('사용자명 확인', '사용자명은 특수문자 없이 10자 이내로 입력해주세요.');
        } else if (error.code === 'INVALID_PHONE') {
          Alert.alert('전화번호 확인', '전화번호 형식을 다시 확인해주세요.');
        } else {
          Alert.alert('저장 실패', error.message);
        }
      } else {
        console.error('Failed to save missing profile:', error);
        Alert.alert('저장 실패', '정보 저장 중 오류가 발생했어요. 다시 시도해주세요.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading || showSplash || (Boolean(user?.uid) && profileGateLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F1010' }}>
        <CustomSplash />
      </View>
    );
  }

  if (user && profileGateStatus === 'ready') {
    return <Redirect href="/(tabs)/scan" />;
  }

  if (user && profileGateStatus === 'requires_phone') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F1010' }}>
        <PhoneRequiredModal
          visible
          formattedPhoneNumber={formattedPhoneNumber}
          confirmationPhoneNumber={formattedPhoneNumber}
          hasPhoneValue={hasPhoneValue}
          isPhoneValid={isPhoneValid}
          isSubmitting={isSavingProfile}
          isConfirmationStep={isConfirmationStep}
          onPhoneChange={handlePhoneChange}
          onSubmit={handleSubmitGateInput}
          onBackFromConfirmation={() => setIsConfirmationStep(false)}
          onConfirmSubmit={() => {
            void handleConfirmGateSave();
          }}
        />
      </View>
    );
  }

  if (user && profileGateStatus === 'requires_phone_and_name') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F1010' }}>
        <CompleteProfileModal
          visible
          name={nameInput}
          formattedPhoneNumber={formattedPhoneNumber}
          confirmationPhoneNumber={formattedPhoneNumber}
          hasNameValue={hasNameValue}
          hasPhoneValue={hasPhoneValue}
          isNameValid={nameIsValid}
          isPhoneValid={isPhoneValid}
          isSubmitting={isSavingProfile}
          isConfirmationStep={isConfirmationStep}
          onNameChange={setNameInput}
          onPhoneChange={handlePhoneChange}
          onSubmit={handleSubmitGateInput}
          onBackFromConfirmation={() => setIsConfirmationStep(false)}
          onConfirmSubmit={() => {
            void handleConfirmGateSave();
          }}
        />
      </View>
    );
  }

  return <Redirect href="/(onboarding)" />;
}