import auth from '@react-native-firebase/auth';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { db } from '@/config/firebase';

const EVENT_PUSH_ACCEPTED_FIELD = 'eventPushAcceptedAt';

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

export async function hasAcceptedEventPushNotification(): Promise<boolean> {
  const user = auth().currentUser;

  if (!user) {
    return false;
  }

  const userDoc = await getDoc(doc(db, 'Users', user.uid));
  if (!userDoc.exists()) {
    return false;
  }

  const userData = userDoc.data() as Record<string, unknown>;
  return Boolean(userData[EVENT_PUSH_ACCEPTED_FIELD]);
}

export async function acceptEventPushNotification(): Promise<'accepted' | 'already_accepted' | 'permission_denied' | 'not_logged_in'> {
  const user = auth().currentUser;

  if (!user) {
    return 'not_logged_in';
  }

  const userRef = doc(db, 'Users', user.uid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data() as Record<string, unknown> | undefined;
  const isAlreadyAccepted = Boolean(userData?.[EVENT_PUSH_ACCEPTED_FIELD]);

  if (isAlreadyAccepted) {
    return 'already_accepted';
  }

  const expoPushToken = await registerPushToken();
  if (!expoPushToken) {
    return 'permission_denied';
  }

  await setDoc(
    userRef,
    {
      eventPushEnabled: true,
      [EVENT_PUSH_ACCEPTED_FIELD]: serverTimestamp(),
      eventPushUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return 'accepted';
}
