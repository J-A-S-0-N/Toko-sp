import { ThemedText as Text } from '@/components/themed-text';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Octicons from '@expo/vector-icons/Octicons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';
import { moderateScale } from 'react-native-size-matters';

const ACTIVE = '#3CC06E';
const INACTIVE = '#7A8482';
const BAR_BG = '#161717';
const SELECTED_BG = '#262828';
const SELECTED_BORDER = '#383B3B';
const BORDER = '#22262A';

type TabKey = 'index' | 'stats' | 'scan' | 'profile' | 'notice';

type TabItem = {
  key: TabKey;
  label: string;
  isCenter?: boolean;
  disabled?: boolean;
  renderIcon?: (color: string) => React.ReactNode;
};

const ITEMS: TabItem[] = [
  {
    key: 'index',
    label: '피드',
    renderIcon: (color) => <Octicons name="home" size={moderateScale(23)} color={color} />,
  },
  {
    key: 'stats',
    label: '이벤트',
    renderIcon: (color) => (
      <MaterialCommunityIcons name="waves" size={moderateScale(25)} color={color} />
    ),
  },
  { key: 'scan', label: '스캔', isCenter: true },
  {
    key: 'notice',
    label: '채팅',
    renderIcon: (color) => <Feather name="menu" size={moderateScale(23)} color={color} />,
  },
  {
    key: 'profile',
    label: '내 정보',
    renderIcon: (color) => <Feather name="disc" size={moderateScale(23)} color={color} />,
  },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedRouteName = state.routes[state.index]?.name;

  const handlePress = (item: TabItem) => {
    if (item.disabled) return;
    if (focusedRouteName === item.key) return;
    navigation.navigate(item.key as never);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer,
        { paddingBottom: Math.max(insets.bottom + moderateScale(4), moderateScale(4)) },
      ]}
    >
      <Shadow
        distance={moderateScale(28)}
        startColor="rgba(0,0,0,0.55)"
        endColor="rgba(0,0,0,0)"
        offset={[0, moderateScale(10)]}
        stretch
        style={styles.shadowWrap}
        containerStyle={{ alignSelf: 'stretch' }}
      >
      <View style={styles.bar}>
        {ITEMS.map((item) => {
          const focused = focusedRouteName === item.key;

          if (item.isCenter) {
            return (
              <Pressable
                key={item.key}
                onPress={() => handlePress(item)}
                style={styles.centerWrap}
                hitSlop={moderateScale(8)}
                android_ripple={{ color: 'transparent', borderless: true }}
              >
                <View style={styles.scanBtn}>
                  <MaterialCommunityIcons
                    name="record-circle-outline"
                    size={moderateScale(31)}
                    color="#0F1010"
                  />
                </View>
                <Text
                  type="barlowHard"
                  style={[
                    styles.label,
                    { color: focused ? ACTIVE : INACTIVE, marginTop: moderateScale(6) },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }

          const color = item.disabled ? INACTIVE : focused ? ACTIVE : INACTIVE;

          return (
            <Pressable
              key={item.key}
              onPress={() => handlePress(item)}
              style={styles.tab}
              hitSlop={moderateScale(6)}
              android_ripple={{ color: 'transparent', borderless: true }}
            >
              <View style={styles.iconWrap}>
                <View style={[styles.iconWrapInner, focused && styles.iconWrapFocused]}>
                  {item.renderIcon?.(color)}
                </View>
              </View>
              <Text type="barlowHard" style={[styles.label, { color }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      </Shadow>
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      <Tabs
        initialRouteName="scan"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="stats" />
        <Tabs.Screen name="scan" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="notice" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: moderateScale(4),
    paddingTop: moderateScale(8),
  },
  shadowWrap: {
    width: '100%',
    borderRadius: moderateScale(28),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BAR_BG,
    borderRadius: moderateScale(28),
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: moderateScale(8),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(10),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(4),
  },
  iconWrap: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrapInner: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapFocused: {
    backgroundColor: SELECTED_BG,
    borderWidth: 1,
    borderColor: SELECTED_BORDER,
  },
  label: {
    fontSize: moderateScale(11),
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    //marginTop: moderateScale(-18),
  },
  scanBtn: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(14),
    backgroundColor: ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACTIVE,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
