import AnimatedNumber from "@/components/AnimatedNumber";
import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from '@/constants/theme';
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from 'react-native-size-matters';

function getScoreCircleColors(delta: string) {
  const deltaValue = Number(delta);
 
  if (Number.isNaN(deltaValue)) {
    return { borderColor: "#353838", backgroundColor: "#1F2222" };
  }
 
  if (deltaValue <= -1) {
    return { borderColor: "#4CAE82", backgroundColor: "#163429" };
  }
 
  if (deltaValue >= 1) {
    return { borderColor: "#E83F40", backgroundColor: "#3A1516" };
  }
 
  return { borderColor: "#353838", backgroundColor: "#1F2222" };
}


export default function ActivityModal() {
  const { id, fromSave } = useLocalSearchParams<{ id: string; fromSave?: string }>();

  const [fieldName, setFieldName] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [date, setDate] = useState<string>("");

  const [holeData, setHoleData] = useState<{ hole: number; par: number; score: number; delta: string }[]>([]);
  const [holesCount, setHolesCount] = useState<9 | 18>(9);
  const [selectedCourse, setSelectedCourse] = useState<"A" | "B">("A");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchRound = async () => {
      try {
        const scanDoc = await getDoc(doc(db, "Scans", id));
        if (!scanDoc.exists()) return;

        const data = scanDoc.data();
        setFieldName(data.courseName ?? "코스명 없음");
        setLocation(data.location ?? "");
        const rawDate = data.playedAt ?? "";
        setDate(rawDate ? rawDate.slice(0, 10) : "");

        const rawHolesCount = data.holesCount === 18 ? 18 : 9;
        setHolesCount(rawHolesCount);

        const holes: { hole: number; score: number; par: number }[] = data.holeScores ?? [];

        const processed = holes.map((h) => {
          const d = h.score - h.par;
          let deltaStr = "E";
          if (d > 0) deltaStr = `+${d}`;
          else if (d < 0) deltaStr = `${d}`;
          return { hole: h.hole, par: h.par, score: h.score, delta: deltaStr };
        });

        setHoleData(processed);
      } catch (error) {
        console.error("Failed to fetch round:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRound();
  }, [id]);

  const visibleHoles = useMemo(() => {
    if (holesCount === 9) return holeData;
    return selectedCourse === "A"
      ? holeData.filter((h) => h.hole <= 9)
      : holeData.filter((h) => h.hole >= 10);
  }, [holeData, holesCount, selectedCourse]);

  const courseSummary = useMemo(() => {
    let eagles = 0, birdies = 0, pars = 0, bogeys = 0, doubles = 0;
    let totalScore = 0, totalPar = 0;
    for (const h of visibleHoles) {
      totalScore += h.score;
      totalPar += h.par;
      const d = h.score - h.par;
      if (d <= -2) eagles++;
      else if (d === -1) birdies++;
      else if (d === 0) pars++;
      else if (d === 1) bogeys++;
      else if (d >= 2) doubles++;
    }
    const diff = totalScore - totalPar;
    const deltaStr = diff > 0 ? `+${diff}` : diff === 0 ? "E" : `${diff}`;
    return { eagles, birdies, pars, bogeys, doubles, totalScore, totalPar, deltaStr };
  }, [visibleHoles]);

  const animationTrigger = selectedCourse === "A" ? 1 : 2;

  const handleBackPress = () => {
    if (fromSave === "1") {
      router.replace("/(tabs)/scan");
      return;
    }
    router.back();
  };

  const handleDeletePress = () => {
    if (!id || isDeleting) return;

    Alert.alert(
      "기록 삭제 확인",
      `${fieldName || "코스명 없음"}\n${date || "날짜 정보 없음"} 기록을 삭제할까요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteDoc(doc(db, "Scans", id));

              if (fromSave === "1") {
                router.replace("/(tabs)/scan");
                return;
              }

              router.back();
            } catch (error) {
              console.error("Failed to delete round in activityModal:", error);
              Alert.alert("삭제 실패", "기록 삭제 중 오류가 발생했어요.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#0F0F0F" }}>
        <ActivityIndicator size="small" color="#4CAE82" />
      </View>
    );
  }
  
  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { backgroundColor: "#0F0F0F" }]}
      entering={FadeInDown.duration(200)}
    >
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <LinearGradient
          colors={['rgba(76,175,130,0.18)', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={handleBackPress}>
              <Feather name="chevron-left" size={moderateScale(18)} color="#B8BEC1" />
            </Pressable>
            <Text type="barlowLight" style={styles.backLabel}>피드</Text>
            <Pressable
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={handleDeletePress}
              disabled={isDeleting}
            >
              <Text type="barlowHard" style={styles.deleteButtonText}>삭제하기</Text>
            </Pressable>
          </View>

          {/* Course info */}
          <View style={{ marginBottom: moderateScale(20) }}>
            <Text
              type="barlowHard"
              style={styles.courseName}
            >
              {fieldName}
            </Text>
            <View style={styles.locationRow}>
              {location ? (
                <>
                  <Text style={styles.locationText}>{location}</Text>
                  <View style={styles.locationDot} />
                </>
              ) : null}
              <Text style={styles.locationText}>{date}</Text>
            </View>
          </View>

          {/* Score summary */}
          <View style={styles.scoreRow}>
            <View>
              <AnimatedNumber
                style={styles.totalScore}
                value={courseSummary.totalScore}
                trigger={animationTrigger}
                delay={0}
                duration={700}
              />
              <View style={styles.totalDeltaRow}>
                <AnimatedNumber
                  style={styles.totalDeltaText}
                  value={courseSummary.deltaStr}
                  trigger={animationTrigger}
                  delay={100}
                  duration={700}
                />
              </View>
              <Text style={styles.parText} type="barlowLight">Par {courseSummary.totalPar}</Text>
            </View>

            <View style={styles.summaryStatsRow}>
              {courseSummary.eagles > 0 && (
                <View style={styles.summaryStat}>
                  <AnimatedNumber
                    style={[styles.summaryValue, { color: "#D4AF37" }]}
                    value={courseSummary.eagles}
                    trigger={animationTrigger}
                    delay={200}
                    duration={700}
                  />
                  <Text style={styles.summaryLabel}>이글</Text>
                </View>
              )}
              <View style={styles.summaryStat}>
                <AnimatedNumber
                  style={[styles.summaryValue, { color: "#4CAE82" }]}
                  value={courseSummary.birdies}
                  trigger={animationTrigger}
                  delay={300}
                  duration={700}
                />
                <Text style={styles.summaryLabel}>버디</Text>
              </View>
              <View style={styles.summaryStat}>
                <AnimatedNumber
                  style={[styles.summaryValue, { color: "#FFFFFF" }]}
                  value={courseSummary.pars}
                  trigger={animationTrigger}
                  delay={400}
                  duration={700}
                />
                <Text style={styles.summaryLabel}>파</Text>
              </View>
              <View style={styles.summaryStat}>
                <AnimatedNumber
                  style={[styles.summaryValue, { color: "#E83F40" }]}
                  value={courseSummary.bogeys}
                  trigger={animationTrigger}
                  delay={500}
                  duration={700}
                />
                <Text style={styles.summaryLabel}>보기</Text>
              </View>
            </View>
          </View>

          {/* Course switcher */}
          {holesCount === 18 ? (
            <View style={styles.courseSwitcher}>
              <Pressable
                onPress={() => setSelectedCourse("A")}
                style={[styles.courseSwitchButton, selectedCourse === "A" && styles.courseSwitchButtonActive]}
              >
                <Text type="barlowHard" style={[styles.courseSwitchText, selectedCourse === "A" && styles.courseSwitchTextActive]}>
                  코스 A
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedCourse("B")}
                style={[styles.courseSwitchButton, selectedCourse === "B" && styles.courseSwitchButtonActive]}
              >
                <Text type="barlowHard" style={[styles.courseSwitchText, selectedCourse === "B" && styles.courseSwitchTextActive]}>
                  코스 B
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Scorecard header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>스코어카드</Text>
          </View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>HOLE</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>PAR</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>SCORE</Text>
          </View>

          {/* Scorecard rows */}
          <View style={styles.tableContainer}>
            {visibleHoles.map((item, index) => {
              const colors = getScoreCircleColors(item.delta);
              const isLast = index === visibleHoles.length - 1;
              const displayHole = item.hole > 9 ? item.hole - 9 : item.hole;
              return (
                <View key={item.hole}>
                  <View style={styles.tableRow}>
                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: moderateScale(5)}}>
                      <Text type="barlowLight" style={styles.holeCountText}>{displayHole}</Text>
                      <Text style={styles.holeText}>홀</Text>
                    </View>
                    <Text style={[styles.parValueText, { flex: 1, textAlign: "center" }]}>
                      {item.par}
                    </Text>
                    <View style={[styles.scoreCell, { flex: 1 }]}>
                      <View
                        style={[
                          styles.scoreCircle,
                          {
                            borderColor: colors.borderColor,
                            backgroundColor: colors.backgroundColor,
                          },
                        ]}
                      >
                        <Text style={styles.scoreStrokeText}>{item.score}</Text>
                      </View>
                      <Text style={styles.scoreDeltaText}>{item.delta}</Text>
                    </View>
                  </View>
                  {!isLast && <View style={styles.rowDivider} />}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  scrollContent: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingBottom: moderateScale(24),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(20),
    marginTop: moderateScale(4),
  },
  backButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  backLabel: {
    color: "#7B8083",
    fontSize: moderateScale(FONT.xs),
  },
  deleteButton: {
    marginLeft: "auto",
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#3A2626",
    backgroundColor: "#1D1515",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#E37D7D",
    fontSize: moderateScale(FONT.xs),
  },
  courseName: {
    fontSize: moderateScale(FONT.xxl),
    color: "white",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(4),
  },
  locationText: {
    fontSize: moderateScale(FONT.xs),
    color: "#6E7171",
  },
  locationDot: {
    width: moderateScale(3),
    height: moderateScale(3),
    borderRadius: moderateScale(5),
    backgroundColor: "#6E7171",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: moderateScale(24),
  },
  totalScore: {
    fontSize: moderateScale(FONT.hero),
    color: "#E83F40",
  },
  totalDeltaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(2),
  },
  totalDeltaText: {
    fontSize: moderateScale(FONT.lg),
    color: "#E83F40",
  },
  parText: {
    fontSize: moderateScale(FONT.sm),
    color: "#6E7171",
    marginTop: moderateScale(4),
  },
  summaryStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryStat: {
    alignItems: "center",
    marginLeft: moderateScale(20),
  },
  summaryValue: {
    fontSize: moderateScale(FONT.xl),
  },
  summaryLabel: {
    fontSize: moderateScale(FONT.xs),
    color: "#6E7171",
    marginTop: moderateScale(1),
  },
  sectionHeader: {
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(FONT.xs),
    color: "#6E7171",
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  tableHeaderText: {
    fontSize: moderateScale(FONT.xs),
    color: "#6E7171",
  },
  tableContainer: {
  },
  tableRow: {
    flexDirection: "row",
    borderColor: "#353838",
    paddingVertical: moderateScale(6),
  },
  holeCountText: {
    fontSize: moderateScale(FONT.md),
    color: "#FFFFFF",
  },
  holeText: {
    fontSize: moderateScale(FONT.sm),
    color: "#999",
  },
  parValueText: {
    fontSize: moderateScale(FONT.sm),
    color: "#FFFFFF",
  },
  scoreCell: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  scoreCircle: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    borderWidth: moderateScale(1),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(8),
  },
  scoreStrokeText: {
    fontSize: moderateScale(FONT.sm),
    color: "#FFFFFF",
  },
  scoreDeltaText: {
    fontSize: moderateScale(FONT.xs),
    color: "#6E7171",
    minWidth: moderateScale(20),
    textAlign: "right",
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#353838",
  },
  courseSwitcher: {
    flexDirection: "row",
    backgroundColor: "#161A1B",
    borderRadius: moderateScale(12),
    padding: moderateScale(4),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: "#2C3133",
  },
  courseSwitchButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(9),
    alignItems: "center",
    justifyContent: "center",
  },
  courseSwitchButtonActive: {
    backgroundColor: "#2A7D5D",
  },
  courseSwitchText: {
    color: "#7A8387",
    fontSize: moderateScale(FONT.sm),
  },
  courseSwitchTextActive: {
    color: "#ECF7F1",
  },
});
