import { db } from "@/config/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export type SimpleHoleScore = {
  hole: number;
  score: number;
  par: number;
};

export type SimpleSavePayload = {
  holesCount: number;
  courseName: string;
  playedAt: string;
  totalScore: number;
  holeScores: SimpleHoleScore[];
};

export async function saveSimple({
  holesCount,
  courseName,
  playedAt,
  totalScore,
  holeScores,
}: SimpleSavePayload): Promise<{ id: string }> {
  const resultDocRef = doc(collection(db, "ScanResults"));

  // Calculate derived stats
  const appliedPar = holeScores.reduce((sum, hole) => sum + hole.par, 0);
  const diff = totalScore - appliedPar;
  const birdieCount = holeScores.filter(hole => hole.score < hole.par).length;
  const bogeyCount = holeScores.filter(hole => hole.score > hole.par).length;
  const parsCount = holeScores.filter(hole => hole.score === hole.par).length;

  await setDoc(resultDocRef, {
    holesCount,
    courseName,
    playedAt,
    totalScore,
    appliedPar,
    diff,
    birdieCount,
    bogeyCount,
    parsCount,
    holeScores,
    createdAt: new Date().toISOString(),
  });

  return { id: resultDocRef.id };
}
