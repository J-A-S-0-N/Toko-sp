import { ThemedText } from "@/components/themed-text";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

const HOLES = [
  { index: 1, par: 4, strokes: 5, delta: "+1", type: "bogey" },
  { index: 2, par: 3, strokes: 3, delta: "E", type: "par" },
  { index: 3, par: 4, strokes: 5, delta: "+1", type: "bogey" },
  { index: 4, par: 4, strokes: 4, delta: "E", type: "par" },
  { index: 5, par: 5, strokes: 5, delta: "E", type: "par" },
  { index: 6, par: 3, strokes: 3, delta: "E", type: "par" },
  { index: 7, par: 4, strokes: 4, delta: "E", type: "par" },
  { index: 8, par: 4, strokes: 6, delta: "+2", type: "double" },
  { index: 9, par: 4, strokes: 4, delta: "E", type: "par" },
  { index: 10, par: 4, strokes: 4, delta: "E", type: "par" },
  { index: 11, par: 3, strokes: 2, delta: "-1", type: "birdie" },
  { index: 12, par: 4, strokes: 4, delta: "E", type: "par" },
  { index: 13, par: 5, strokes: 5, delta: "E", type: "par" },
  { index: 14, par: 4, strokes: 4, delta: "E", type: "par" },
  { index: 15, par: 4, strokes: 5, delta: "+1", type: "bogey" },
  { index: 16, par: 3, strokes: 4, delta: "+1", type: "bogey" },
  { index: 17, par: 5, strokes: 5, delta: "E", type: "par" },
  { index: 18, par: 4, strokes: 4, delta: "E", type: "par" },
] as const;

type HoleType = (typeof HOLES)[number]["type"];

function getScoreCircleColors(type: HoleType) {
  switch (type) {
    case "birdie":
      return { borderColor: "#4CAE82", backgroundColor: "#163429" };
    case "bogey":
    case "double":
      return { borderColor: "#E83F40", backgroundColor: "#3A1516" };
    default:
      return { borderColor: "#353838", backgroundColor: "#1F2222" };
  }
}

export default function ActivityModal( { id }: { id: string } ) {
  const [fieldName, setFieldName] = useState<string>("");
  const [fieldAddress, setFieldAddress] = useState<string>("");
  const [date, setDate] = useState<string>(""); // Iso format string variable
  const [score, setScore] = useState<any[]>([]);

  const [strokes, setStrokes] = useState<number>(78);

  const [delta, setDelta] = useState<string>("+6");

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      //THIS IS TEST ONLY
      setFieldName("베어즈베스트 청라 골프클럽");
      setFieldAddress("인천광역시 서구 청라동");
      setDate("2026-02-22");
      HOLES.forEach((hole) => {
        setScore(prev => [...prev, hole]);
      })
      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  return (
    <Animated.View
      style={StyleSheet.absoluteFillObject}
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={moderateScale(20)} color="#FFFFFF" />
              <Text style={styles.backText}>Feed</Text>
            </TouchableOpacity>
          </View>

          {/* Course info */}
          <View style={{ marginBottom: moderateScale(20) }}>
            <ThemedText
              type="barlowHard"
              style={styles.courseName}
            >
              {fieldName}
            </ThemedText>
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>{fieldAddress}</Text>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>{date}</Text>
            </View>
          </View>

          {/* Score summary */}
          <View style={styles.scoreRow}>
            <View>
              <ThemedText
                type="barlowHard"
                style={styles.totalScore}
              >
                78
              </ThemedText>
              <View style={styles.totalDeltaRow}>
                <ThemedText style={styles.totalDeltaText} type="barlowLight">+6</ThemedText>
              </View>
              <ThemedText style={styles.parText} type="barlowLight">Par 72</ThemedText>
            </View>

            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStat}>
                <ThemedText type="barlowLight" style={[styles.summaryValue, { color: "#4CAE82" }]}>2</ThemedText>
                <ThemedText style={styles.summaryLabel}>버디</ThemedText>
              </View>
              <View style={styles.summaryStat}>
                <ThemedText type="barlowLight" style={[styles.summaryValue, { color: "#FFFFFF" }]}>9</ThemedText>
                <ThemedText style={styles.summaryLabel}>파</ThemedText>
              </View>
              <View style={styles.summaryStat}>
                <ThemedText type="barlowLight" style={[styles.summaryValue, { color: "#E83F40" }]}>6</ThemedText>
                <ThemedText style={styles.summaryLabel}>보기</ThemedText>
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
            {HOLES.map((item, index) => {
              const colors = getScoreCircleColors(item.type);
              const isLast = index === HOLES.length - 1;
              return (
                <View key={item.index}>
                  <View style={styles.tableRow}>
                    <ThemedText type="barlowLight" style={[styles.holeText, { flex: 2 }]}>{item.index}   홀</ThemedText>
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
                        <Text style={styles.scoreStrokeText}>{item.strokes}</Text>
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
    paddingHorizontal: moderateScale(12),
    paddingBottom: moderateScale(24),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(20),
    marginTop: moderateScale(4),
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(2),
  },
  backText: {
    fontSize: moderateScale(14),
    color: "#FFFFFF",
  },
  courseName: {
    fontSize: moderateScale(25),
    color: "white",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(4),
  },
  locationText: {
    fontSize: moderateScale(11),
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
    fontSize: moderateScale(60),
    lineHeight: moderateScale(60),
    color: "#E83F40",
  },
  totalDeltaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(2),
  },
  totalDeltaText: {
    fontSize: moderateScale(18),
    color: "#E83F40",
  },
  parText: {
    fontSize: moderateScale(13),
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
    fontSize: moderateScale(20),
  },
  summaryLabel: {
    fontSize: moderateScale(11),
    color: "#6E7171",
    marginTop: moderateScale(1),
  },
  sectionHeader: {
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(12),
    color: "#6E7171",
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  tableHeaderText: {
    fontSize: moderateScale(11),
    color: "#6E7171",
  },
  tableContainer: {
  },
  tableRow: {
    flexDirection: "row",
    borderColor: "#353838",
    paddingVertical: moderateScale(6),
  },
  holeText: {
    fontSize: moderateScale(16),
    color: "#FFFFFF",
  },
  parValueText: {
    fontSize: moderateScale(13),
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
    fontSize: moderateScale(13),
    color: "#FFFFFF",
  },
  scoreDeltaText: {
    fontSize: moderateScale(11),
    color: "#6E7171",
    minWidth: moderateScale(20),
    textAlign: "right",
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#353838",
  },
});
