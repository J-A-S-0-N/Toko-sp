import { db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";

export type SubmitHoleScore = {
  hole: number;
  score: number;
  par: number;
};

export type SubmitScanPayload = {
  scanDocId: string;
  holesCount: number;
  courseName: string;
  playedAt: string;
  parInputEnabled: boolean;
  appliedPar: number;
  totalScore: number;
  diff: number;
  birdieCount: number;
  doubleCount: number;
  holeScores: SubmitHoleScore[];
};

export async function submit({
  scanDocId,
  holesCount,
  courseName,
  playedAt,
  parInputEnabled,
  appliedPar,
  totalScore,
  diff,
  birdieCount,
  doubleCount,
  holeScores,
}: SubmitScanPayload): Promise<{ id: string }> {
  const scanDocRef = doc(db, "Scans", scanDocId);

  await updateDoc(scanDocRef, {
    holesCount,
    courseName,
    playedAt,
    parInputEnabled,
    appliedPar,
    totalScore,
    diff,
    birdieCount,
    doubleCount,
    holeScores,
    status: "completed",
  });

  return { id: scanDocId };
}