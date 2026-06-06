import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

let pendingConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

export const setPendingConfirmation = (confirmation: FirebaseAuthTypes.ConfirmationResult) => {
  pendingConfirmation = confirmation;
};

export const getPendingConfirmation = () => pendingConfirmation;

export const clearPendingConfirmation = () => {
  pendingConfirmation = null;
};
