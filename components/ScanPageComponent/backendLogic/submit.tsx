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
  documentReference,
  hitList,
  isNineHole,
}: {
  documentReference: any;
  hitList: number[];
  isNineHole: boolean;
}): Promise<{ id: string }> {
  const resultDocRef = doc(collection(db, "ScanResults"));

  await setDoc(documentReference, {
  });

  return { id: resultDocRef.id };
}