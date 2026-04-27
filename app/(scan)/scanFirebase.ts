import { db } from "@/config/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

export async function createPendingScan(holesCount: number, photoUris: string[], userId: string) {
  const storage = getStorage();
  const uploadTimestamp = Date.now();

  const uploadedPhotoUrls = await Promise.all(
    photoUris.map(async (uri, index) => {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(
        storage,
        `scans/${uploadTimestamp}-${index + 1}-${Math.random().toString(36).slice(2)}.jpg`
      );

      await uploadBytes(storageRef, blob);
      return getDownloadURL(storageRef);
    })
  );

  const scanDocRef = doc(collection(db, "Scans"));

  await setDoc(scanDocRef, {
    userId,
    holes: holesCount,
    photoUrls: uploadedPhotoUrls,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return scanDocRef;
}


/* export async function setFinalValues(scanDocRef: any) {
  //fetch all the pars and hits and then set the document and route to other page (this will be done else where)
  await setDoc(scanDocRef, {
    status: "completed",
  });
} */
