import { ThemedText as Text } from "@/components/themed-text";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";


/*
- impliment placeholder component for empty state [not loaded]
-

FIXES:
- fix gap between user score and score delta
-

*/

interface Round {
  id: string;
  date: string;
  score: number;
  coursePar: number;
  courseName: string;
  location: string;
  birdiesCnt: number;
  parsCnt: number;
  bogeyCnt: number;
  holeCnt: number;

}

export default function RecentRoundComponent() {
  const [recentRounds, setRecentRounds] = useState<Round[]>([]);

  useEffect(() => {
    //TODO: implement fetch recent rounds
    setRecentRounds([
      {
        id: "1",
        date: "2026-02-26",
        score: 60,
        coursePar: 72,
        courseName: "나인브릿지",
        location: "제주, 한국",
        birdiesCnt: 3,
        parsCnt: 6,
        bogeyCnt: 3,
        holeCnt: 18,
      },
      {
        id: "2",
        date: "2026-02-26",
        score: 60,
        coursePar: 72,
        courseName: "나인브릿지",
        location: "제주, 한국",
        birdiesCnt: 3,
        parsCnt: 6,
        bogeyCnt: 3,
        holeCnt: 18,
      },
      {
        id: "3",
        date: "2026-02-26",
        score: 60,
        coursePar: 72,
        courseName: "나인브릿지",
        location: "제주, 한국",
        birdiesCnt: 3,
        parsCnt: 6,
        bogeyCnt: 3,
        holeCnt: 18,
      },
    ]);
  }, []);

  const getScoreDelta = (score: number, coursePar: number) => {
    return score - coursePar;
  }

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderRecentRound = (round: Round) => {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => router.push(`/activityModal?id=${round.id}`)}
        style={styles.roundContainer}
      >
        {/* Height 1 */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          {/* Left Side */}
          <View>
            <Text type="barlowHard" style={{ fontSize: moderateScale(20), color: "white" }}>{round.courseName}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: moderateScale(5),
              }}
            >
              {/* <ThemedText type="barlowLight" style={{ fontSize: moderateScale(11), color: "#6E7171" }}>{round.location}</ThemedText> */}
              <Text style={{ fontSize: moderateScale(11), color: "#6E7171" }}>{round.location}</Text>
              <View
                style={{ width: moderateScale(2), height: moderateScale(2), borderRadius: moderateScale(5), backgroundColor: "#6E7171" }}
              />
              <Text style={{ fontSize: moderateScale(11), color: "#6E7171" }}>{formatDate(round.date)}</Text>
            </View>
          </View>

          {/* Right Side */}
          <Text type="barlowHard" style={{ fontSize: moderateScale(50), lineHeight: moderateScale(50), color: "#E83F40" }}>{round.score}</Text>
        </View>
        {/* Height 2 */}
        {/* Score Delta */}
        <View style={{ alignItems: "flex-end" }}>
          <Text type="barlowLight" style={{ fontSize: moderateScale(11), color: "#E83F40" }}>{getScoreDelta(round.score, round.coursePar) > 0 ? "+" : ""}{getScoreDelta(round.score, round.coursePar)}</Text>
        </View>
        {/* Separator */}
        <View
          style={{ width: "100%", height: moderateScale(1), backgroundColor: "#353838", marginVertical: moderateScale(10) }}
        />
        {/* Stats */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          {[
            { value: round.birdiesCnt, label: "버디" },
            { value: round.parsCnt, label: "파" },
            { value: round.bogeyCnt, label: "보기" },
            { value: round.holeCnt, label: "총홀수" },
          ].map((stat, index) => (
            <View key={stat.label} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              {index > 0 && (
                <View
                  style={{
                    width: moderateScale(0.5),
                    height: moderateScale(30),
                    backgroundColor: "#353838",
                    marginHorizontal: moderateScale(4),
                  }}
                />
              )}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text type="barlowHard" style={{ fontSize: moderateScale(25), color: "white" }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: moderateScale(12), color: "#6E7171", marginTop: moderateScale(2) }}>
                  {stat.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text type="barlowLight" style={styles.title}>최근 라운드</Text>
      <FlatList
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        data={recentRounds}
        renderItem={({ item }) => renderRecentRound(item)}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  roundContainer: {
    backgroundColor: "#1F2222",
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(15),
    borderWidth: moderateScale(0.5),
    borderColor: "#353838",
    //alignItems: "center",
  },
  title: {
    fontSize: moderateScale(13),
    color: "#6E7171",
    marginBottom: moderateScale(10),
  },
});
