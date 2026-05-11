import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NoticeScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.content} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  content: {
    flex: 1,
  },
});
