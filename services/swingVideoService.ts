import { db } from "@/config/firebase";
import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

type CreateSwingVideoRecordParams = {
  userId: string;
  originalVideoUri: string;
  trimStartSec: number;
  trimEndSec: number;
  sourceDurationSec: number;
};

type CreateSwingVideoRecordResult = {
  swingVideoId: string;
};

type ScreenshotMeta = {
  index: number;
  sec: number;
  url: string;
  storagePath: string;
};

async function uploadImageToStorage(storagePath: string, fileUri: string) {
  const storage = getStorage();
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(storageRef);
}

function getCaptureTimestamps(trimStartSec: number, trimEndSec: number) {
  const trimDurationSec = Math.max(0.1, trimEndSec - trimStartSec);
  const boundaries = [0, 0.25, 0.5, 0.75, 1];
  return boundaries.map((ratio) => Number((trimStartSec + trimDurationSec * ratio).toFixed(2)));
}

export async function createSwingVideoRecord(
  params: CreateSwingVideoRecordParams
): Promise<CreateSwingVideoRecordResult> {
  const swingVideoRef = doc(collection(db, "SwingVideos"));
  const captureTimes = getCaptureTimestamps(params.trimStartSec, params.trimEndSec);
  const temporaryThumbnailUris: string[] = [];
  const screenshots: ScreenshotMeta[] = [];

  try {
    for (let i = 0; i < captureTimes.length; i += 1) {
      const captureSec = captureTimes[i];
      const { uri } = await VideoThumbnails.getThumbnailAsync(params.originalVideoUri, {
        time: Math.max(0, Math.round(captureSec * 1000)),
        quality: 0.8,
      });

      temporaryThumbnailUris.push(uri);

      const storagePath = `swing-screenshots/${params.userId}/${swingVideoRef.id}/frame-${i + 1}.jpg`;
      const url = await uploadImageToStorage(storagePath, uri);

      screenshots.push({
        index: i,
        sec: captureSec,
        url,
        storagePath,
      });
    }

    await setDoc(swingVideoRef, {
      userId: params.userId,
      trimStartSec: Number(params.trimStartSec.toFixed(1)),
      trimEndSec: Number(params.trimEndSec.toFixed(1)),
      sourceDurationSec: Number(params.sourceDurationSec.toFixed(1)),
      screenshots,
      screenshotCount: screenshots.length,
      status: "uploaded",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } finally {
    await Promise.all(
      temporaryThumbnailUris.map((uri) =>
        FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined)
      )
    );
  }

  return {
    swingVideoId: swingVideoRef.id,
  };
}
