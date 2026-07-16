import { db } from '@/config/firebase';
//import auth from '@react-native-firebase/auth';
import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getStoredUserName, setStoredUserName } from './userProfileStorage';

type LoginFetchUserResult = {
  name: string | null;
  source: 'firestore' | 'cache' | 'none';
};

export type UserProfileGateSnapshot = {
  exists: boolean;
  name: string | null;
  phoneNumber: string | null;
};

//depreceated code

/* export const getCurrentUid = () => auth().currentUser?.uid ?? null;

export const requiresPhoneVerification = () => !getCurrentUid(); */

const auth = getAuth();

export const getCurrentUid = () => auth.currentUser?.uid ?? null;
export const requiresPhoneVerification = () => !getCurrentUid();

export const checkUserExistsByPhoneNumber = async (phoneNumber: string) => {
  if (!phoneNumber) {
    return false;
  }

  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking user existence by phone number:', error);
    return false;
  }
};

export const checkUserExistsByUid = async (uid: string) => {
  if (!uid) {
    return false;
  }

  try {
    const userDocRef = doc(db, 'Users', uid);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking user existence by uid:', error);
    return false;
  }
};

export const getUserProfileGateSnapshot = async (uid: string): Promise<UserProfileGateSnapshot> => {
  if (!uid) {
    return {
      exists: false,
      name: null,
      phoneNumber: null,
    };
  }

  try {
    const userDocRef = doc(db, 'Users', uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return {
        exists: false,
        name: null,
        phoneNumber: null,
      };
    }

    const data = userDoc.data();
    const name = typeof data?.name === 'string' && data.name.trim().length > 0 ? data.name.trim() : null;
    const phoneNumber =
      typeof data?.phoneNumber === 'string' && data.phoneNumber.trim().length > 0
        ? data.phoneNumber.trim()
        : null;

    return {
      exists: true,
      name,
      phoneNumber,
    };
  } catch (error) {
    console.error('Error fetching user profile gate snapshot:', error);
    throw error;
  }
};

export const getUidByPhoneNumber = async (phoneNumber: string): Promise<string | null> => {
  if (!phoneNumber) {
    return null;
  }

  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const firstDoc = snapshot.docs[0];
    const dataUid = typeof firstDoc.data()?.uid === 'string' ? firstDoc.data().uid : null;
    return dataUid ?? firstDoc.id;
  } catch (error) {
    console.error('Error fetching uid by phone number:', error);
    return null;
  }
};

export const getUidByUsernameExact = async (name: string): Promise<string | null> => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return null;
  }

  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('name', '==', trimmedName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const firstDoc = snapshot.docs[0];
    const dataUid = typeof firstDoc.data()?.uid === 'string' ? firstDoc.data().uid : null;
    return dataUid ?? firstDoc.id;
  } catch (error) {
    console.error('Error fetching uid by username:', error);
    return null;
  }
};

export const loginFetchUserName = async (uid: string): Promise<LoginFetchUserResult> => {
  if (!uid) {
    const cachedName = await getStoredUserName();
    return {
      name: cachedName,
      source: cachedName ? 'cache' : 'none',
    };
  }

  try {
    const userDocRef = doc(db, 'Users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const name = typeof userData?.name === 'string' ? userData.name.trim() : '';

      if (name.length > 0) {
        await setStoredUserName(name);
        return { name, source: 'firestore' };
      }
    }
  } catch (error) {
    console.error('Error fetching login user info:', error);
  }

  const cachedName = await getStoredUserName();
  return {
    name: cachedName,
    source: cachedName ? 'cache' : 'none',
  };
};
