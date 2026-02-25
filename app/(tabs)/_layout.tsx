import { ThemedText as Text } from '@/components/themed-text';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

//Used icons
import Feather from '@expo/vector-icons/Feather';
import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';

import { moderateScale } from 'react-native-size-matters';

const TAB_BAR_BG = '#191919';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.dark.tabIconSelected,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: TAB_BAR_BG,
            borderTopWidth: 0,
            borderTopColor: 'transparent',
            borderTopLeftRadius: moderateScale(15),
            borderTopRightRadius: moderateScale(15),
            height: moderateScale(80),
            paddingTop: moderateScale(10),
          },
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '피드',
          tabBarIcon: ({ color }) => <Octicons name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '통계',
          tabBarIcon: ({ color }) => <Fontisto name="heartbeat-alt" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarButton: ({ onPress, accessibilityState }) => (
            <Pressable onPress={onPress} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{
                width: moderateScale(50),
                height: moderateScale(50),
                //backgroundColor: accessibilityState?.selected ? '#000' : '#eee',
                backgroundColor: "#4CAE82",
                paddingTop: moderateScale(2),
                borderRadius: moderateScale(10),
                justifyContent: 'center',
                alignItems: 'center',
                //marginTop: moderateScale(5),
              }}>
                <Ionicons name="scan" size={moderateScale(20)} color="white" />
                <Text
                style={{
                  color: "white",
                  fontSize: moderateScale(10),
                  fontWeight: "bold",
                }}
                >스캔</Text>
              </View>
            </Pressable>
          ),
        }}
        /*
        options={{
          title: '스캔',
          tabBarIcon: ({ color }) => <Feather name="camera" size={20} color={color} />,
          tabBarIconStyle: {
            padding: moderateScale(15),
            borderRadius: moderateScale(5),
            backgroundColor: "#4CAE82",
          }
        }}
        */
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '내 정보',
          tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} />,
        }}
      />
    </Tabs>
    </View>
  );
}
