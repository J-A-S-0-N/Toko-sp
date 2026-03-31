import { db } from "@/config/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export type SubmitHoleScore = {
  hole: number;
  score: number;
  par: number;
};

export type SubmitScanPayload = {
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
  const resultDocRef = doc(collection(db, "ScanResults"));

  await setDoc(resultDocRef, {
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
  });

  return { id: resultDocRef.id };
}