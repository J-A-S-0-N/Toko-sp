import auth from '@react-native-firebase/auth';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { db } from '@/config/firebase';

export async function registerPushToken(): Promise<string | null> {
  const user = auth().currentUser;

  if (!user) {
    console.log('[Push] User is not logged in');
    return null;
  }

/*   if (!Device.isDevice) {
    console.log('[Push] Use a physical device for push notifications');
    return null;
  } */

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermission.status;

  if (finalStatus !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Notification permission denied');
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('EAS projectId was not found');
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  const expoPushToken = tokenResult.data;

  await setDoc(
    doc(db, 'Users', user.uid),
    {
      expoPushToken,
      pushTokenUpdatedAt: serverTimestamp(),
      devicePlatform: Platform.OS,
    },
    { merge: true }
  );

  console.log('[Push] Expo push token:', expoPushToken);
  return expoPushToken;
}
