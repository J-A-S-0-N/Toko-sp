import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { BarlowCondensed_400Regular, BarlowCondensed_900Black_Italic, useFonts } from '@expo-google-fonts/barlow-condensed';
import { useEffect } from 'react';
import { Text } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
