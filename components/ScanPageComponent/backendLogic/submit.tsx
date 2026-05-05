import { incrementUserStats } from "@/app/(auth)/functions/updateUserStats";
import { db } from "@/config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export type SubmitHoleScore = {
  hole: number;
  score: number;
  par: number;
};

export type SubmitScanPayload = {
  scanDocId: string;
  userId: string;
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
  userId,
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
    userId,
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

  // Read user profile for ranking context
  const userSnap = await getDoc(doc(db, "Users", userId));
  const userData = userSnap.data();
  const city = userData?.city ?? null;
  const username = typeof userData?.name === "string" ? userData.name : "";

  // Update user stats incrementally
  await incrementUserStats(userId, {
    totalScore,
    playedAt,
    holeScores,
  }, { city, username });

  return { id: scanDocId };
}