import { onDocumentCreated } from "firebase-functions/v2/firestore";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import unwrapModule from "./unwrap.js";

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import { getStorage } from "firebase-admin/storage";
import { randomUUID } from "crypto";
import 'dotenv/config';


if (!getApps().length) initializeApp();
const db = getFirestore();

const bucket = getStorage().bucket();

const { polarUnwrap } = unwrapModule;

// delete when pushing github
const ApiKey = process.env.GEMINI_API_KEY;

//const client = new OpenAI({ apiKey: ApiKey });
const client = new OpenAI({
  apiKey: ApiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const ai = new GoogleGenAI({ apiKey: ApiKey });

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

export const onNewDocument = onDocumentCreated("testBucket/{docId}", async (event) => {
  const snapshot = event.data;
  const imageLink = snapshot.get("imageLink");

  if (typeof imageLink !== "string" || imageLink.trim() === "") {
    throw new Error("imageLink is not a valid string");
  }

  //download first and then convert to base64 and throw it to response function
  const res = await fetch(imageLink);
  if (!res.ok) {
    throw new Error(`Failed to fetch image (${res.status}): ${imageLink}`);
  }

  const arrayBuffer = await res.arrayBuffer();

  const originalBuffer = Buffer.from(arrayBuffer);

  const unwrappedBuffer = await polarUnwrap(originalBuffer);

  const imageBase64 = unwrappedBuffer.toString("base64");

  //await response(imageBase64);
  const jsonResponse = await main(imageBase64);

  console.error("docId: " + event.params.docId);

  let hitResults = [];
  let holeCounts = [];

  for (const pair of jsonResponse) {
    hitResults.push(pair.hit);
    holeCounts.push(pair.hole);
  }

  console.error("hitResults: " + hitResults);
  console.error("holeCounts: " + holeCounts);


  await db.collection("testBucket").doc(event.params.docId).update({
    hole1: holeCounts[0] == 1 ? hitResults[0] : null,
    hole2: holeCounts[1] == 2 ? hitResults[1] : null,
    hole3: holeCounts[2] == 3 ? hitResults[2] : null,
    hole4: holeCounts[3] == 4 ? hitResults[3] : null,
    hole5: holeCounts[4] == 5 ? hitResults[4] : null,
    hole6: holeCounts[5] == 6 ? hitResults[5] : null,
    hole7: holeCounts[6] == 7 ? hitResults[6] : null,
    hole8: holeCounts[7] == 8 ? hitResults[7] : null,
    hole9: holeCounts[8] == 9 ? hitResults[8] : null,
    result: "success",
  });
  /*
  await updateDoc(doc(db, "testBucket", event.params.docId), {
      hole1: jsonResponse.hole1,
      hole2: jsonResponse.hole2,
      hole3: jsonResponse.hole3,
      hole4: jsonResponse.hole4,
      hole5: jsonResponse.hole5,
      hole6: jsonResponse.hole6,
      hole7: jsonResponse.hole7,
      hole8: jsonResponse.hole8,
      hole9: jsonResponse.hole9,
      result: "success",
  });
  */
});
