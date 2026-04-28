import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from '@/constants/theme';
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
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
  const { id } = useLocalSearchParams<{ id: string }>();

  const [fieldName, setFieldName] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [date, setDate] = useState<string>("");

  const [score, setScore] = useState<number>(0);
  const [fieldPar, setFieldPar] = useState<number>(0);
  const [delta, setDelta] = useState<string>("");

  const [parCount, setParCount] = useState<number>(0);
  const [birdieCount, setBirdieCount] = useState<number>(0);
  const [bogeyCount, setBogeyCount] = useState<number>(0);
  const [eagleCount, setEagleCount] = useState<number>(0);
  const [doubleCount, setDoubleCount] = useState<number>(0);

  const [holeData, setHoleData] = useState<{ hole: number; par: number; score: number; delta: string }[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

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
        setScore(data.totalScore ?? 0);
        setFieldPar(data.appliedPar ?? 0);

        const diff = (data.totalScore ?? 0) - (data.appliedPar ?? 0);
        setDelta(diff > 0 ? `+${diff}` : diff === 0 ? "E" : `${diff}`);

        const holes: { hole: number; score: number; par: number }[] = data.holeScores ?? [];

        let eagles = 0, birdies = 0, pars = 0, bogeys = 0, doubles = 0;
        const processed = holes.map((h) => {
          const d = h.score - h.par;
          if (d <= -2) eagles++;
          else if (d === -1) birdies++;
          else if (d === 0) pars++;
          else if (d === 1) bogeys++;
          else if (d >= 2) doubles++;

          let deltaStr = "E";
          if (d > 0) deltaStr = `+${d}`;
          else if (d < 0) deltaStr = `${d}`;

          return { hole: h.hole, par: h.par, score: h.score, delta: deltaStr };
        });

        setEagleCount(eagles);
        setBirdieCount(birdies);
        setParCount(pars);
        setBogeyCount(bogeys);
        setDoubleCount(doubles);
        setHoleData(processed);
      } catch (error) {
        console.error("Failed to fetch round:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRound();
  }, [id]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#0F0F0F" }}>
        <Text>Loading...</Text>
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
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="chevron-left" size={moderateScale(18)} color="#B8BEC1" />
            </Pressable>
            <Text type="barlowLight" style={styles.backLabel}>피드</Text>
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
              <Text
                type="barlowHard"
                style={styles.totalScore}
              >
                {score}
              </Text>
              <View style={styles.totalDeltaRow}>
                <Text style={styles.totalDeltaText} type="barlowLight">{delta}</Text>
              </View>
              <Text style={styles.parText} type="barlowLight">Par {fieldPar}</Text>
            </View>

            <View style={styles.summaryStatsRow}>
              {eagleCount > 0 && (
                <View style={styles.summaryStat}>
                  <Text type="barlowLight" style={[styles.summaryValue, { color: "#D4AF37" }]}>{eagleCount}</Text>
                  <Text style={styles.summaryLabel}>이글</Text>
                </View>
              )}
              <View style={styles.summaryStat}>
                <Text type="barlowLight" style={[styles.summaryValue, { color: "#4CAE82" }]}>{birdieCount}</Text>
                <Text style={styles.summaryLabel}>버디</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text type="barlowLight" style={[styles.summaryValue, { color: "#FFFFFF" }]}>{parCount}</Text>
                <Text style={styles.summaryLabel}>파</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text type="barlowLight" style={[styles.summaryValue, { color: "#E83F40" }]}>{bogeyCount}</Text>
                <Text style={styles.summaryLabel}>보기</Text>
              </View>
            </View>
          </View>

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
            {holeData.map((item, index) => {
              const colors = getScoreCircleColors(item.delta);
              const isLast = index === holeData.length - 1;
              return (
                <View key={item.hole}>
                  <View style={styles.tableRow}>
                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: moderateScale(5)}}>
                      <Text type="barlowLight" style={styles.holeCountText}>{item.hole}</Text>
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
});
