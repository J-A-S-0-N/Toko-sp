import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AppFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>© 2026 토목코리아. All rights reserved.</Text>
      <Text style={styles.text}>광고문의: jasonchae1404@gmail.com</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
