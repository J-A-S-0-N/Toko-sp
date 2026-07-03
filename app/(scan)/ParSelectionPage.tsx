import { ThemedText as Text } from "@/components/themed-text";
import { db } from "@/config/firebase";
import { FONT } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";

type SavedCourseSetup = {
  id: string;
  courseName: string;
  holes: number;
  pars: number[];
  totalPar: number;
};

const buildInitialPars = (fixedPars: string | undefined, holesCount: number) => {
  if (!fixedPars) return Array(holesCount).fill(3) as number[];

  try {
    const parsed = JSON.parse(fixedPars);
    if (!Array.isArray(parsed)) return Array(holesCount).fill(3) as number[];

    const safe = parsed
      .slice(0, holesCount)
      .map((value) => {
        const asNumber = Number(value);
        if (!Number.isFinite(asNumber)) return 3;
        return Math.max(2, Math.min(5, Math.round(asNumber)));
      });

    if (safe.length < holesCount) {
      return [...safe, ...Array(holesCount - safe.length).fill(3)];
    }

    return safe;
  } catch {
    return Array(holesCount).fill(3) as number[];
  }
};

const normalizeParArray = (pars: unknown, holesCount: number) => {
  if (!Array.isArray(pars)) return Array(holesCount).fill(3) as number[];

  const mapped = pars
    .slice(0, holesCount)
    .map((value) => {
      const asNumber = Number(value);
      if (!Number.isFinite(asNumber)) return 3;
      return Math.max(2, Math.min(5, Math.round(asNumber)));
    });

  if (mapped.length < holesCount) {
    return [...mapped, ...Array(holesCount - mapped.length).fill(3)];
  }

  return mapped;
};

const buildCourseSetupId = (courseName: string, holesCount: number) => {
  const sanitized = courseName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[.#$\[\]/]/g, "")
    .slice(0, 60);

  return `${holesCount}_${sanitized || "course"}`;
};

export default function ParSelectionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { holes, fixedPars, courseName: initialCourseName } = useLocalSearchParams<{
    holes?: string;
    fixedPars?: string;
    courseName?: string;
  }>();

  const holesCount = holes === "18" ? 18 : 9;
  const [courseName, setCourseName] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = React.useState(false);
  const [deletingSetupId, setDeletingSetupId] = React.useState<string | null>(null);
  const [savedSetups, setSavedSetups] = React.useState<SavedCourseSetup[]>([]);
  const [pars, setPars] = React.useState<number[]>(() => buildInitialPars(fixedPars, holesCount));

  React.useEffect(() => {
    setPars(buildInitialPars(fixedPars, holesCount));
  }, [fixedPars, holesCount]);

  React.useEffect(() => {
    const initialName = typeof initialCourseName === "string" ? initialCourseName.trim() : "";
    if (!initialName) return;
    setCourseName((prev) => (prev.trim().length > 0 ? prev : initialName));
  }, [initialCourseName]);

  const totalPar = React.useMemo(() => pars.reduce((sum, value) => sum + value, 0), [pars]);

  const fetchSavedSetups = React.useCallback(async () => {
    if (!user?.uid) {
      setSavedSetups([]);
      return;
    }

    try {
      setIsLoadingSaved(true);
      const setupsRef = collection(db, "Users", user.uid, "CourseSetups");
      const setupsQuery = query(setupsRef, orderBy("updatedAt", "desc"), limit(20));
      const snapshot = await getDocs(setupsQuery);

      const fetched = snapshot.docs.map((item) => {
        const data = item.data();
        const normalizedPars = normalizeParArray(data?.pars, holesCount);

        return {
          id: item.id,
          courseName: typeof data?.courseName === "string" ? data.courseName : "코스명 없음",
          holes: data?.holes === 18 ? 18 : 9,
          pars: normalizedPars,
          totalPar: normalizedPars.reduce((sum, value) => sum + value, 0),
        } as SavedCourseSetup;
      });

      setSavedSetups(fetched.filter((setup) => setup.holes === holesCount));
    } catch (error) {
      console.error("Failed to load saved course setups:", error);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [holesCount, user?.uid]);

  React.useEffect(() => {
    void fetchSavedSetups();
  }, [fetchSavedSetups]);

  const persistCurrentSetup = React.useCallback(async () => {
    const trimmedCourseName = courseName.trim();
    if (!trimmedCourseName) {
      Alert.alert("코스 이름 필요", "코스 이름을 입력해 주세요.");
      return false;
    }

    if (!user?.uid) {
      Alert.alert("로그인 필요", "코스 설정 저장은 로그인 후 이용할 수 있어요.");
      return false;
    }

    try {
      setIsSaving(true);
      const setupId = buildCourseSetupId(trimmedCourseName, holesCount);
      const setupRef = doc(db, "Users", user.uid, "CourseSetups", setupId);

      await setDoc(
        setupRef,
        {
          courseName: trimmedCourseName,
          holes: holesCount,
          pars,
          totalPar,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      await fetchSavedSetups();
      return true;
    } catch (error) {
      console.error("Failed to save course setup:", error);
      Alert.alert("저장 실패", "코스 설정 저장 중 오류가 발생했어요.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [courseName, fetchSavedSetups, holesCount, pars, totalPar, user?.uid]);

  const handleCyclePar = (index: number) => {
    setPars((prev) =>
      prev.map((value, i) => {
        if (i !== index) return value;
        if (value < 2 || value > 5) return 2;
        return value === 5 ? 2 : value + 1;
      })
    );
  };

  const handleSave = async () => {
    const trimmedCourseName = courseName.trim();
    const saved = await persistCurrentSetup();
    if (!saved) return;

    Alert.alert("저장 완료", `저장되었습니다: ${trimmedCourseName}`, [
      {
        text: "확인",
        onPress: () => {
          router.replace("/(tabs)/scan");
        },
      },
    ]);
  };

  const handleLoadSavedSetup = (setup: SavedCourseSetup) => {
    setCourseName(setup.courseName);
    setPars(normalizeParArray(setup.pars, holesCount));
  };

  const handleDeleteSavedSetup = React.useCallback(
    (setup: SavedCourseSetup) => {
      Alert.alert("코스 삭제", `\"${setup.courseName}\" 코스를 삭제할까요?`, [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            if (!user?.uid) return;

            try {
              setDeletingSetupId(setup.id);
              await deleteDoc(doc(db, "Users", user.uid, "CourseSetups", setup.id));
              setSavedSetups((prev) => prev.filter((item) => item.id !== setup.id));
            } catch (error) {
              console.error("Failed to delete saved course setup:", error);
              Alert.alert("삭제 실패", "코스 삭제 중 오류가 발생했어요.");
            } finally {
              setDeletingSetupId(null);
            }
          },
        },
      ]);
    },
    [user?.uid]
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Feather name="x" size={moderateScale(20)} color="#D4D9DB" />
          </Pressable>
          <Text type="barlowHard" style={styles.title}>
            코스 설정
          </Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text type="barlowLight" style={styles.sectionLabel}>
            코스 이름
          </Text>
          <TextInput
            value={courseName}
            onChangeText={setCourseName}
            placeholder="예: 제주 파크골프장"
            placeholderTextColor="#5D656A"
            style={styles.courseInput}
            autoCapitalize="words"
          />

          <Text type="barlowLight" style={styles.sectionLabel}>
            저장된 코스 (탭하여 불러오기)
          </Text>

          <View style={styles.savedWrap}>
            {isLoadingSaved ? (
              <Text type="barlowLight" style={styles.savedEmptyText}>
                저장된 코스 불러오는 중...
              </Text>
            ) : savedSetups.length === 0 ? (
              <Text type="barlowLight" style={styles.savedEmptyText}>
                저장된 코스가 없습니다.
              </Text>
            ) : (
              <ScrollView style={styles.savedListScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {savedSetups.map((setup) => (
                  <Pressable key={setup.id} style={styles.savedCard} onPress={() => handleLoadSavedSetup(setup)}>
                    <View>
                      <Text type="barlowHard" style={styles.savedName}>
                        {setup.courseName}
                      </Text>
                      <Text type="barlowLight" style={styles.savedMeta}>
                        Par {setup.totalPar} · {setup.holes}홀
                      </Text>
                    </View>
                    <View style={styles.savedActions}>
                      <Feather name="rotate-ccw" size={moderateScale(16)} color="#45D5CB" />
                      <Pressable
                        style={styles.savedDeleteButton}
                        onPress={(event) => {
                          event.stopPropagation();
                          handleDeleteSavedSetup(setup);
                        }}
                        disabled={deletingSetupId === setup.id}
                      >
                        <Feather name="x" size={moderateScale(14)} color="#E37D7D" />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <Text type="barlowLight" style={styles.sectionLabel}>
            홀별 파 설정 (탭하여 변경)
          </Text>

          <View style={styles.grid}>
            {pars.map((par, index) => (
              <Pressable key={`hole_${index + 1}`} style={styles.holeCard} onPress={() => handleCyclePar(index)}>
                <Text type="barlowLight" style={styles.holeLabel}>
                  홀 {index + 1}
                </Text>
                <Text type="barlowHard" style={styles.holeParValue}>
                  {par}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.totalParCard}>
            <Text type="barlowLight" style={styles.totalParLabel}>
              총 파 (Total Par)
            </Text>
            <Text type="barlowHard" style={styles.totalParValue}>
              Par {totalPar}
            </Text>
          </View>

        </ScrollView>

        <Pressable style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]} onPress={() => void handleSave()} disabled={isSaving}>
          <Text type="barlowHard" style={[styles.primaryButtonText, isSaving && styles.primaryButtonTextDisabled]}>
            {isSaving ? "저장중" : "저장하기"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0D0E",
  },
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(5),
    paddingBottom: moderateScale(5),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(18),
  },
  closeButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    borderWidth: 1,
    borderColor: "#202629",
    backgroundColor: "#111518",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#F2F4F5",
    fontSize: moderateScale(FONT.lg),
  },
  headerRightPlaceholder: {
    width: moderateScale(42),
    height: moderateScale(42),
  },
  scrollContent: {
    paddingBottom: moderateScale(18),
  },
  sectionLabel: {
    color: "#868E93",
    fontSize: moderateScale(FONT.sm),
    marginBottom: moderateScale(8),
    marginTop: moderateScale(4),
  },
  courseInput: {
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#252A2E",
    backgroundColor: "#14181B",
    color: "#F3F5F6",
    fontSize: moderateScale(FONT.md),
    paddingHorizontal: moderateScale(14),
    minHeight: moderateScale(56),
    marginBottom: moderateScale(16),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: moderateScale(10),
    marginBottom: moderateScale(16),
  },
  holeCard: {
    width: "31%",
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#1F2528",
    backgroundColor: "#15191D",
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(112),
    gap: moderateScale(6),
  },
  holeLabel: {
    color: "#8D9599",
    fontSize: moderateScale(FONT.sm),
  },
  holeParValue: {
    color: "#F3F5F6",
    fontSize: moderateScale(FONT.h1),
  },
  totalParCard: {
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#232B2E",
    backgroundColor: "#14181B",
    paddingHorizontal: moderateScale(14),
    minHeight: moderateScale(62),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(16),
  },
  totalParLabel: {
    color: "#8A9296",
    fontSize: moderateScale(FONT.md),
  },
  totalParValue: {
    color: "#53B88F",
    fontSize: moderateScale(FONT.h2),
  },
  savedWrap: {
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#23292D",
    backgroundColor: "#121619",
    padding: moderateScale(12),
    minHeight: moderateScale(72),
    maxHeight: moderateScale(168),
    marginBottom: moderateScale(16),
  },
  savedListScroll: {
    maxHeight: moderateScale(144),
  },
  savedEmptyText: {
    color: "#70787D",
    fontSize: moderateScale(FONT.xs),
  },
  savedCard: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#283035",
    backgroundColor: "#161C1F",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(11),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  savedName: {
    color: "#E6EAEC",
    fontSize: moderateScale(FONT.md),
  },
  savedMeta: {
    color: "#8A9398",
    fontSize: moderateScale(FONT.xs),
    marginTop: moderateScale(2),
  },
  savedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  savedDeleteButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#3A2626",
    backgroundColor: "#1D1515",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    marginTop: moderateScale(8),
    borderRadius: moderateScale(16),
    backgroundColor: "#53B88F",
    minHeight: moderateScale(54),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: moderateScale(8),
  },
  primaryButtonDisabled: {
    backgroundColor: "#3D7E64",
  },
  primaryButtonText: {
    color: "#0A1112",
    fontSize: moderateScale(FONT.md),
  },
  primaryButtonTextDisabled: {
    color: "#1E2C24",
  },
});
