import { db } from '@/config/firebase';
import { UserCredential } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { setStoredUserName } from './userProfileStorage';

type UserProfileData = Record<string, unknown>;

export const saveUserInfo = async (
  userCredential: UserCredential,
  userData: UserProfileData = {}
) => {
  try{
    const { user } = userCredential;
    const uid = user?.uid;

    if (!uid) {
      return { saved: false, reason: 'missing_uid' };
    }

    const userDocRef = doc(db, 'Users', uid);

    await setDoc(
      userDocRef,
      {
        uid,
        phoneNumber: user.phoneNumber ?? null,
        createdAt: serverTimestamp(),
        ...userData,
      },
      { merge: true }
    );

    const incomingName = userData?.name;
    if (typeof incomingName === 'string' && incomingName.trim().length > 0) {
      await setStoredUserName(incomingName.trim());
    }

    return { saved: true };
  } catch(error) {
    console.error("error saving user info ", error);
    return { saved: false };
  }
};
