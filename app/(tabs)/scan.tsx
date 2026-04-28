import {
    RecentScansSection,
    ScanFrameSection,
    ScanGuideSection
} from "@/components/ScanPageComponent";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import HoleSelectionModal from "../(scan)/holeSelectionModal";

export default function ScanScreen() {
  const [isHoleModalVisible, setIsHoleModalVisible] = React.useState(false);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/*
        <ScanHeader />
        */}
        <RecentScansSection />
        <ScanFrameSection 
          onCameraPress={() => {
            setIsHoleModalVisible(true);
          }} 
          onGalleryPress={() => {}} 
          onFramePress={() => {}} 
        />
        <ScanGuideSection />
      </ScrollView>

      <HoleSelectionModal
        visible={isHoleModalVisible}
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
    gap: moderateScale(14),
  },
});
