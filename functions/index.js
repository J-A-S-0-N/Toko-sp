import { GoogleGenAI } from "@google/genai";
import { Buffer } from "buffer";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

import fetch from "node-fetch";

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { defineSecret } from "firebase-functions/params";

import { getStorage } from "firebase-admin/storage";
import { polarUnwrap } from "./unwrap.js";


if (!getApps().length) initializeApp();
const db = getFirestore();

const bucket = getStorage().bucket();


const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY")


/*
async function uploadAndGetDownloadUrl(buffer, path, contentType = "image/jpeg") {
  const file = bucket.file(path);
  const token = randomUUID();
 
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });
 
  const encodedPath = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
}
*/

async function main(imageBase64) {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        },
      },
      {
        text: `Read the two number rows in the image. Match top and bottom numbers vertically by the same column. The bottom row is always a circular sequence of 1 to 9 but may start at any number in the image, so normalize it to horizontal order 1,2,3,4,5,6,7,8,9 and keep each top number paired with its original bottom-column match.

Reply ONLY with a valid JSON array in this exact format:
[{"hole": 1, "hit": 23}, {"hole": 2, "hit": 15}, ...]

Rules:
- Always include all 9 holes (hole 1 through hole 9)
- If a value is missing or unreadable, set "hit" to null
- No extra text, explanation, or markdown — just the raw JSON array
                `
      }
    ],
    config: {
      responseMimeType: "application/json",
    },
  });
  console.log(response.text);
  return JSON.parse(response.text);
}

export const onNewDocument = onDocumentCreated({
      document: "Scans/{docId}",
      secrets: [GEMINI_API_KEY] 
    }, async (event) => {

  const snapshot = event.data;
  const photoUrls = snapshot.get("photoUrls");
  const imageLinks = Array.isArray(photoUrls) ? photoUrls.filter((url) => typeof url === "string" && url.trim() !== "") : [];

  if (typeof imageLinks[0] !== "string" || imageLinks[0].trim() === "") {
    throw new Error("imageLink is not a valid string");
  }

  async function processImage(imageUrl) {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch image (${res.status}): ${imageUrl}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const unwrappedBuffer = await polarUnwrap(originalBuffer);
    const imageBase64 = unwrappedBuffer.toString("base64");
    return await main(imageBase64);
  }

  console.error("docId: " + event.params.docId);

  //front 9 (holes 1-9)
  const frontResponse = await processImage(imageLinks[0]);
  const frontHits = {};
  for (const pair of frontResponse) {
    if (pair.hole >= 1 && pair.hole <= 9) {
      frontHits[pair.hole] = pair.hit;
    }
  }
  console.error("frontHits: " + JSON.stringify(frontHits));

  //back 9 (holes 10-18) — only if a second image exists
  const backHits = {};
  if (imageLinks[1]) {
    const backResponse = await processImage(imageLinks[1]);
    for (const pair of backResponse) {
      if (pair.hole >= 1 && pair.hole <= 9) {
        backHits[pair.hole + 9] = pair.hit;
      }
    }
    console.error("backHits: " + JSON.stringify(backHits));
  }

  const updateData_Nine = {
    hole1_raw: frontHits[1] ?? null,
    hole2_raw: frontHits[2] ?? null,
    hole3_raw: frontHits[3] ?? null,
    hole4_raw: frontHits[4] ?? null,
    hole5_raw: frontHits[5] ?? null,
    hole6_raw: frontHits[6] ?? null,
    hole7_raw: frontHits[7] ?? null,
    hole8_raw: frontHits[8] ?? null,
    hole9_raw: frontHits[9] ?? null,
    status: "done",
  };

  const updateData_Eighteen = {
    hole1_raw: frontHits[1] ?? null,
    hole2_raw: frontHits[2] ?? null,
    hole3_raw: frontHits[3] ?? null,
    hole4_raw: frontHits[4] ?? null,
    hole5_raw: frontHits[5] ?? null,
    hole6_raw: frontHits[6] ?? null,
    hole7_raw: frontHits[7] ?? null,
    hole8_raw: frontHits[8] ?? null,
    hole9_raw: frontHits[9] ?? null,
    hole10_raw: backHits[10] ?? null,
    hole11_raw: backHits[11] ?? null,
    hole12_raw: backHits[12] ?? null,
    hole13_raw: backHits[13] ?? null,
    hole14_raw: backHits[14] ?? null,
    hole15_raw: backHits[15] ?? null,
    hole16_raw: backHits[16] ?? null,
    hole17_raw: backHits[17] ?? null,
    hole18_raw: backHits[18] ?? null,
    status: "done",
  };

  if (imageLinks[1]) {
    await db.collection("Scans").doc(event.params.docId).update(updateData_Eighteen);
  } else {
    await db.collection("Scans").doc(event.params.docId).update(updateData_Nine);
  }
});
