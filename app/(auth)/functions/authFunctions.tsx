

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


import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export const sendVerification = (
  phoneNumber: string,
): Promise<FirebaseAuthTypes.ConfirmationResult> => {
  return auth().signInWithPhoneNumber(phoneNumber);
};

export const confirmCode = (
  confirmation: FirebaseAuthTypes.ConfirmationResult,
  code: string,
) => {
  return confirmation.confirm(code);
};