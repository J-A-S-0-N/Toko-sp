import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { SplashScreen, Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import AppFooter from '@/components/AppFooter';
import OfflineBlocker from '@/components/OfflineBlocker';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { registerPushToken } from '@/utils/registerPushToken';

import { BarlowCondensed_400Regular, BarlowCondensed_500Medium_Italic, BarlowCondensed_900Black_Italic, useFonts } from '@expo-google-fonts/barlow-condensed';
import { useEffect } from 'react';
import { Linking, Text } from 'react-native';

//{rop to disable font scaling
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = { fontFamily: 'Pretendard-Bold' }; 

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function RootLayoutContent() {
  const { user, loading } = useAuth();

  const [loadedPretendard, errorPretendard] = useFonts({
    'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Bold': require('@/assets/fonts/Pretendard-Bold.ttf'),
    'Pretendard-Light': require('@/assets/fonts/Pretendard-Light.ttf'),
  });

  const [loadedBarlow, errorBarlow] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_500Medium_Italic,
    BarlowCondensed_900Black_Italic,
  });


  useEffect(() => {
    if ((loadedBarlow || errorBarlow) && (loadedPretendard || errorPretendard)) {
      SplashScreen.hideAsync();
      // Optional: remove after confirming default font works
      const defaultFont = (Text as any).defaultProps?.style?.fontFamily;
      console.log('[Font] Text.defaultProps.fontFamily:', defaultFont);
      if (errorPretendard) console.warn('[Font] Pretendard load failed:', errorPretendard);
    }
  }, [loadedBarlow, errorBarlow, loadedPretendard, errorPretendard]);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    registerPushToken().catch((error) => {
      console.error('[Push] Registration failed:', error);
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Notification received:', notification.request.content);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        screen?: string;
        eventId?: string | number;
        liveUrl?: string;
      };

      console.log('[Push] Notification pressed:', data);

      if (data?.screen === 'event' && data?.eventId != null) {
        router.push({
          pathname: '/(modals)/eventDetailModal',
          params: { eventId: String(data.eventId) },
        });
        return;
      }

      if (data?.screen === 'live') {
        const liveUrl = typeof data.liveUrl === 'string' ? data.liveUrl.trim() : '';
        if (!liveUrl) {
          return;
        }

        Linking.openURL(liveUrl).catch((error) => {
          console.error('[Push] Failed to open live URL:', error);
        });
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [loading, user]);

  if (!loadedBarlow && !errorBarlow && !loadedPretendard && !errorPretendard) return null;

  return (
    <NetworkProvider>
    <ThemeProvider value={DarkTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <OfflineBlocker />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: '#0F0F0F' }
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false, animation: "none"}} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(scan)" options={{ headerShown: false }} />
          <Stack.Screen name="(swing)" options={{ headerShown: false }} />
          <Stack.Screen name="chatRoom" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="(modals)/activityModal" 
            options={{ 
              presentation: 'modal', 
              animation: 'fade',
              //animation: 'fade', 
              title: 'Activity', 
              headerShown: false, 
            }} 
          />
          <Stack.Screen name="(modals)/allRoundsModal" 
            options={{ 
              presentation: 'modal', 
              animation: 'fade',
              title: 'All Rounds', 
              headerShown: false, 
            }} 
          />
          <Stack.Screen name="(modals)/setGoalModal" 
            options={{ 
              presentation: 'modal', 
              animation: 'fade',
              //animation: 'fade', 
              title: 'Activity', 
              headerShown: false, 
            }} 
          />
          <Stack.Screen name="(modals)/rankingModal"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Ranking',
              headerShown: false,
            }}
          />
          <Stack.Screen name="(modals)/eventDetailModal"
            options={{
              presentation: 'modal',
              animation: 'fade',
              title: 'Event Detail',
              headerShown: false,
            }}
          />
          <Stack.Screen name="(modals)/eventResultModal"
            options={{
              presentation: 'modal',
              animation: 'fade',
              title: 'Event Result',
              headerShown: false,
            }}
          />
        </Stack>
        <AppFooter />
      <StatusBar style="light" />
      </GestureHandlerRootView>
    </ThemeProvider>
    </NetworkProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
