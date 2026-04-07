import { db } from '@/config/firebase';
import { getAdditionalUserInfo, UserCredential } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

type UserProfileData = Record<string, unknown>;

export const saveUserIfNew = async (
  userCredential: UserCredential,
  userData: UserProfileData = {}
) => {
  console.log("starting firestore logging...");
  const { user } = userCredential;
  const additionalUserInfo = getAdditionalUserInfo(userCredential);
  const uid = user?.uid;

  if (!uid || !additionalUserInfo?.isNewUser) {
    return { saved: false, reason: 'existing_user' };
  }

  const userDocRef = doc(db, 'Users', uid);
  const existingDoc = await getDoc(userDocRef);

  if (existingDoc.exists()) {
    return { saved: false, reason: 'already_saved' };
  }

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

  console.log("finished firestore logging wt out error...");
  return { saved: true };
};
