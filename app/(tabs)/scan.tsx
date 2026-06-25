import AdRequestModal from "@/components/AdRequestModal";
import PromoAdComponent from "@/components/ads/PromoAdComponent";
import HomeFeedHeader from "@/components/HomeFeedComponents/homeFeedHeader";
import HomeFeedSkeleton from "@/components/HomeFeedComponents/HomeFeedSkeleton";
import UsernameHeader from "@/components/HomeFeedComponents/usernameHeader";
import {
  RecentScansSection,
  ScanFrameSection
} from "@/components/ScanPageComponent";
import SecondAdRequestModal from "@/components/SecondAdRequestModal";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeOut, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import HoleSelectionModal from "../(scan)/holeSelectionModal";

export default function ScanScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [showSkeleton, setShowSkeleton] = React.useState(true);
  const [showAdRequestModal, setShowAdRequestModal] = React.useState(false);
  const [showSecondAdRequestModal, setShowSecondAdRequestModal] = React.useState(false);
  const [isHoleModalVisible, setIsHoleModalVisible] = React.useState(false);
  const [scanMode, setScanMode] = React.useState<"camera" | "manual">("camera");
  const scrollY = useSharedValue(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
      setShowAdRequestModal(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const handleCloseFirstAdModal = () => {
    setShowAdRequestModal(false);
    setShowSecondAdRequestModal(true);
  };

  const handleCloseSecondAdModal = () => {
    setShowSecondAdRequestModal(false);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {showSkeleton ? (
        <Animated.View exiting={FadeOut.duration(400)} style={styles.skeletonContainer}>
          <HomeFeedSkeleton />
        </Animated.View>
      ) : (
        <Animated.ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + moderateScale(150) }]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={styles.headerStack}>
            <View style={styles.headerBlock}>
              <HomeFeedHeader scrollY={scrollY} />
            </View>
            <View style={styles.usernameHeaderBlock}>
              <UsernameHeader />
            </View>
          </View>

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
        </Animated.ScrollView>
      )}

      <HoleSelectionModal
        visible={isHoleModalVisible}
        mode={scanMode}
        onClose={() => setIsHoleModalVisible(false)}
      />

      {showAdRequestModal && (
        <AdRequestModal onClose={handleCloseFirstAdModal} />
      )}

      {showSecondAdRequestModal && (
        <SecondAdRequestModal onClose={handleCloseSecondAdModal} />
      )}
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
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(10),
    paddingTop: moderateScale(12),
  },
  content: {
    paddingBottom: moderateScale(30),
    paddingTop: moderateScale(16),
    gap: moderateScale(14),
  },
  headerStack: {
    paddingHorizontal: moderateScale(10),
  },
  headerBlock: {
    marginBottom: moderateScale(15),
  },
  usernameHeaderBlock: {
    marginBottom: moderateScale(8),
  },
  adContainer: {
    paddingHorizontal: moderateScale(10),
  },
});
