/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColor = '#49DF80';

// export const FONT = {
//   xxs: 10,
//   xs: 12,
//   sm: 14,
//   md: 16,
//   lg: 19,
//   xl: 22,
//   xxl: 26,
//   h2: 34,
//   h1: 42,
//   hero: 50,
// };

export const FONT = {
  xxs: 15,
  xs: 17,
  sm: 19,
  md: 21,
  lg: 24,
  xl: 27,
  xxl: 31,
  h2: 39,
  h1: 47,
  hero: 55,
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColor,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColor,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColor,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColor,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
