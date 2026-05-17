import { ThemedText } from "@/components/themed-text";
import db from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type HotCourse = {
  id: string;
  name: string;
  rating: number;
};

type HottestLocationsComponentProps = {
  onPressViewAll?: () => void;
  onPressCourse?: (course: HotCourse) => void;
};

export default function HottestLocationsComponent({ onPressViewAll, onPressCourse }: HottestLocationsComponentProps) {
  const [courses, setCourses] = useState<HotCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(
          collection(db, "Courses"),
          orderBy("rating", "desc"),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const data: HotCourse[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name ?? "",
          rating: Number(doc.data().rating ?? 0),
        }));
        setCourses(data);
      } catch (e) {
        console.error("[HottestLocations] fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <ThemedText type="barlowHard" style={styles.fireIcon}>🔥</ThemedText>
          <ThemedText type="barlowHard" style={styles.titleText}>
            인기 장소
          </ThemedText>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={onPressViewAll}>
          <ThemedText type="barlowLight" style={styles.viewAllText}>
            전체 보기
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {loading ? (
          [0, 1, 2].map((i) => (
            <View key={i}>
              <View style={styles.skeletonRow}>
                <View style={styles.skeletonName} />
                <View style={styles.skeletonMeta} />
              </View>
              {i < 2 && <View style={styles.separator} />}
            </View>
          ))
        ) : courses.length === 0 ? (
          <View style={styles.emptyRow}>
            <ThemedText type="barlowLight" style={styles.emptyText}>
              등록된 장소가 없습니다
            </ThemedText>
          </View>
        ) : (
          courses.map((course, index) => {
            const isLast = index === courses.length - 1;
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
                      <Ionicons name="star" size={moderateScale(13)} color="#F2C233" />
                      <ThemedText type="barlowLight" style={styles.metaText}>
                        {course.rating.toFixed(1)}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
                {!isLast && <View style={styles.separator} />}
              </View>
            );
          })
        )}
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
  fireIcon: {
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
    fontSize: moderateScale(FONT.md),
    marginBottom: moderateScale(2),
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  metaText: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.sm),
  },
  separator: {
    height: 1,
    backgroundColor: "#292E31",
    opacity: 0.7,
  },
  skeletonRow: {
    paddingVertical: moderateScale(14),
    gap: moderateScale(6),
  },
  skeletonName: {
    height: moderateScale(14),
    width: "50%",
    backgroundColor: "#2A2E2E",
    borderRadius: moderateScale(6),
  },
  skeletonMeta: {
    height: moderateScale(10),
    width: "30%",
    backgroundColor: "#242828",
    borderRadius: moderateScale(4),
  },
  emptyRow: {
    paddingVertical: moderateScale(20),
    alignItems: "center",
  },
  emptyText: {
    color: "#6E7171",
    fontSize: moderateScale(FONT.sm),
  },
});
