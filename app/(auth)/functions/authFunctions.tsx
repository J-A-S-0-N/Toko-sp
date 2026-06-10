

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

// ===== GOOGLE AUTH (added) START — remove this import to revert =====

import { GoogleSignin } from '@react-native-google-signin/google-signin';

// ===== GOOGLE AUTH (added) END =====

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

// ===== GOOGLE AUTH (added) START — remove this block to revert =====

export const signInWithGoogle = async (): Promise<FirebaseAuthTypes.UserCredential> => {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;

  if (!idToken) {
    throw new Error('No idToken returned from Google Sign-In');
  }

  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  return auth().signInWithCredential(googleCredential);
};

// ===== GOOGLE AUTH (added) END =====