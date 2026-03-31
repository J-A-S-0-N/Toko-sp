import { ThemedText as Text } from '@/components/themed-text';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

//Used icons
import Feather from '@expo/vector-icons/Feather';
import Fontisto from '@expo/vector-icons/Fontisto';
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
            tabBarLabel: ({ color }) => <Text style={{ color, fontSize: moderateScale(11) }}>피드</Text>,
            tabBarIcon: ({ color }) => <Octicons name="home" size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            tabBarLabel: ({ color }) => <Text style={{ color, fontSize: moderateScale(11) }}>통계</Text>,
            tabBarIcon: ({ color }) => <Fontisto name="heartbeat-alt" size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            tabBarLabel: ({ focused }) => (
              <Text
                style={{
                  color: focused ? Colors.dark.tabIconSelected : '#FFFFFF',
                  fontSize: moderateScale(11),
                }}>
                스캔
              </Text>
            ),
            tabBarIcon: ({ focused }) => (
              <Feather name="camera" size={20} color={focused ? Colors.dark.tabIconSelected : '#FFFFFF'} />
            ),
/*             tabBarButton: (props) => (
              <View style={[props.style, { justifyContent: 'center', alignItems: 'center' }]}>
                <Pressable
                  onPress={props.onPress}
                  style={{ justifyContent: 'center', alignItems: 'center' }}
                >
                  <View
                    style={{
                      paddingHorizontal: moderateScale(15),
                      paddingVertical: moderateScale(14),
                      //backgroundColor: '#4CAE82',
                      backgroundColor: "white",
                      paddingTop: moderateScale(8),
                      borderRadius: moderateScale(15),
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                      gap: moderateScale(10),
                    }}
                  >
                    <Ionicons name="camera" size={moderateScale(20)} color="black" />
                    <Text
                      style={{
                        color: 'black',
                        fontSize: moderateScale(11),
                      }}
                    >
                      스 캔
                    </Text>
                  </View>
                </Pressable>
              </View>
            ), */
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarLabel: ({ color }) => <Text style={{ color, fontSize: moderateScale(11) }}>내 정보</Text>,
            tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
