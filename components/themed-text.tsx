import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'barlowHard' | 'barlowMedium' | 'barlowLight';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      allowFontScaling={true}
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === "barlowHard" ? styles.barlowCondensedHard : undefined,
        type === "barlowMedium" ? styles.barlowCondensedMedium : undefined,
        type === "barlowLight" ? styles.barlowCondensedLight : undefined,
        style,
      ]}
      //{...(Platform.OS === 'android' && { includeFontPadding: false })}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
  },
  defaultSemiBold: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    fontSize: 16,
    color: '#0a7ea4',
  },
  barlowCondensedHard: {
    fontFamily: 'BarlowCondensed_900Black_Italic',
  },
  barlowCondensedMedium: {
    fontFamily: 'BarlowCondensed_500Medium_Italic',
  },
  barlowCondensedLight: {
    fontFamily: 'BarlowCondensed_400Regular',
  },
});
