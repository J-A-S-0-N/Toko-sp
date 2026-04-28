import { ThemedText } from "@/components/themed-text";
import { FONT } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type NearbyCourse = {
  id: string;
  name: string;
  distanceKm: number;
  rating: number;
  priceWon: number;
};

type NearbyCoursesComponentProps = {
  onPressViewAll?: () => void;
  onPressCourse?: (course: NearbyCourse) => void;
};

const NEARBY_COURSES: NearbyCourse[] = [
  { id: "hanyang", name: "한양 cc", distanceKm: 12, rating: 4.7, priceWon: 180000 },
  { id: "88", name: "88 cc", distanceKm: 18, rating: 4.5, priceWon: 150000 },
  { id: "pine", name: "파인크리크 cc", distanceKm: 25, rating: 4.8, priceWon: 220000 },
];

const formatWon = (value: number) => {
  return `₩${value.toLocaleString("en-US")}`;
};

export default function NearbyCoursesComponent({ onPressViewAll, onPressCourse }: NearbyCoursesComponentProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.pinIcon}>📍</Text>
          <ThemedText type="barlowHard" style={styles.titleText}>
            근처 코스
          </ThemedText>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={onPressViewAll}>
          <ThemedText type="barlowLight" style={styles.viewAllText}>
            전체 보기
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {NEARBY_COURSES.map((course, index) => {
          const isLast = index === NEARBY_COURSES.length - 1;

          return (
            <View key={course.id}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onPressCourse?.(course)}
                style={styles.row}
              >
                <View style={styles.leftCol}>
                  <ThemedText type="barlowHard" style={styles.courseName}>
                    {course.name}
                  </ThemedText>

                  <View style={styles.subRow}>
                    <ThemedText type="barlowLight" style={styles.metaText}>
                      {course.distanceKm}km
                    </ThemedText>
                    <View style={styles.metaSeparator} />
                    <Ionicons name="star" size={moderateScale(13)} color="#F2C233" />
                    <ThemedText type="barlowLight" style={styles.metaText}>
                      {course.rating.toFixed(1)}
                    </ThemedText>
                  </View>
                </View>

              {
                /*
                <ThemedText type="barlowHard" style={styles.priceText}>
                  {formatWon(course.priceWon)}
                </ThemedText>
                */
              }
              </TouchableOpacity>

              {!isLast && <View style={styles.separator} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(3),
  },
  pinIcon: {
    fontSize: moderateScale(FONT.sm),
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.md),
  },
  viewAllText: {
    color: "#45D07F",
    fontSize: moderateScale(FONT.xs),
  },
  card: {
    backgroundColor: "#1F2222",
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#292E31",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(12),
  },
  leftCol: {
    flex: 1,
    paddingRight: moderateScale(12),
  },
  courseName: {
    color: "#FFFFFF",
    fontSize: moderateScale(FONT.lg),
    marginBottom: moderateScale(2),
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  metaText: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.md),
  },
  metaSeparator: {
    width: moderateScale(2),
    height: moderateScale(2),
    borderRadius: 99,
    backgroundColor: "#6E7171",
  },
  priceText: {
    color: "#8A9491",
    fontSize: moderateScale(FONT.sm),
  },
  separator: {
    height: 1,
    backgroundColor: "#292E31",
    opacity: 0.7,
  },
});
