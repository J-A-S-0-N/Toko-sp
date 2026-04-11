/* import { auth } from '@/config/firebase';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

// Send OTP
export const sendVerification = async (phoneNumber: any, recaptchaVerifier: any) => {
  const provider = new PhoneAuthProvider(auth);
  const verificationId = await provider.verifyPhoneNumber(
    phoneNumber,
    recaptchaVerifier.current
  );
  return verificationId;
};

// Confirm OTP
export const confirmCode = async (verificationId: any, code: any) => {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  return await signInWithCredential(auth, credential);
}; */


import auth from '@react-native-firebase/auth';


export const sendVerification = async (phoneNumber: string) => {
  const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
  return confirmation;
};


export const confirmCode = async (verificationId: string, code: string) => {
  const credential = auth.PhoneAuthProvider.credential(verificationId, code);
  return await auth().signInWithCredential(credential);
};
