import {
  RecentScansSection,
  ScanFrameSection,
  ScanGuideSection,
  ScanHeader,
} from "@/components/ScanPageComponent";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

export default function ScanScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScanHeader />
        <RecentScansSection />
        <ScanFrameSection />
        <ScanGuideSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0C0D",
  },
  container: {
    flex: 1,
    backgroundColor: "#0A0C0D",
  },
  content: {
    paddingBottom: moderateScale(30),
    gap: moderateScale(14),
  },
});
