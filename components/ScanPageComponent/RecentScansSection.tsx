import { ThemedText as Text } from "@/components/themed-text";
import { FONT } from '@/constants/theme';
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type RecentScan = {
  date: string;
  course: string;
  score: number;
  diff: string;
};

const RECENT_SCANS: RecentScan[] = [
  { date: "2월 22일", course: "페블 비치 골프 링크스", score: 78, diff: "+6" },
  { date: "2월 15일", course: "오거스타 내셔널", score: 83, diff: "+11" },
  { date: "2월 8일", course: "TPC 소그래스", score: 81, diff: "+9" },
];

type RecentScansSectionProps = {
  scans?: RecentScan[];
};

const RecentScansSection = ({ scans = [] }: RecentScansSectionProps) => {
  const router = useRouter();

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text type="barlowHard" style={styles.sectionTitle}>
          최근 스캔
        </Text>
        <TouchableOpacity onPress={() => router.push("/(modals)/allRoundsModal")}>
          <Text type="barlowLight" style={styles.sectionAction}>
            전체 보기
          </Text>
        </TouchableOpacity>
      </View>

      {scans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="camera" size={moderateScale(20)} color="#636A6C" />
            </View>
            <Text type="barlowHard" style={styles.emptyTitle}>
              아직 스캔 기록이 없어요
            </Text>
            <Text type="barlowLight" style={styles.emptySubtitle}>
              첫 번째 스코어카드를 스캔해보세요
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
          style={styles.recentContainer}
        >
          {scans.map((item) => (
            <View key={`${item.date}-${item.course}`} style={styles.recentCard}>
              <Text type="barlowLight" style={styles.recentDate}>
                {item.date}
              </Text>
              <Text type="barlowHard" style={styles.recentCourse}>
                {item.course}
              </Text>
              <View style={styles.scoreRow}>
                <Text type="barlowHard" style={styles.recentScore}>
                  {item.score}
                </Text>
                <Text type="barlowLight" style={styles.recentDiff}>
                  {item.diff}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: moderateScale(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#E5E9E6",
    fontSize: moderateScale(FONT.md),
  },
  sectionAction: {
    color: "#45BF8F",
    fontSize: moderateScale(FONT.xs),
  },
  recentContainer: {
    paddingLeft: moderateScale(10),
  },
  recentList: {
    gap: moderateScale(10),
    paddingRight: moderateScale(8),
  },
  recentCard: {
    width: moderateScale(140),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#292E31",
    backgroundColor: "#1F2222",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    gap: moderateScale(5),
  },
  recentDate: {
    color: "#636A6C",
    fontSize: moderateScale(FONT.xs),
  },
  recentCourse: {
    color: "#EDF0ED",
    fontSize: moderateScale(FONT.md),
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: moderateScale(4),
    marginTop: "auto",
  },
  recentScore: {
    color: "#FF4E57",
    fontSize: moderateScale(FONT.h2),
  },
  recentDiff: {
    color: "#D9474F",
    fontSize: moderateScale(FONT.md),
    paddingBottom: moderateScale(6),
  },
  emptyContainer: {
    paddingHorizontal: moderateScale(10),
  },
  emptyCard: {
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#292E31",
    borderStyle: "dashed",
    paddingVertical: moderateScale(28),
    alignItems: "center",
    gap: moderateScale(8),
  },
  emptyIconCircle: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: "#292E31",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(4),
  },
  emptyTitle: {
    color: "#636A6C",
    fontSize: moderateScale(FONT.sm),
  },
  emptySubtitle: {
    color: "#454B4D",
    fontSize: moderateScale(FONT.xs),
  },
});

export default RecentScansSection;
