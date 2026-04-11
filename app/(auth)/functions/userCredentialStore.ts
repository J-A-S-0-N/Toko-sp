let pendingUserCredential: unknown = null;

export const setPendingUserCredential = (userCredential: unknown) => {
  pendingUserCredential = userCredential;
};

export const getPendingUserCredential = () => pendingUserCredential;

export const clearPendingUserCredential = () => {
  pendingUserCredential = null;
};
