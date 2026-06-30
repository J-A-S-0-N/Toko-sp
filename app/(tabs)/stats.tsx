import { ThemedText as Text } from "@/components/themed-text";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

import { EventItem, fetchPublishedEventsByStatus } from "@/services/eventService";

type EventTab = "ongoing" | "upcoming" | "ended";

const TAB_ITEMS: { key: EventTab; label: string }[] = [
  { key: "ongoing", label: "진행중" },
  { key: "upcoming", label: "예정" },
  { key: "ended", label: "종료됨" },
];

export default function StatsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState<EventTab>("ongoing");
  const [isLoading, setIsLoading] = useState(true);
  const [eventsByTab, setEventsByTab] = useState<Record<EventTab, EventItem[]>>({
    ongoing: [],
    upcoming: [],
    ended: [],
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const groupedEvents = await fetchPublishedEventsByStatus();
        setEventsByTab(groupedEvents);
      } catch (error) {
        console.error("Failed to fetch event data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const activeEvent = useMemo(() => {
    if (activeTab === "upcoming") {
      return null;
    }
    return eventsByTab[activeTab][0] ?? null;
  }, [activeTab, eventsByTab]);

  const formatDateBadge = (date: Date | null) => {
    if (!date) return { month: "-", day: "--" };
    return {
      month: `${date.getMonth() + 1}월`,
      day: `${date.getDate()}`.padStart(2, "0"),
    };
  };

  const formatRange = (startAt: Date | null, endAt: Date | null) => {
    if (!startAt || !endAt) return "일정 정보 없음";
    return `${startAt.getMonth() + 1}월 ${startAt.getDate()}일 - ${endAt.getMonth() + 1}월 ${endAt.getDate()}일`;
  };

  const getRemainingLabel = (endAt: Date | null) => {
    if (!endAt) return "진행중";
    const diffMs = endAt.getTime() - Date.now();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return `${daysLeft}일 남음`;
  };

  const onPressActionButton = () => {
    if (!activeEvent) return;

    if (activeTab === "ongoing") {
      router.push({
        pathname: "/(modals)/eventDetailModal",
        params: { eventId: activeEvent.id },
      });
      return;
    }

    router.push({
      pathname: "/(modals)/eventResultModal",
      params: { eventId: activeEvent.id },
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + moderateScale(150) }]}
      >
        <View>
          <Text type="barlowHard" style={styles.pageTitle}>경품 이벤트</Text>
          <Text type="barlowLight" style={styles.pageSubtitle}>스코어를 기록하고 경품 이벤트에 참여해보세요.</Text>
        </View>

        <View style={styles.tabRow}>
          {TAB_ITEMS.map((item) => {
            const selected = activeTab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setActiveTab(item.key)}
                style={[styles.tabButton, selected && styles.tabButtonSelected]}
              >
                <Text type="barlowHard" style={[styles.tabButtonText, selected && styles.tabButtonTextSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "upcoming" ? (
          <>
            <Text type="barlowHard" style={styles.sectionTitle}>다가오는 이벤트</Text>
            {isLoading ? (
              <View style={styles.noticeBox}>
                <ActivityIndicator size="small" color="#8ED0AA" />
              </View>
            ) : eventsByTab.upcoming.length === 0 ? (
              <View style={styles.noticeBox}>
                <Text type="barlowLight" style={styles.noticeText}>예정된 이벤트가 없습니다.</Text>
              </View>
            ) : (
              <>
                {eventsByTab.upcoming.map((event) => {
                  const badgeDate = formatDateBadge(event.startAt);
                  return (
                    <View key={event.id} style={styles.upcomingCard}>
                      <View style={styles.dateBadge}>
                        <Text type="barlowHard" style={styles.dateMonth}>{badgeDate.month}</Text>
                        <Text type="barlowHard" style={styles.dateDay}>{badgeDate.day}</Text>
                      </View>
                      <View style={styles.upcomingMain}>
                        <Text type="barlowHard" style={styles.upcomingTitle}>{event.title}</Text>
                        <Text type="barlowLight" style={styles.upcomingDesc}>{event.description}</Text>
                        <View style={styles.upcomingMetaRow}>
                          <Text type="barlowLight" style={styles.upcomingPrize}>경품: {event.prize || "-"}</Text>
                          <Text type="barlowHard" style={styles.upcomingStatus}>시작 전</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}

                <View style={styles.noticeBox}>
                  <Text type="barlowLight" style={styles.noticeText}>예정 이벤트는 시작일이 되면 진행중 탭에서 참여할 수 있습니다.</Text>
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.mainCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.smallPill}>
                <Text type="barlowHard" style={styles.smallPillText}>{activeTab === "ongoing" ? "진행중" : "종료됨"}</Text>
              </View>
              <Text type="barlowLight" style={styles.cardTopMeta}>
                {activeTab === "ongoing" ? getRemainingLabel(activeEvent?.endAt ?? null) : "이벤트 종료"}
              </Text>
            </View>

            <LinearGradient
              colors={["#0B4F2D", "#1F8245", "#6AD48D"]}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <View style={styles.bannerGlow} />
              <Text type="barlowLight" style={styles.bannerLabel}>{activeTab === "ongoing" ? "이번 달 경품" : "지난 이벤트"}</Text>
              <Text type="barlowHard" style={styles.bannerTitle}>
                {activeEvent?.prize || (activeTab === "ongoing" ? "진행중 이벤트" : "종료된 이벤트")}
              </Text>
              <Text type="barlowHard" style={styles.bannerGift}>🎁</Text>
            </LinearGradient>

            <Text type="barlowHard" style={styles.cardTitle}>
              {activeEvent?.title || "이벤트 정보 없음"}
            </Text>
            <Text type="barlowLight" style={styles.cardDescription}>
              {activeTab === "ongoing"
                ? activeEvent?.description || "진행중인 이벤트가 없습니다."
                : activeEvent?.resultSummary || "지난 이벤트 결과를 확인할 수 없습니다."}
            </Text>

            <View style={styles.detailBox}>
              {activeTab === "ongoing" ? (
                <>
                  <View style={styles.detailRow}>
                    <Text type="barlowLight" style={styles.detailKey}>경품</Text>
                    <Text type="barlowHard" style={styles.detailValue}>{activeEvent?.prize || "-"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text type="barlowLight" style={styles.detailKey}>이벤트 기간</Text>
                    <Text type="barlowHard" style={styles.detailValue}>{formatRange(activeEvent?.startAt ?? null, activeEvent?.endAt ?? null)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text type="barlowLight" style={styles.detailKey}>참여 방식</Text>
                    <Text type="barlowHard" style={styles.detailValue}>{activeEvent?.participationMethod || "-"}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.detailRow}>
                    <Text type="barlowLight" style={styles.detailKey}>경품</Text>
                    <Text type="barlowHard" style={styles.detailValue}>{activeEvent?.prize || "-"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text type="barlowLight" style={styles.detailKey}>참여자</Text>
                    <Text type="barlowHard" style={styles.detailValue}>{`${activeEvent?.participantCount ?? 0}명`}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text type="barlowLight" style={styles.detailKey}>당첨자</Text>
                    <Text type="barlowHard" style={styles.detailValue}>{activeEvent?.winnerText || "-"}</Text>
                  </View>
                </>
              )}
            </View>

            <Pressable
              style={[
                styles.actionButton,
                activeTab === "ended" && styles.actionButtonEnded,
                !activeEvent && { opacity: 0.5 },
              ]}
              onPress={onPressActionButton}
              disabled={!activeEvent}
            >
              <Text type="barlowHard" style={[styles.actionButtonText, activeTab === "ended" && styles.actionButtonTextEnded]}>
                {activeTab === "ongoing" ? "스코어 기록하고 참여하기" : "결과 보기"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(8),
    gap: moderateScale(16),
  },
  pageTitle: {
    fontSize: moderateScale(26),
    color: "#F3F5F4",
  },
  pageSubtitle: {
    fontSize: moderateScale(15),
    color: "#8E9592",
    //marginTop: moderateScale(2),
  },
  tabRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginTop: moderateScale(8),
  },
  tabButton: {
    paddingHorizontal: moderateScale(22),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(24),
    backgroundColor: "#1F2222",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  tabButtonSelected: {
    backgroundColor: "#238545",
    shadowColor: "#238545",
    shadowOpacity: 0.34,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  tabButtonText: {
    fontSize: moderateScale(16),
    color: "#A3ABA8",
  },
  tabButtonTextSelected: {
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    color: "#ECEFEE",
    marginTop: moderateScale(6),
  },
  mainCard: {
    backgroundColor: "#171919",
    borderRadius: moderateScale(24),
    padding: moderateScale(14),
    gap: moderateScale(14),
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallPill: {
    backgroundColor: "#1D3A2A",
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
  },
  smallPillText: {
    color: "#D6F5E4",
    fontSize: moderateScale(12),
  },
  cardTopMeta: {
    color: "#8B9390",
    fontSize: moderateScale(15),
  },
  banner: {
    borderRadius: moderateScale(24),
    backgroundColor: "#238545",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(18),
    minHeight: moderateScale(136),
    overflow: "hidden",
    justifyContent: "space-between",
  },
  bannerGlow: {
    position: "absolute",
    right: moderateScale(36),
    top: moderateScale(-18),
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(55),
    backgroundColor: "rgba(171, 235, 198, 0.26)",
  },
  bannerLabel: {
    color: "#CEEFDA",
    fontSize: moderateScale(8),
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    marginTop: moderateScale(8),
  },
  bannerGift: {
    position: "absolute",
    right: moderateScale(22),
    bottom: moderateScale(16),
    fontSize: moderateScale(30),
  },
  cardTitle: {
    fontSize: moderateScale(23),
    color: "#F2F4F3",
  },
  cardDescription: {
    fontSize: moderateScale(17),
    color: "#8E9592",
    lineHeight: moderateScale(24),
  },
  detailBox: {
    borderRadius: moderateScale(18),
    backgroundColor: "#1F2222",
    padding: moderateScale(16),
    gap: moderateScale(10),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailKey: {
    color: "#9CA4A1",
    fontSize: moderateScale(16),
  },
  detailValue: {
    color: "#F0F3F2",
    fontSize: moderateScale(16),
  },
  participationBox: {
    borderRadius: moderateScale(18),
    backgroundColor: "#2A2318",
    borderWidth: 1,
    borderColor: "#5B4A2C",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    gap: moderateScale(6),
  },
  participationTitle: {
    color: "#F3E6CB",
    fontSize: moderateScale(10),
  },
  participationDesc: {
    color: "#B79E72",
    fontSize: moderateScale(8),
  },
  actionButton: {
    borderRadius: moderateScale(18),
    backgroundColor: "#238545",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(18),
  },
  actionButtonEnded: {
    backgroundColor: "#2A2D2C",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(18),
  },
  actionButtonTextEnded: {
    color: "#D4D9D7",
  },
  upcomingCard: {
    backgroundColor: "#171919",
    borderRadius: moderateScale(24),
    padding: moderateScale(14),
    flexDirection: "row",
    gap: moderateScale(14),
  },
  dateBadge: {
    width: moderateScale(68),
    height: moderateScale(86),
    borderRadius: moderateScale(18),
    backgroundColor: "#202B25",
    alignItems: "center",
    justifyContent: "center",
  },
  dateMonth: {
    fontSize: moderateScale(15),
    color: "#66C784",
  },
  dateDay: {
    marginTop: moderateScale(2),
    fontSize: moderateScale(21),
    color: "#66C784",
  },
  upcomingMain: {
    flex: 1,
    gap: moderateScale(8),
  },
  upcomingTitle: {
    fontSize: moderateScale(21),
    color: "#EEF2F0",
  },
  upcomingDesc: {
    fontSize: moderateScale(16),
    color: "#8D9592",
    lineHeight: moderateScale(23),
  },
  upcomingMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upcomingPrize: {
    color: "#A0A8A5",
    fontSize: moderateScale(16),
  },
  upcomingStatus: {
    color: "#66C784",
    fontSize: moderateScale(16),
  },
  noticeBox: {
    borderRadius: moderateScale(18),
    backgroundColor: "#1D2B22",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(4),
  },
  noticeText: {
    color: "#8ED0AA",
    fontSize: moderateScale(16),
  },
});
