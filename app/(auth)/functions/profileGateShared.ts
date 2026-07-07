import { db } from '@/config/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getUidByUsernameExact } from './loginFetchUserFunction';

export type ProfileGateStatus = 'ready' | 'requires_phone' | 'requires_phone_and_name';

export type ProfileGateSaveErrorCode =
  | 'MISSING_UID'
  | 'INVALID_PHONE'
  | 'INVALID_NAME'
  | 'DUPLICATE_USERNAME';

export class ProfileGateSaveError extends Error {
  code: ProfileGateSaveErrorCode;

  constructor(code: ProfileGateSaveErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export const normalizePhoneDigits = (value: string) => value.replace(/\D/g, '').slice(0, 11);

export const formatPhoneNumber = (digits: string) => {
  const normalizedDigits = normalizePhoneDigits(digits);

  if (normalizedDigits.length <= 3) {
    return normalizedDigits;
  }

  if (normalizedDigits.length <= 7) {
    return `${normalizedDigits.slice(0, 3)}-${normalizedDigits.slice(3)}`;
  }

  return `${normalizedDigits.slice(0, 3)}-${normalizedDigits.slice(3, 7)}-${normalizedDigits.slice(7, 11)}`;
};

export const toKoreanE164PhoneNumber = (digits: string) => {
  const normalizedDigits = normalizePhoneDigits(digits);
  return `+82${normalizedDigits.replace(/^0/, '')}`;
};

export const isValidName = (name: string) => {
  const trimmed = name.trim();
  const hasValue = trimmed.length > 0;
  const hasInvalidChars = /[^가-힣a-zA-Z0-9\s]/.test(trimmed);
  const isTooLong = trimmed.length > 10;
  return hasValue && !hasInvalidChars && !isTooLong;
};

export const isValidPhoneDigits = (digits: string) => normalizePhoneDigits(digits).length >= 10;

type SaveMissingProfileParams = {
  uid: string | null | undefined;
  requiresName: boolean;
  nameInput: string;
  phoneDigits: string;
  userDocExists: boolean;
};

type SaveMissingProfileResult = {
  savedName: string | null;
};

export const saveMissingProfile = async ({
  uid,
  requiresName,
  nameInput,
  phoneDigits,
  userDocExists,
}: SaveMissingProfileParams): Promise<SaveMissingProfileResult> => {
  if (!uid) {
    throw new ProfileGateSaveError('MISSING_UID', '사용자 정보가 없어 저장할 수 없어요.');
  }

  if (!isValidPhoneDigits(phoneDigits)) {
    throw new ProfileGateSaveError('INVALID_PHONE', '전화번호 형식이 올바르지 않아요.');
  }

  const trimmedName = nameInput.trim();

  if (requiresName && !isValidName(trimmedName)) {
    throw new ProfileGateSaveError('INVALID_NAME', '사용자명을 다시 확인해주세요.');
  }

  if (requiresName) {
    const existingUid = await getUidByUsernameExact(trimmedName);

    if (existingUid && existingUid !== uid) {
      throw new ProfileGateSaveError('DUPLICATE_USERNAME', '이미 사용 중인 사용자명이에요.');
    }
  }

  const payload: Record<string, unknown> = {
    uid,
    phoneNumber: toKoreanE164PhoneNumber(phoneDigits),
    updatedAt: serverTimestamp(),
  };

  if (!userDocExists) {
    payload.createdAt = serverTimestamp();
  }

  if (requiresName) {
    payload.name = trimmedName;
  }

  await setDoc(doc(db, 'Users', uid), payload, { merge: true });

  return {
    savedName: requiresName ? trimmedName : null,
  };
};
