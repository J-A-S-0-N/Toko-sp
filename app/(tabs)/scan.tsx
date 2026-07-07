import ParkPromotionAdComponent from "@/components/ads/ParkPromotionAdComponent";
import PromoAdComponent from "@/components/ads/PromoAdComponent";
import HomeFeedHeader from "@/components/HomeFeedComponents/homeFeedHeader";
import HomeFeedSkeleton from "@/components/HomeFeedComponents/HomeFeedSkeleton";
import UsernameHeader from "@/components/HomeFeedComponents/usernameHeader";
import InitialAdModal from "@/components/InitialAdModal";
import {
  RecentScansSection,
  ScanFrameSection
} from "@/components/ScanPageComponent";
import { useAuth } from "@/context/AuthContext";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from "expo-router";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import Animated, { FadeOut, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import { createManualScan } from "../(scan)/scanFirebase";

export default function ScanScreen() {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const [showSkeleton, setShowSkeleton] = React.useState(true);
  const [showInitialAdModal, setShowInitialAdModal] = React.useState(false);
  const scrollY = useSharedValue(0);
  const defaultHolesCount = 9;
  const defaultManualScores = React.useMemo(() => Array(defaultHolesCount).fill(3), [defaultHolesCount]);
  const defaultFixedPars = React.useMemo(() => JSON.stringify(Array(defaultHolesCount).fill(3)), [defaultHolesCount]);

  const handleDirectManualRoute = React.useCallback(async () => {
    try {
      const scanDocRef = await createManualScan(defaultHolesCount, user?.uid ?? "");

      router.push({
        pathname: "../(scan)/resultPreview",
        params: {
          holes: String(defaultHolesCount),
          scores: JSON.stringify(defaultManualScores),
          fixedPars: defaultFixedPars,
          startParEdit: "1",
          scanDocId: scanDocRef.id,
        },
      });
    } catch (error) {
      console.error("Failed to create manual scan from scan tab:", error);
      Alert.alert("오류", "직접 입력 준비 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
    }
  }, [defaultFixedPars, defaultHolesCount, defaultManualScores, user?.uid]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
      setShowInitialAdModal(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const handleCloseInitialAdModal = () => {
    setShowInitialAdModal(false);
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
              /*
              router.push({
                pathname: "../(scan)/ParSelectionPage",
                params: {
                  mode: "camera",
                  holes: "9",
                  fixedPars: JSON.stringify(Array(9).fill(3)),
                  startParEdit: "1",
                },
              });
              */

              router.push({
                pathname: "../(scan)/capture",
                params: {
                  holes: String(defaultHolesCount),
                  shotIndex: "1",
                  photos: JSON.stringify([]),
                  fixedPars: defaultFixedPars,
                  startParEdit: "1",
                },
              });
            }}
            onGalleryPress={() => {
              router.push({
                pathname: "../(scan)/ParSelectionPage",
                params: {
                  mode: "camera",
                  holes: "9",
                  fixedPars: JSON.stringify(Array(9).fill(3)),
                  startParEdit: "1",
                },
              });
            }}
            onFramePress={() => {
              void handleDirectManualRoute();
            }}
          />
          <View style={styles.adContainer}>
            <ParkPromotionAdComponent />
          </View>
          <View style={styles.adContainer}>
            <PromoAdComponent />
          </View>
        </Animated.ScrollView>
      )}

      {showInitialAdModal && (
        <InitialAdModal onClose={handleCloseInitialAdModal} />
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
