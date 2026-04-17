

/* 
depreceated code 

import auth from '@react-native-firebase/auth';


export const sendVerification = async (phoneNumber: string) => {
  const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
  return confirmation;
};


export const confirmCode = async (verificationId: string, code: string) => {
  const credential = auth.PhoneAuthProvider.credential(verificationId, code);
  return await auth().signInWithCredential(credential);
}; 
*/


import { getAuth, PhoneAuthProvider, signInWithCredential, signInWithPhoneNumber } from '@react-native-firebase/auth';

const auth = getAuth();

export const sendVerification = async (phoneNumber: string) => {
  const confirmation = await signInWithPhoneNumber(auth, phoneNumber);
  return confirmation;
};

export const confirmCode = async (verificationId: string, code: string) => {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  return await signInWithCredential(auth, credential);
};