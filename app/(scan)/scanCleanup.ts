import { db } from "@/config/firebase";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { deleteObject, getStorage, ref } from "firebase/storage";

/**
 * Deletes the Firestore scan document and its associated Storage photos.
 * Silently catches errors so the user can always exit the scan flow.
 */
export async function deletePendingScan(scanDocId: string): Promise<void> {
  try {
    const scanRef = doc(db, "Scans", scanDocId);
    const snap = await getDoc(scanRef);

    if (!snap.exists()) return;

    const data = snap.data();

    // Delete uploaded photos from Storage
    if (Array.isArray(data?.photoUrls)) {
      const storage = getStorage();
      await Promise.allSettled(
        data.photoUrls.map((url: string) => {
          try {
            const storageRef = ref(storage, url);
            return deleteObject(storageRef);
          } catch {
            return Promise.resolve();
          }
        })
      );
    }

    // Delete the Firestore document
    await deleteDoc(scanRef);
  } catch (error) {
    console.error("Failed to clean up scan document:", error);
  }
}
