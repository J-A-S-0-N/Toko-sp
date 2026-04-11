import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_NAME_KEY = 'auth:user:name';

export const setStoredUserName = async (name: string) => {
  await AsyncStorage.setItem(USER_NAME_KEY, name);
};

export const getStoredUserName = async () => {
  return await AsyncStorage.getItem(USER_NAME_KEY);
};

export const clearStoredUserName = async () => {
  await AsyncStorage.removeItem(USER_NAME_KEY);
};
