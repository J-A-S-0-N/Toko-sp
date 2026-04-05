import { auth } from '@/config/firebase';
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
};