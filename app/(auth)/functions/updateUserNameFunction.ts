import { db } from '@/config/firebase';
import { collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { setStoredUserName } from './userProfileStorage';

type UpdateUserNameResult =
  | { success: true; username: string }
  | {
      success: false;
      reason: 'missing_uid' | 'empty_name' | 'name_too_long' | 'invalid_chars' | 'name_taken' | 'update_failed';
    };

const INVALID_NAME_CHARS_REGEX = /[^가-힣a-zA-Z0-9\s]/;
const MAX_USERNAME_LENGTH = 10;

export const updateUserName = async (uid: string, nextName: string): Promise<UpdateUserNameResult> => {
  const trimmedName = nextName.trim();

  if (!uid) {
    return { success: false, reason: 'missing_uid' };
  }

  if (!trimmedName) {
    return { success: false, reason: 'empty_name' };
  }

  if (trimmedName.length > MAX_USERNAME_LENGTH) {
    return { success: false, reason: 'name_too_long' };
  }

  if (INVALID_NAME_CHARS_REGEX.test(trimmedName)) {
    return { success: false, reason: 'invalid_chars' };
  }

  try {
    const sameNameSnapshot = await getDocs(
      query(collection(db, 'Users'), where('name', '==', trimmedName), limit(5))
    );

    const isTakenByAnotherUser = sameNameSnapshot.docs.some((docSnapshot) => docSnapshot.id !== uid);
    if (isTakenByAnotherUser) {
      return { success: false, reason: 'name_taken' };
    }

    await updateDoc(doc(db, 'Users', uid), {
      name: trimmedName,
      updatedAt: serverTimestamp(),
    });

    try {
      await updateDoc(doc(db, 'RankingEntries', uid), {
        username: trimmedName,
        updatedAt: serverTimestamp(),
      });
    } catch (rankingError) {
      console.warn('Failed to sync RankingEntries username:', rankingError);
    }

    await setStoredUserName(trimmedName);
    return { success: true, username: trimmedName };
  } catch (error) {
    console.error('Failed to update username:', error);
    return { success: false, reason: 'update_failed' };
  }
};
