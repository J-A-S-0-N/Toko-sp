import { db } from '@/config/firebase';
import { UserCredential } from 'firebase/auth';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
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

    // Initialize Stats subcollection
    const statsRef = collection(userDocRef, 'Stats');
    const defaultStats = {
      averageScore: 0,
      bestScore: 999,
      roundsPlayed: 0,
      totalStrokes: 0,
      averageDelta: 0,
      lastUpdated: serverTimestamp(),
    };

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    await setDoc(doc(statsRef, 'AllTimeScore'), defaultStats);
    await setDoc(doc(statsRef, 'WeeklyScore'), {
      ...defaultStats,
      weekStartDate: weekStart,
      weekEndDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    });
    await setDoc(doc(statsRef, 'MonthlyScore'), {
      ...defaultStats,
      month: new Date(now.getFullYear(), now.getMonth(), 1),
    });

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
