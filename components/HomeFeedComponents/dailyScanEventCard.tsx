import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { collection, getCountFromServer } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { moderateScale } from "react-native-size-matters";

const DailyScanEventCard = () => {
  const eventDescription1 = require("@/assets/images/EventDiscription1.png");
  const eventDescription2 = require("@/assets/images/EventDescription2.png");
  const eventDescription3 = require("@/assets/images/3dayGurillaEventImage.png");

  const [dayLeft, setDayLeft] = useState(6);
  const [userCount, setUserCount] = useState(127);
  const [isEventLive, setIsEventLive] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(moderateScale(40))).current;

  useEffect(() => {
    let isMounted = true;

    const fetchParticipantCount = async () => {
      try {
        const primarySnap = await getCountFromServer(collection(db, "User"));
        const primaryCount = primarySnap.data().count;

        if (primaryCount > 0) {
          if (isMounted) setUserCount(primaryCount);
          return;
        }

        const fallbackSnap = await getCountFromServer(collection(db, "Users"));
        if (isMounted) {
          setUserCount(fallbackSnap.data().count);
        }
      } catch (error) {
        console.error("Failed to fetch event participant count:", error);
      }
    };

    fetchParticipantCount();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const eventStartKst = new Date(Date.UTC(currentYear, 5, 18, 15, 0, 0));

      const diffMs = eventStartKst.getTime() - now.getTime();

      if (diffMs <= 0) {
        setIsEventLive(true);
        setDayLeft(0);
        return;
      }

      setIsEventLive(false);
      setDayLeft(Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60 * 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const openEventModal = () => {
    if (isModalVisible) return;

    setIsModalVisible(true);
    sheetTranslateY.setValue(moderateScale(40));

    requestAnimationFrame(() => {
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeEventModal = () => {
    Animated.timing(sheetTranslateY, {
      toValue: moderateScale(40),
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsModalVisible(false);
    });
  };


  return (
    <>
      <LinearGradient
        colors={["#06100D", "#103227", "#144033", "#06100D"]}
        locations={[0, 0.44, 0.54, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.headerRow}>
          <View style={styles.labelWrap}>
            <Feather name="gift" size={moderateScale(14)} color="#49C895" />
            <Text type="barlowLight" style={styles.labelText}>
              3일 깜짝 이벤트
            </Text>
          </View>

          <View style={styles.deadlineWrap}>
            <Text type="barlowLight" style={styles.deadlineSubtext}>
              {isEventLive ? "이벤트 진행중" : `이벤트 시작까지 ${dayLeft}일 남음`}
            </Text>
          </View>
        </View>

        <View style={styles.mainRow}>
          <View style={styles.leftContent}>
            <Text type="barlowHard" style={styles.title}>
              한번만 {"\n"}참여해도!
            </Text>
            <Text type="barlowLight" style={styles.subtitle}>
              스캔하여 경품에 응모하세요!
            </Text>

            <View style={styles.timeBox}>
              <Text type="barlowLight" style={styles.timeLabel}>
                이벤트 진행
              </Text>
              <Text type="barlowHard" style={styles.timeValue}>
                {isEventLive ? "진행중!" : `D-${dayLeft}`}
              </Text>
            </View>

            {/* use app download count */}
            <Text type="barlowLight" style={styles.metaText}>
              오늘 {userCount}명 참여중
            </Text>
          </View>

          <View style={styles.rightContent}>
            <View style={styles.imageContainer}>
              <Image
                source={require("@/assets/images/countdownAdImage.png")}
                style={styles.image}
                resizeMode="cover"
              />
            </View>

            <Pressable style={styles.ctaButton} onPress={openEventModal}>
              <Text type="barlowHard" style={styles.ctaText}>
                자세히보기
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <Modal
        transparent
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={closeEventModal}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeEventModal} />

          <Animated.View
            style={[
              styles.modalSheet,
              {
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <View style={styles.modalHandle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text type="barlowHard" style={styles.modalTitle}>
                이벤트 참여
              </Text>
              <Image
                source={eventDescription2}
                style={[
                  styles.modalEventImage,
                ]}
                //resizeMode="contain"
              />
              <Image
                source={eventDescription1}
                style={[
                  styles.modalEventImage,
                ]}
                resizeMode="contain"
              />
              <Image
                source={eventDescription3}
                style={[
                  styles.modalEventImage,
                ]}
                resizeMode="contain"
              />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    borderColor: "#1E5A41",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: moderateScale(8),
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  labelText: {
    color: "#49C895",
    fontSize: moderateScale(FONT.xs),
  },
  deadlineWrap: {
    alignItems: "flex-end",
    gap: moderateScale(4),
  },
  deadlineBadge: {
    borderWidth: moderateScale(1),
    borderColor: "#2D8F67",
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
    backgroundColor: "rgba(25, 59, 44, 0.7)",
  },
  deadlineBadgeText: {
    color: "#EFFFF4",
    fontSize: moderateScale(FONT.md),
  },
  deadlineSubtext: {
    color: "#8F9F97",
    fontSize: moderateScale(FONT.xxs),
  },
  mainRow: {
    flexDirection: "row",
    marginTop: moderateScale(10),
    gap: moderateScale(10),
  },
  leftContent: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.xxl),
    lineHeight: moderateScale(48),
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#D2E4DA",
    fontSize: moderateScale(FONT.md),
    marginTop: moderateScale(2),
  },
  timeBox: {
    marginTop: moderateScale(12),
    borderWidth: moderateScale(1),
    borderColor: "#1A3D2D",
    borderRadius: moderateScale(14),
    backgroundColor: "rgba(5, 16, 12, 0.7)",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    alignSelf: "flex-start",
  },
  timeLabel: {
    color: "#8C9A93",
    fontSize: moderateScale(FONT.xs),
  },
  timeValue: {
    color: "#4ED095",
    fontSize: moderateScale(FONT.h1),
    letterSpacing: 1,
    marginTop: moderateScale(4),
  },
  metaText: {
    marginTop: moderateScale(10),
    color: "#9CB0A6",
    fontSize: moderateScale(FONT.xs),
  },
  rightContent: {
    width: moderateScale(168),
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  imageContainer: {
    flex: 1,
    borderRadius: moderateScale(16),
    borderWidth: moderateScale(1),
    borderStyle: "dotted",
    borderColor: "#49C895",
    overflow: "hidden",
    minHeight: moderateScale(180),
  },
  image: {
    width: "100%",
    height: "100%",
  },
  ctaButton: {
    marginTop: moderateScale(12),
    borderRadius: moderateScale(999),
    backgroundColor: "#4ED095",
    paddingVertical: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.md),
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  modalSheet: {
    maxHeight: "85%",
    backgroundColor: "#262626",
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(24),
  },
  modalHandle: {
    alignSelf: "center",
    width: moderateScale(48),
    height: moderateScale(3),
    borderRadius: moderateScale(999),
    backgroundColor: "#D1D5DB",
    marginBottom: moderateScale(18),
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.xl),
  },
  modalScrollContent: {
    paddingBottom: moderateScale(24),
    paddingHorizontal: moderateScale(8),
  },
  modalDescription: {
    marginTop: moderateScale(8),
    color: "#CBE2D7",
    fontSize: moderateScale(FONT.md),
  },
  modalEventImage: {
    borderRadius: moderateScale(20),
    height: moderateScale(450),
    marginTop: moderateScale(12),
    width: "100%",
    alignSelf: "center",
  },
});

export default DailyScanEventCard;
