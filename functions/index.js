import { GoogleGenAI } from "@google/genai";
import { Buffer } from "buffer";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import fetch from "node-fetch";

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { defineSecret } from "firebase-functions/params";

import { polarUnwrap } from "./unwrap.js";


if (!getApps().length) initializeApp();
const db = getFirestore();


const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY")
const SWING_ANALYSIS_MODEL = "gemini-3-flash-preview";

const SWING_SCORE_FIELDS = [
  "overallScore",
  "addressAngleScore",
  "headUpScore",
  "backswingAngleScore",
  "takebackScore",
];

function clampScore(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeText(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function hasCompletedSwingAnalysis(data) {
  if (data?.status !== "done") return false;
  return SWING_SCORE_FIELDS.every((field) => Number.isFinite(Number(data?.[field])));
}

async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch screenshot (${response.status}): ${imageUrl}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

function parseJsonObject(responseText) {
  const raw = typeof responseText === "string" ? responseText.trim() : "";
  if (!raw) throw new Error("Gemini response was empty");

  const withoutFence = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(withoutFence);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Gemini response was not a JSON object");
  }

  return parsed;
}

async function analyzeSwingScreenshots(screenshotUrls) {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
  const imageBase64List = await Promise.all(screenshotUrls.map((url) => fetchImageAsBase64(url)));

  const prompt = `You are analyzing a sequence of 5 screenshots from one park golf swing.
This is a park golf swing (not regular golf).
Evaluate the full sequence and return ONLY a strict JSON object with this exact schema:
{
  "overallScore": number,
  "addressAngleScore": number,
  "headUpScore": number,
  "backswingAngleScore": number,
  "takebackScore": number,
  "addressAngleFeedback": string,
  "headUpFeedback": string,
  "backswingAngleFeedback": string,
  "takebackFeedback": string,
  "summary": string
}

Rules:
- All score fields must be integers between 0 and 100.
- Feedback and summary must be concise Korean coaching style.
- Return JSON only. No markdown or extra text.`;

  const response = await ai.models.generateContent({
    model: SWING_ANALYSIS_MODEL,
    contents: [
      { text: prompt },
      ...imageBase64List.map((imageBase64) => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      })),
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const parsed = parseJsonObject(response.text);

  return {
    overallScore: clampScore(parsed.overallScore),
    addressAngleScore: clampScore(parsed.addressAngleScore),
    headUpScore: clampScore(parsed.headUpScore),
    backswingAngleScore: clampScore(parsed.backswingAngleScore),
    takebackScore: clampScore(parsed.takebackScore),
    addressAngleFeedback: normalizeText(
      parsed.addressAngleFeedback,
      "어드레스 각도 피드백을 생성하지 못했습니다."
    ),
    headUpFeedback: normalizeText(parsed.headUpFeedback, "헤드업 피드백을 생성하지 못했습니다."),
    backswingAngleFeedback: normalizeText(
      parsed.backswingAngleFeedback,
      "백스윙 각도 피드백을 생성하지 못했습니다."
    ),
    takebackFeedback: normalizeText(parsed.takebackFeedback, "테이크백 피드백을 생성하지 못했습니다."),
    summary: normalizeText(parsed.summary, "스윙 요약을 생성하지 못했습니다."),
  };
}

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
      secrets: [GEMINI_API_KEY],
      memory: "2GiB",
      timeoutSeconds: 120,
    }, async (event) => {
  const docId = event.params.docId;
  const docRef = db.collection("Scans").doc(docId);

  try {
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

    console.error("docId: " + docId);

    //Course A (holes 1-9 of first image)
    const courseAResponse = await processImage(imageLinks[0]);
    const courseAHits = {};
    for (const pair of courseAResponse) {
      if (pair.hole >= 1 && pair.hole <= 9) {
        courseAHits[pair.hole] = pair.hit;
      }
    }
    console.error("courseAHits: " + JSON.stringify(courseAHits));

    //Course B (holes 1-9 of second image) — only if a second image exists
    const courseBHits = {};
    if (imageLinks[1]) {
      const courseBResponse = await processImage(imageLinks[1]);
      for (const pair of courseBResponse) {
        if (pair.hole >= 1 && pair.hole <= 9) {
          courseBHits[pair.hole] = pair.hit;
        }
      }
      console.error("courseBHits: " + JSON.stringify(courseBHits));
    }

    const updateData_OneCourse = {
      AHole1_raw: courseAHits[1] ?? null,
      AHole2_raw: courseAHits[2] ?? null,
      AHole3_raw: courseAHits[3] ?? null,
      AHole4_raw: courseAHits[4] ?? null,
      AHole5_raw: courseAHits[5] ?? null,
      AHole6_raw: courseAHits[6] ?? null,
      AHole7_raw: courseAHits[7] ?? null,
      AHole8_raw: courseAHits[8] ?? null,
      AHole9_raw: courseAHits[9] ?? null,
      status: "done",
    };

    const updateData_TwoCourse = {
      AHole1_raw: courseAHits[1] ?? null,
      AHole2_raw: courseAHits[2] ?? null,
      AHole3_raw: courseAHits[3] ?? null,
      AHole4_raw: courseAHits[4] ?? null,
      AHole5_raw: courseAHits[5] ?? null,
      AHole6_raw: courseAHits[6] ?? null,
      AHole7_raw: courseAHits[7] ?? null,
      AHole8_raw: courseAHits[8] ?? null,
      AHole9_raw: courseAHits[9] ?? null,
      BHole1_raw: courseBHits[1] ?? null,
      BHole2_raw: courseBHits[2] ?? null,
      BHole3_raw: courseBHits[3] ?? null,
      BHole4_raw: courseBHits[4] ?? null,
      BHole5_raw: courseBHits[5] ?? null,
      BHole6_raw: courseBHits[6] ?? null,
      BHole7_raw: courseBHits[7] ?? null,
      BHole8_raw: courseBHits[8] ?? null,
      BHole9_raw: courseBHits[9] ?? null,
      status: "done",
    };

    if (imageLinks[1]) {
      await docRef.update(updateData_TwoCourse);
    } else {
      await docRef.update(updateData_OneCourse);
    }
  } catch (error) {
    console.error(`Processing failed for ${docId}:`, error);
    await docRef.update({
      status: "error",
      errorMessage: error.message || "Processing failed",
      errorTimestamp: new Date().toISOString(),
    });
    // Function completes gracefully - don't re-throw
  }
});

export const onNewSwingVideo = onDocumentCreated(
  {
    document: "SwingVideos/{docId}",
    secrets: [GEMINI_API_KEY],
    memory: "2GiB",
    timeoutSeconds: 120,
  },
  async (event) => {
    const docId = event.params.docId;
    const docRef = db.collection("SwingVideos").doc(docId);

    try {
      const snapshot = event.data;
      if (!snapshot?.exists) return;

      const data = snapshot.data() ?? {};
      const screenshots = Array.isArray(data.screenshots)
        ? data.screenshots
            .filter((item) => item && typeof item.url === "string" && item.url.trim() !== "")
            .sort((a, b) => Number(a.index ?? 0) - Number(b.index ?? 0))
        : [];

      if (!screenshots.length) {
        console.log(`Skipping swing analysis for ${docId}: no valid screenshots`);
        return;
      }

      if (hasCompletedSwingAnalysis(data)) {
        console.log(`Skipping swing analysis for ${docId}: already analyzed`);
        return;
      }

      await docRef.update({
        status: "analyzing",
        analysisErrorMessage: "",
        updatedAt: new Date(),
      });

      const screenshotUrls = screenshots.map((item) => item.url).slice(0, 5);
      const analysis = await analyzeSwingScreenshots(screenshotUrls);

      await docRef.update({
        ...analysis,
        analysisModel: SWING_ANALYSIS_MODEL,
        analysisCompletedAt: new Date(),
        analysisErrorMessage: "",
        status: "done",
        updatedAt: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Swing analysis failed";
      console.error(`Swing analysis failed for ${docId}:`, error);
      await docRef.update({
        status: "error",
        analysisErrorMessage: message,
        updatedAt: new Date(),
      });
    }
  }
);

