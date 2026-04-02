import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { BarlowCondensed_400Regular, BarlowCondensed_900Black_Italic, useFonts } from '@expo-google-fonts/barlow-condensed';
import { useEffect } from 'react';
import { Text } from 'react-native';

export const unstable_settings = {
  anchor: '(onboarding)',
};

//{rop to disable font scaling
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = { fontFamily: 'Pretendard-Bold' }; 

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loadedPretendard, errorPretendard] = useFonts({
    'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Bold': require('@/assets/fonts/Pretendard-Bold.ttf'),
    'Pretendard-Light': require('@/assets/fonts/Pretendard-Light.ttf'),
  });

  const [loadedBarlow, errorBarlow] = useFonts({
    BarlowCondensed_400Regular,
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

  if (!loadedBarlow && !errorBarlow && !loadedPretendard && !errorPretendard) return null;

  return (
    <ThemeProvider value={DarkTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: '#0F0F0F' }
          }}
        >
          <Stack.Screen name="(onboarding)" options={{ headerShown: false, animation: "none"}} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(scan)" options={{ headerShown: false }} />
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
          <Stack.Screen name="(modals)/setGoalModal" 
            options={{ 
              presentation: 'modal', 
              animation: 'fade',
              //animation: 'fade', 
              title: 'Activity', 
              headerShown: false, 
            }} 
          />
        </Stack>
      <StatusBar style="light" />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
