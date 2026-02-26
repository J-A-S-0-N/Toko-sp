import { ThemedText } from "@/components/themed-text";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

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
        parsCnt: 3,
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
      <View
        style={styles.roundContainer}
      >
        {/*height 1*/}
        <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
          {/*left side*/}
          <View>
            <ThemedText type="barlowHard" style={{fontSize: moderateScale(18), color: "white"}}>{round.courseName}</ThemedText>
            <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: moderateScale(6),
            }}
            >
              <ThemedText type="barlowLight" style={{fontSize: moderateScale(11), color: "#6E7171"}}>{round.location}</ThemedText>
              <View
              style={{width: moderateScale(3), height: moderateScale(3), borderRadius: moderateScale(5), backgroundColor: "#6E7171"}}
              />
              <Text style={{fontSize: moderateScale(11), color: "#6E7171"}}>{formatDate(round.date)}</Text>
            </View>
          </View>

          {/*right side*/}
          <View
            style={{alignItems: "flex-end"}}
          >
            <ThemedText type="barlowHard" style={{fontSize: moderateScale(50), color: "#E83F40"}}>{round.score}</ThemedText>
          </View>
        </View>
        {/*height 2*/}
        <View style={{alignItems: "flex-end"}}>
          <ThemedText type="barlowLight" style={{fontSize: moderateScale(11), color: "#E83F40"}}>{getScoreDelta(round.score, round.coursePar) > 0 ? "+" : ""}{getScoreDelta(round.score, round.coursePar)}</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ThemedText type="barlowLight" style={styles.title}>최근 라운드</ThemedText>
      <FlatList
        data={recentRounds}
        renderItem={({item}) => renderRecentRound(item)}
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
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(10),
    borderWidth: moderateScale(0.5),
    borderColor: "#353838",
    //alignItems: "center",
  },
  title: {
    fontSize: moderateScale(15),
    color: "#6E7171",
    marginBottom: moderateScale(10),
  },
});
