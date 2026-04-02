import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
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

/*
const parHit = [
  { index: 1, parCount: 4 },
  { index: 2, parCount: 3 },
  { index: 3, parCount: 5 },
  { index: 4, parCount: 4 },
  { index: 5, parCount: 4 },
  { index: 6, parCount: 5 },
  { index: 7, parCount: 4 },
  { index: 8, parCount: 3 },
  { index: 9, parCount: 4 },
  { index: 10, parCount: 5 },
  { index: 11, parCount: 3 },
  { index: 12, parCount: 4 },
  { index: 13, parCount: 4 },
  { index: 14, parCount: 3 },
  { index: 15, parCount: 5 },
  { index: 16, parCount: 4 },
  { index: 17, parCount: 3 },
  { index: 18, parCount: 4 }
]
*/

/*
const userHit = [
  { index: 1, hitCount: 4 },
  { index: 2, hitCount: 5 },
  { index: 3, hitCount: 3 },
  { index: 4, hitCount: 4 },
  { index: 5, hitCount: 6 },
  { index: 6, hitCount: 4 },
  { index: 7, hitCount: 5 },
  { index: 8, hitCount: 7 },
  { index: 9, hitCount: 4 },
  { index: 10, hitCount: 4 },
  { index: 11, hitCount: 3 },
  { index: 12, hitCount: 4 },
  { index: 13, hitCount: 5 },
  { index: 14, hitCount: 4 },
  { index: 15, hitCount: 6 },
  { index: 16, hitCount: 5 },
  { index: 17, hitCount: 6 },
  { index: 18, hitCount: 4 },
]
*/

type HoleType = (typeof HOLES)[number]["type"];

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
  const [fieldAddress, setFieldAddress] = useState<string>("");
  const [date, setDate] = useState<string>(""); // Iso format string variable

  const [score, setScore] = useState<number>();
  const [fieldPar, setFieldPar] = useState<number>();
  const [delta, setDelta] = useState<string>("");

  const [parCount, setParCount] = useState<number[]>([]);
  const [birdieCount, setBirdieCount] = useState<number[]>([]);
  const [bogeyCount, setBogeyCount] = useState<number[]>([]);
  const [eagleCount, setEagleCount] = useState<number[]>([]);
  const [doubleCount, setDoubleCount] = useState<number[]>([]);

  let parHit: { index: number; parCount: number }[] = [];
  let userHit: { index: number; hitCount: number }[] = [];
  let userDelta: { index: number; delta: string }[] = [];

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if(score == null || fieldPar == null) return;
    const d = score - fieldPar;
    if(d > 0) {
      setDelta("+" + d.toString());
    } else {
      setDelta("-" + d.toString());
    }
  }, [score, fieldPar]);

  useEffect(() => {
    const fetchFromFirebase = async () => {
      const userRef = doc(db, "User", "Username");
      const postDocRef = doc(userRef, "Posts", "Mzvg5v4Cyh9iTAaYFv6o"); // TODO : replace with id from params
      const postSnap = await getDoc(postDocRef);

      if (postSnap.exists()) {
        const postData = postSnap.data();
        setFieldName(postData.FieldName);
        setFieldAddress(postData.FieldAddress);
        setDate(postData.Date);


        if (postData.isNine == true) {
          userHit.push({ index: 1, hitCount: Number(postData.Hit1) });
          userHit.push({ index: 2, hitCount: Number(postData.Hit2) });
          userHit.push({ index: 3, hitCount: Number(postData.Hit3) });
          userHit.push({ index: 4, hitCount: Number(postData.Hit4) });
          userHit.push({ index: 5, hitCount: Number(postData.Hit5) });
          userHit.push({ index: 6, hitCount: Number(postData.Hit6) });
          userHit.push({ index: 7, hitCount: Number(postData.Hit7) });
          userHit.push({ index: 8, hitCount: Number(postData.Hit8) });
          userHit.push({ index: 9, hitCount: Number(postData.Hit9) });
          parHit.push({ index : 1 , parCount : Number(postData.Par1)});
          parHit.push({ index : 2 , parCount : Number(postData.Par2)});
          parHit.push({ index : 3 , parCount : Number(postData.Par3)});
          parHit.push({ index : 4 , parCount : Number(postData.Par4)});
          parHit.push({ index : 5 , parCount : Number(postData.Par5)});
          parHit.push({ index : 6 , parCount : Number(postData.Par6)});
          parHit.push({ index : 7 , parCount : Number(postData.Par7)});
          parHit.push({ index : 8 , parCount : Number(postData.Par8)});
          parHit.push({ index : 9 , parCount : Number(postData.Par9)});
        } else {
          userHit.push({ index: 1, hitCount: Number(postData.Hit1) });
          userHit.push({ index: 2, hitCount: Number(postData.Hit2) });
          userHit.push({ index: 3, hitCount: Number(postData.Hit3) });
          userHit.push({ index: 4, hitCount: Number(postData.Hit4) });
          userHit.push({ index: 5, hitCount: Number(postData.Hit5) });
          userHit.push({ index: 6, hitCount: Number(postData.Hit6) });
          userHit.push({ index: 7, hitCount: Number(postData.Hit7) });
          userHit.push({ index: 8, hitCount: Number(postData.Hit8) });
          userHit.push({ index: 9, hitCount: Number(postData.Hit9) });
          userHit.push({ index: 10, hitCount: Number(postData.Hit10) });
          userHit.push({ index: 11, hitCount: Number(postData.Hit11) });
          userHit.push({ index: 12, hitCount: Number(postData.Hit12) });
          userHit.push({ index: 13, hitCount: Number(postData.Hit13) });
          userHit.push({ index: 14, hitCount: Number(postData.Hit14) });
          userHit.push({ index: 15, hitCount: Number(postData.Hit15) });
          userHit.push({ index: 16, hitCount: Number(postData.Hit16) });
          userHit.push({ index: 17, hitCount: Number(postData.Hit17) });
          userHit.push({ index: 18, hitCount: Number(postData.Hit18) });
          parHit.push({ index :1, parCount: Number(postData.Par1)});
          parHit.push({ index :2, parCount: Number(postData.Par2)});
          parHit.push({ index :3, parCount: Number(postData.Par3)});
          parHit.push({ index :4, parCount: Number(postData.Par4)});
          parHit.push({ index :5, parCount: Number(postData.Par5)});
          parHit.push({ index :6, parCount: Number(postData.Par6)});
          parHit.push({ index :7, parCount: Number(postData.Par7)});
          parHit.push({ index :8, parCount: Number(postData.Par8)});
          parHit.push({ index :9, parCount: Number(postData.Par9)});
          parHit.push({ index :10, parCount: Number(postData.Par10)});
          parHit.push({ index :11, parCount: Number(postData.Par11)});
          parHit.push({ index :12, parCount: Number(postData.Par12)});
          parHit.push({ index :13, parCount: Number(postData.Par13)});
          parHit.push({ index :14, parCount: Number(postData.Par14)});
          parHit.push({ index :15, parCount: Number(postData.Par15)});
          parHit.push({ index :16, parCount: Number(postData.Par16)});
          parHit.push({ index :17, parCount: Number(postData.Par17)});
          parHit.push({ index :18, parCount: Number(postData.Par18)});
        }
      }
    };

    const fetchTotalScore = async () => {
      const iterHitCount = userHit.reduce((acc, value) => {
        const hitValue = value.hitCount;
        acc += hitValue;
        return acc;
      }, 0);

      setScore(iterHitCount);
    };

    const fetchFieldPar = async () => {
      const iterPar = parHit.reduce((acc, value) => {
        const parValue = value.parCount;
        acc += parValue;
        return acc;
      }, 0);

      setFieldPar(iterPar);
    };

    const fetchParCount = async () => {
      parHit.forEach((par , i) => {
        let hit = userHit[i].hitCount;
        const diff = par.parCount - hit;
        if (diff == 0){
          setParCount(prev => [...prev, i]);
        }
        else if (diff == 1){
          setBirdieCount(prev => [...prev, i]);        }
        else if (diff == -1){
          setBogeyCount(prev => [...prev, i]);
        }
        else if (diff == 2){
          setDoubleCount(prev => [...prev, i]);
        }
        else if (diff == -2){
          setEagleCount(prev => [...prev, i]);
        }
      });
    };

    const calculateScoreDelta = async () => {
      userHit.forEach((hit, i) => {
        let par = parHit[i].parCount;
        const diff = hit.hitCount - par;
        if (diff == 0){
          userDelta.push({ index: i, delta: "E" });
        }
        else if (diff == 1){
          userDelta.push({ index: i, delta: "+" + diff.toString() });
        }
        else if (diff == -1){
          userDelta.push({ index: i, delta: diff.toString() });
        }
        else if (diff == 2){
          userDelta.push({ index: i, delta: "+" + diff.toString() });
        }
        else if (diff == -2){
          userDelta.push({ index: i, delta: diff.toString() });
        }
      });
    };

    const main = async () => {
      await fetchFromFirebase();
      await fetchTotalScore();
      await fetchFieldPar();
      await fetchParCount();
      await calculateScoreDelta();
      setIsLoading(false);
    };

    main();
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
            <Text
              type="barlowHard"
              style={styles.courseName}
            >
              {fieldName}
            </Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>{fieldAddress}</Text>
              <View style={styles.locationDot} />
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
              {eagleCount.length > 0 && (
                <View style={styles.summaryStat}>
                  <Text type="barlowLight" style={[styles.summaryValue, { color: "#D4AF37" }]}>{eagleCount.length}</Text>
                  <Text style={styles.summaryLabel}>이글</Text>
                </View>
              )}
              <View style={styles.summaryStat}>
                <Text type="barlowLight" style={[styles.summaryValue, { color: "#4CAE82" }]}>{birdieCount.length}</Text>
                <Text style={styles.summaryLabel}>버디</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text type="barlowLight" style={[styles.summaryValue, { color: "#FFFFFF" }]}>{parCount.length}</Text>
                <Text style={styles.summaryLabel}>파</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text type="barlowLight" style={[styles.summaryValue, { color: "#E83F40" }]}>{bogeyCount.length}</Text>
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
            {userDelta.map((item, index) => {
              const colors = getScoreCircleColors(item.delta);
              const isLast = index === HOLES.length - 1;
              return (
                <View key={item.index}>
                  <View style={styles.tableRow}>
                    <Text type="barlowLight" style={[styles.holeText, { flex: 2 }]}>{item.index}   홀</Text>
                    <Text style={[styles.parValueText, { flex: 1, textAlign: "center" }]}>
                      {parHit[index].parCount}
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
                        <Text style={styles.scoreStrokeText}>{item.delta}</Text>
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
    marginBottom: moderateScale(20),
    marginTop: moderateScale(4),
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(2),
  },
  backText: {
    fontSize: moderateScale(16),
    color: "#FFFFFF",
  },
  courseName: {
    fontSize: moderateScale(27),
    color: "white",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(4),
  },
  locationText: {
    fontSize: moderateScale(13),
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
    fontSize: moderateScale(62),
    lineHeight: moderateScale(62),
    color: "#E83F40",
  },
  totalDeltaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(2),
  },
  totalDeltaText: {
    fontSize: moderateScale(20),
    color: "#E83F40",
  },
  parText: {
    fontSize: moderateScale(15),
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
    fontSize: moderateScale(22),
  },
  summaryLabel: {
    fontSize: moderateScale(13),
    color: "#6E7171",
    marginTop: moderateScale(1),
  },
  sectionHeader: {
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    color: "#6E7171",
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  tableHeaderText: {
    fontSize: moderateScale(13),
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
    fontSize: moderateScale(18),
    color: "#FFFFFF",
  },
  parValueText: {
    fontSize: moderateScale(15),
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
    fontSize: moderateScale(15),
    color: "#FFFFFF",
  },
  scoreDeltaText: {
    fontSize: moderateScale(13),
    color: "#6E7171",
    minWidth: moderateScale(20),
    textAlign: "right",
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#353838",
  },
});
