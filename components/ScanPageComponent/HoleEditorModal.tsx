import { ThemedText as Text } from "@/components/themed-text";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type HoleEditorModalProps = {
  visible: boolean;
  hole: number;
  initialScore: number;
  initialPar: number;
  onClose: () => void;
  onConfirm: (score: number, par: number) => void;
  editPar: boolean;
};

export default function HoleEditorModal({
  visible,
  hole,
  initialScore,
  initialPar,
  onClose,
  onConfirm,
  editPar,
}: HoleEditorModalProps) {
  const [score, setScore] = useState(initialScore);
  const [par, setPar] = useState(initialPar);
  const translateY = useRef(new Animated.Value(moderateScale(40))).current;

  useEffect(() => {
    if (!visible) return;

    setScore(initialScore);
    setPar(initialPar);
    translateY.setValue(moderateScale(40));
    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, initialScore, initialPar, translateY]);

  const scoreColor = useMemo(() => {
    if (score <= par - 2) return "#D4AF37";
    if (score === par) return "#9CA3AF";
    return score < par ? "#57C79A" : "#FF4D4D";
  }, [score, par]);

  const onSubmit = () => {
    
    return 1;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalDismissArea} onPress={onClose} />

        <Animated.View style={[styles.holeEditorSheet, { transform: [{ translateY }] }]}> 
          <View style={styles.holeEditorHandle} />

          <Text type="barlowHard" style={styles.holeEditorTitle}>
            <Text type="barlowHard" style={styles.holeEditorTitleHole}>
              {hole}번
            </Text>
            <Text type="barlowLight" style={styles.holeEditorTitleRest}>
              {" "}홀 수정
            </Text>
          </Text>

          <View style={styles.holeEditorScoreRow}>
            <Pressable style={styles.holeEditorAdjustButton} onPress={() => setScore((prev) => Math.max(1, prev - 1))}>
              <Text type="barlowLight" style={[styles.holeEditorAdjustText, styles.holeEditorAdjustTextMinus]}>
                −
              </Text>
            </Pressable>

            {editPar ? (
              <>
                <Text type="barlowHard" style={[styles.holeEditorScoreValue, { color: scoreColor }]}>
                  {score}
                </Text>
              </>
            ) : (
              <>
                <Text type="barlowHard" style={[styles.holeEditorScoreValue, { color: "#9CA3AF" }]}>
                  {score}
                </Text>
              </>
            )}

            <Pressable style={styles.holeEditorAdjustButton} onPress={() => setScore((prev) => Math.min(9, prev + 1))}>
              <Text type="barlowLight" style={[styles.holeEditorAdjustText, styles.holeEditorAdjustTextPlus]}>
                +
              </Text>
            </Pressable>
          </View>


          {editPar ? (
            <>
              <Text type="barlowLight" style={styles.holeEditorParCaption}>
                이 홀의 파
              </Text>

              <View style={styles.holeEditorParRow}>
                {[3, 4, 5].map((parValue) => {
                  const isActive = par === parValue;

                  return (
                    <Pressable
                      key={parValue}
                      onPress={() => setPar(parValue)}
                      style={[styles.holeEditorParButton, isActive && styles.holeEditorParButtonActive]}
                    >
                      <Text type="barlowHard" style={[styles.holeEditorParValue, isActive && styles.holeEditorParValueActive]}>
                        P{parValue}
                      </Text>
                      <Text type="barlowLight" style={[styles.holeEditorParHint, isActive && styles.holeEditorParHintActive]}>
                        파{parValue}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Pressable style={styles.holeEditorConfirmButton} onPress={() => onConfirm(score, par)}>
            <Text type="barlowHard" style={styles.holeEditorConfirmText}>
              확인
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalDismissArea: {
    flex: 1,
  },
  holeEditorSheet: {
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    borderWidth: 1,
    borderColor: "#242A2D",
    backgroundColor: "#121719",
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(22),
  },
  holeEditorHandle: {
    alignSelf: "center",
    width: moderateScale(50),
    height: moderateScale(6),
    borderRadius: moderateScale(999),
    backgroundColor: "#3A4144",
    marginBottom: moderateScale(14),
  },
  holeEditorTitle: {
    fontSize: moderateScale(18),
    textAlign: "center",
    marginBottom: moderateScale(14),
  },
  holeEditorTitleHole: {
    color: "#D5DADD",
  },
  holeEditorTitleRest: {
    color: "#8A9296",
  },
  holeEditorScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  holeEditorAdjustButton: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(19),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A3033",
  },
  holeEditorAdjustText: {
    fontSize: moderateScale(40),
    lineHeight: moderateScale(42),
  },
  holeEditorAdjustTextMinus: {
    color: "#FF4D4D",
  },
  holeEditorAdjustTextPlus: {
    color: "#57C79A",
  },
  holeEditorScoreValue: {
    fontSize: moderateScale(70),
    lineHeight: moderateScale(80),
  },
  holeEditorParCaption: {
    color: "#7C8589",
    fontSize: moderateScale(14),
    textAlign: "center",
    marginBottom: moderateScale(10),
  },
  holeEditorParRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(20),
    marginBottom: moderateScale(18),
  },
  holeEditorParButton: {
    width: moderateScale(58),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#2A3033",
    backgroundColor: "#2A3033",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(8),
  },
  holeEditorParButtonActive: {
    borderColor: "#49C792",
    backgroundColor: "#143A2E",
  },
  holeEditorParValue: {
    color: "#D5DADD",
    fontSize: moderateScale(24),
    lineHeight: moderateScale(31),
  },
  holeEditorParValueActive: {
    color: "#E9F5F0",
  },
  holeEditorParHint: {
    color: "#8A9296",
    fontSize: moderateScale(12),
  },
  holeEditorParHintActive: {
    color: "#86C9AE",
  },
  holeEditorConfirmButton: {
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#003B2D",
    minHeight: moderateScale(56),
  },
  holeEditorConfirmText: {
    color: "#ECF7F1",
    fontSize: moderateScale(17),
  },
});
