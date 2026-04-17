import { db } from '@/config/firebase';
//import auth from '@react-native-firebase/auth';
import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getStoredUserName, setStoredUserName } from './userProfileStorage';

type LoginFetchUserResult = {
  name: string | null;
  source: 'firestore' | 'cache' | 'none';
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
