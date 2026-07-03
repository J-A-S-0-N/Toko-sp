import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';

export default function AppFooter() {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.text}>© 2026 토목코리아. All rights reserved.</Text>
        <Text style={styles.text}>광고문의: jasonchae1404@gmail.com</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0F0F0F',
  },
  container: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 16,
    paddingVertical: moderateScale(5),
  },
  text: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
