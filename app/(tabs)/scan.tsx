import {
    RecentScansSection,
    ScanFrameSection,
    ScanGuideSection
} from "@/components/ScanPageComponent";
import PromoAdComponent from "@/components/ads/PromoAdComponent";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import HoleSelectionModal from "../(scan)/holeSelectionModal";

export default function ScanScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [isHoleModalVisible, setIsHoleModalVisible] = React.useState(false);
  const [scanMode, setScanMode] = React.useState<"camera" | "manual">("camera");

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + moderateScale(48) }]}
        showsVerticalScrollIndicator={false}
      >
        {/*
        <ScanHeader />
        */}
        <RecentScansSection />
        <ScanFrameSection
          onCameraPress={() => {
            setScanMode("camera");
            setIsHoleModalVisible(true);
          }}
          onGalleryPress={() => {
            setScanMode("manual");
            setIsHoleModalVisible(true);
          }}
          onFramePress={() => {
            setScanMode("camera");
            setIsHoleModalVisible(true);
          }}
        />
        <View style={styles.adContainer}>
          <PromoAdComponent />
        </View>
        <ScanGuideSection />
      </ScrollView>

      <HoleSelectionModal
        visible={isHoleModalVisible}
        mode={scanMode}
        onClose={() => setIsHoleModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  container: {
    flex: 1,
    backgroundColor: "#0F1010",
  },
  content: {
    paddingBottom: moderateScale(30),
    paddingTop: moderateScale(16),
    gap: moderateScale(14),
  },
  adContainer: {
    paddingHorizontal: moderateScale(10),
  },
});
