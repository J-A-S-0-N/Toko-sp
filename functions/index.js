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

function applyUnusableCaptureScoreOverride(analysis) {
  if (analysis?.captureQuality?.usable !== false) return analysis;

  return {
    ...analysis,
    overallScore: 0,
    addressAngleScore: 0,
    headUpScore: 0,
    backswingAngleScore: 0,
    takebackScore: 0,
  };
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

  const prompt = `
  You are analyzing a chronological sequence of exactly 5 screenshots taken from one park golf swing.

  This is PARK GOLF, not regular golf.
  Evaluate the screenshots as one complete swing sequence rather than as unrelated images.

  Return ONLY one strict JSON object matching this exact schema:

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
    "summary": string,

    "analysisTitle": string,

    "strongestPoint": {
      "metricKey": string,
      "title": string,
      "explanation": string,
      "actionCue": string,
      "screenshotIndex": number,
      "confidence": number
    },

    "primaryFocus": {
      "metricKey": string,
      "title": string,
      "explanation": string,
      "actionCue": string,
      "screenshotIndex": number,
      "confidence": number
    },

    "keyMoments": [
      {
        "screenshotIndex": number,
        "phase": string,
        "title": string,
        "observation": string,
        "type": string,
        "relatedMetric": string,
        "confidence": number
      }
    ],

    "practicePlan": {
      "relatedMetric": string,
      "targetPhase": string,
      "title": string,
      "reason": string,
      "oneLineCue": string,
      "setup": string,
      "steps": [
        string
      ],
      "attemptCount": number,
      "successCriteria": string,
      "commonMistake": string
    },

    "captureQuality": {
      "usable": boolean,
      "cameraAngle": string,
      "fullBodyVisible": boolean,
      "lightingAdequate": boolean,
      "majorOcclusion": boolean,
      "issues": [
        string
      ],
      "confidence": number
    }
  }

  GENERAL RULES:
  - Return valid JSON only.
  - Do not return markdown.
  - Do not include comments.
  - Do not include text before or after the JSON.
  - Use double quotes for every JSON key and string.
  - Do not add fields that are not included in the schema.
  - Do not omit any field.
  - All Korean text must use concise, respectful Korean coaching language.
  - Avoid harsh, insulting, or overly negative language.
  - Do not describe the swing as perfect or completely wrong.
  - Base every judgment only on visible evidence from the 5 screenshots.
  - Consider the limitations of analyzing still screenshots.
  - Do not claim certainty when the screenshots do not clearly support it.
  - Use phrases such as "보입니다", "경향이 있습니다", or "시도해 보세요" when appropriate.

  SCORING RULES:
  - All score fields must be integers from 60 to 100.
  - Never return a score lower than 60.
  - backswingAngleScore must always be an integer from 87 to 100.
  - Never return backswingAngleScore below 87.
  - Use the score range consistently:

    - 60 to 75:
      A meaningful weakness or clearly visible improvement point exists.

    - 76 to 80:
      The swing is clearly good, stable, and has only minor improvement points.
      A really good swing should usually receive approximately 90.

    - 81 to 94:
      The swing is exceptionally strong for the visible park golf sequence.

    - 95 to 100:
      Use only when the visible sequence is unusually excellent with almost no meaningful weakness.
      Do not frequently return scores in this range.

  - Do not cluster every category at exactly the same score.
  - Preserve meaningful differences between the four categories.
  - The strongest category should normally score higher than the primaryFocus category.
  - Scores must remain consistent with the written feedback.
  - overallScore must reflect the four category scores and the full visible swing sequence.
  - A clearly good park golf swing should generally receive an overallScore near 95.
  - Do not lower scores merely because the technique differs from regular golf.
  - Evaluate specifically according to park golf characteristics.

  CATEGORY DEFINITIONS:

  1. addressAngleScore
  Evaluate the visible address posture, including:
  - Upper-body inclination
  - Knee flexion
  - General body readiness
  - Visible balance at setup

  2. takebackScore
  Evaluate the early movement from address into the takeback, including:
  - Whether the movement appears controlled
  - Whether the hands and upper body begin together
  - Whether excessive wrist action is visible
  - Whether the initial movement appears stable

  3. backswingAngleScore
  Evaluate the visible backswing club trajectory direction (forward/backward path), including:
  - Whether the club path appears stable and repeatable during the backswing
  - Whether the club avoids unnecessary forward drift during takeback into backswing
  - Whether the club's backward travel appears controlled rather than rerouted abruptly
  - Whether the backswing-to-downswing transition preserves a consistent path tendency
  - Do not evaluate this category primarily by backswing height alone

  4. headUpScore
  Evaluate visible head and gaze stability around impact, including:
  - Whether the head turns toward the target too early
  - Whether the head rises noticeably before impact
  - Whether the gaze appears to remain near the ball position
  - Whether the head movement appears to disturb the swing

  FEEDBACK RULES:
  - Each feedback field must contain 1 or 2 concise Korean sentences.
  - Each feedback must include:
    1. What was visibly observed
    2. One simple action the user can try
  - Do not repeat exactly the same wording across categories.
  - Do not introduce technical measurements that were not actually calculated.

  SUMMARY RULES:
  - summary must be 2 or 3 concise Korean sentences.
  - Mention the overall character of the swing.
  - Mention one positive point.
  - Mention the most important improvement point.
  - Do not list all four scores again.

  ANALYSIS TITLE RULES:
  - analysisTitle must be a short, memorable Korean title.
  - It should describe the personality of this particular swing.
  - Keep it approximately 8 to 20 Korean characters when possible.
  - Do not include the numeric score.
  - Examples of the intended style:
    - "큰 스윙, 조금 일찍 열린 시선"
    - "안정적으로 시작한 스윙"
    - "피니시까지 중심을 지킨 스윙"
  - Do not copy these examples unless they accurately match the screenshots.

  METRIC KEY RULES:
  The following are the only valid metricKey and relatedMetric values:
  - "addressAngle"
  - "headUp"
  - "backswingAngle"
  - "takeback"

  STRONGEST POINT RULES:
  - strongestPoint must identify the strongest visibly supported part of this swing.
  - Normally select the category with the highest score.
  - metricKey must match one of the four valid metric keys.
  - title must be short and positive.
  - explanation must explain why it was selected.
  - actionCue must tell the user how to preserve or repeat the strength.
  - screenshotIndex must be an integer from 0 to 4.
  - screenshotIndex must point to the screenshot that best demonstrates the strength.
  - confidence must be a number from 0 to 1.

  PRIMARY FOCUS RULES:
  - primaryFocus must identify exactly one highest-priority improvement.
  - Normally select the lowest reliable scoring category.
  - Do not select multiple problems.
  - metricKey must match one of the four valid metric keys.
  - title must describe a clear improvement objective.
  - explanation must describe the visible reason.
  - actionCue must be one short physical instruction that can be remembered during the next swing.
  - screenshotIndex must be an integer from 0 to 4.
  - screenshotIndex must point to the clearest evidence.
  - confidence must be a number from 0 to 1.
  - primaryFocus must directly match the practicePlan.

  KEY MOMENT RULES:
  - keyMoments must contain exactly 5 objects.
  - Include exactly one object for each screenshotIndex:
    - 0
    - 1
    - 2
    - 3
    - 4
  - Keep the objects in chronological screenshot order.
  - Infer the most appropriate swing phase for each screenshot.

  The only valid phase values are:
  - "address"
  - "takeback"
  - "backswingTop"
  - "impact"
  - "finish"

  The only valid type values are:
  - "strength"
  - "improvement"
  - "neutral"

  For every key moment:
  - title must be a short Korean phase or observation title.
  - observation must explain what is visibly important in that screenshot.
  - relatedMetric must be one of:
    - "addressAngle"
    - "headUp"
    - "backswingAngle"
    - "takeback"
  - Use the closest relevant metric even when the frame does not perfectly match one category.
  - confidence must be a number from 0 to 1.
  - Do not claim that ball direction, distance, or contact quality is visible unless it is clearly shown.

  PRACTICE PLAN RULES:
  - The practice plan must address only the primaryFocus.
  - Do not introduce a separate swing problem.
  - The plan must be suitable for park golf.
  - The practice must require no special equipment.
  - It must be simple enough for an older casual golfer to understand.
  - It must be safely performable during ordinary swing practice.

  practicePlan.relatedMetric:
  - Must exactly match primaryFocus.metricKey.

  practicePlan.targetPhase:
  Use exactly one of:
  - "address"
  - "takeback"
  - "backswingTop"
  - "impact"
  - "finish"

  practicePlan.title:
  - Use a short and actionable Korean title.
  - It should clearly describe the practice goal.

  practicePlan.reason:
  - Explain in one concise Korean sentence why this practice was selected.
  - Refer only to visible evidence from the screenshots.

  practicePlan.oneLineCue:
  - Provide one short phrase the user can remember while swinging.
  - It should be suitable for displaying on the camera screen.
  - Keep it concise.
  - Example style:
    - "공이 맞는 소리를 들은 뒤 고개를 들어보세요."
    - "탑까지 천천히, 내려올 때 자연스럽게."
  - Do not use an example unless it matches the actual analysis.

  practicePlan.setup:
  - Explain how the user should prepare before starting the practice.
  - Keep it to one concise sentence.

  practicePlan.steps:
  - Return exactly 3 simple Korean instruction strings.
  - Each step must describe one physical or attentional action.
  - Keep the steps in chronological order.
  - Do not include complicated technical terminology.

  practicePlan.attemptCount:
  - Always return 3.

  practicePlan.successCriteria:
  - Describe one visibly checkable condition for the next screenshot analysis.
  - It must be something that can reasonably be evaluated from still screenshots.
  - Good examples include:
    - Head direction remains stable until impact
    - Backswing appears more compact
    - Knees remain slightly flexed
    - Finish posture remains balanced
  - Do not use criteria involving:
    - Ball direction
    - Shot distance
    - Clubhead speed
    - Power
    - Tempo
    - Smoothness
    - Exact joint angles

  practicePlan.commonMistake:
  - Explain one mistake the user should avoid while attempting the correction.
  - The warning must prevent overcorrection.
  - Keep it to one concise Korean sentence.

  CAPTURE QUALITY RULES:
  - captureQuality.usable is true only when the screenshots provide enough visible information for a useful analysis.
  - If no visible human figure is present in most screenshots, set captureQuality.usable to false.
  - If the screenshots appear blank or empty (for example black frames, no discernible subject, or near-static non-scene frames), set captureQuality.usable to false.
  - cameraAngle must be exactly one of:
    - "face_on"
    - "down_the_line"
    - "unknown"
  - fullBodyVisible must indicate whether the body and relevant club movement are sufficiently visible.
  - lightingAdequate must indicate whether posture can be seen clearly.
  - majorOcclusion must indicate whether another object or framing issue significantly blocks the golfer.
  - issues must contain concise Korean descriptions of any capture problems.
  - Return an empty array when there are no meaningful issues.
  - confidence must be a number from 0 to 1.

  IMPORTANT LIMITATIONS:
  Do not infer or calculate:
  - Ball direction
  - Shot distance
  - Carry distance
  - Clubhead speed
  - Impact force
  - Exact swing tempo
  - Swing smoothness from timing
  - Exact joint angles
  - Shot success
  - Contact quality
  - Consistency across multiple swings

  Do not provide a diagnosis or injury-related statement.
  Do not claim that one correction will guarantee better performance.

  Before returning the JSON, internally verify:
  - Every original score and feedback field is present.
  - analysisTitle is present.
  - strongestPoint is present.
  - primaryFocus is present.
  - keyMoments contains exactly 5 objects.
  - practicePlan contains exactly 3 steps.
  - practicePlan.attemptCount is exactly 3.
  - primaryFocus.metricKey and practicePlan.relatedMetric are identical.
  - All screenshotIndex values are between 0 and 4.
  - All confidence values are between 0 and 1.
  - The final output is valid JSON.
  `;


/*   const prompt = `You are analyzing a sequence of 5 screenshots from one park golf swing.
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
- Return JSON only. No markdown or extra text.`; */

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

  const METRIC_KEYS = ["addressAngle", "headUp", "backswingAngle", "takeback"];
  const PHASES = ["address", "takeback", "backswingTop", "impact", "finish"];
  const TYPES = ["strength", "improvement", "neutral"];
  const CAMERA_ANGLES = ["face_on", "down_the_line", "unknown"];

  const clampScore78to100 = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 78;
    return Math.max(78, Math.min(100, Math.round(n)));
  };

  const clamp01 = (value, fallback = 0.6) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(1, n));
  };

  const asMetricKey = (value, fallback = "addressAngle") =>
    METRIC_KEYS.includes(value) ? value : fallback;

  const asPhase = (value, fallback = "address") =>
    PHASES.includes(value) ? value : fallback;

  const asType = (value, fallback = "neutral") =>
    TYPES.includes(value) ? value : fallback;

  const asCameraAngle = (value) =>
    CAMERA_ANGLES.includes(value) ? value : "unknown";

  const asBoolean = (value, fallback = false) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
    }
    return fallback;
  };

  const normalizeKeyMoments = (value) => {
    const arr = Array.isArray(value) ? value : [];
    const byIndex = new Map(arr.map((m) => [Number(m?.screenshotIndex), m]));

    return [0, 1, 2, 3, 4].map((idx) => {
      const m = byIndex.get(idx) ?? {};
      return {
        screenshotIndex: idx,
        phase: asPhase(m.phase, idx === 0 ? "address" : idx === 4 ? "finish" : "takeback"),
        title: normalizeText(m.title, `장면 ${idx + 1}`),
        observation: normalizeText(m.observation, "관찰 내용을 생성하지 못했습니다."),
        type: asType(m.type, "neutral"),
        relatedMetric: asMetricKey(m.relatedMetric, "addressAngle"),
        confidence: clamp01(m.confidence, 0.6),
      };
    });
  };

  const normalizePoint = (value, fallbackMetric = "addressAngle") => ({
    metricKey: asMetricKey(value?.metricKey, fallbackMetric),
    title: normalizeText(value?.title, "핵심 포인트"),
    explanation: normalizeText(value?.explanation, "설명을 생성하지 못했습니다."),
    actionCue: normalizeText(value?.actionCue, "다음 스윙에서 같은 느낌을 재현해 보세요."),
    screenshotIndex: Math.max(
      0,
      Math.min(
        4,
        Number.isFinite(Number(value?.screenshotIndex)) ? Math.round(Number(value.screenshotIndex)) : 0
      )
    ),
    confidence: clamp01(value?.confidence, 0.6),
  });

  const primaryFocus = normalizePoint(parsed.primaryFocus, "headUp");

  const rawSteps = Array.isArray(parsed?.practicePlan?.steps) ? parsed.practicePlan.steps : [];
  const steps = [0, 1, 2].map((i) => normalizeText(rawSteps[i], `연습 단계 ${i + 1}`));

  return {
    overallScore: clampScore78to100(parsed.overallScore),
    addressAngleScore: clampScore78to100(parsed.addressAngleScore),
    headUpScore: clampScore78to100(parsed.headUpScore),
    backswingAngleScore: clampScore78to100(parsed.backswingAngleScore),
    takebackScore: clampScore78to100(parsed.takebackScore),

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

    analysisTitle: normalizeText(parsed.analysisTitle, "이번 스윙 분석"),

    strongestPoint: normalizePoint(parsed.strongestPoint, "addressAngle"),
    primaryFocus,

    keyMoments: normalizeKeyMoments(parsed.keyMoments),

    practicePlan: {
      relatedMetric: primaryFocus.metricKey,
      targetPhase: asPhase(parsed?.practicePlan?.targetPhase, "takeback"),
      title: normalizeText(parsed?.practicePlan?.title, "핵심 교정 연습"),
      reason: normalizeText(
        parsed?.practicePlan?.reason,
        "관찰된 장면을 기준으로 연습 포인트를 정리했습니다."
      ),
      oneLineCue: normalizeText(
        parsed?.practicePlan?.oneLineCue,
        "천천히 시작하고 끝까지 균형을 유지해 보세요."
      ),
      setup: normalizeText(parsed?.practicePlan?.setup, "평소 스윙 자세에서 편하게 준비해 주세요."),
      steps,
      attemptCount: 3,
      successCriteria: normalizeText(
        parsed?.practicePlan?.successCriteria,
        "다음 촬영에서 핵심 동작이 더 안정적으로 보이는지 확인해 보세요."
      ),
      commonMistake: normalizeText(
        parsed?.practicePlan?.commonMistake,
        "한 번에 크게 바꾸려 하지 말고 한 포인트씩 점검해 보세요."
      ),
    },

    captureQuality: {
      usable: asBoolean(parsed?.captureQuality?.usable, false),
      cameraAngle: asCameraAngle(parsed?.captureQuality?.cameraAngle),
      fullBodyVisible: asBoolean(parsed?.captureQuality?.fullBodyVisible, false),
      lightingAdequate: asBoolean(parsed?.captureQuality?.lightingAdequate, false),
      majorOcclusion: asBoolean(parsed?.captureQuality?.majorOcclusion, false),
      issues: Array.isArray(parsed?.captureQuality?.issues)
        ? parsed.captureQuality.issues.map((v) => normalizeText(v, "")).filter(Boolean)
        : [],
      confidence: clamp01(parsed?.captureQuality?.confidence, 0.6),
    },
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
      const finalAnalysis = applyUnusableCaptureScoreOverride(analysis);

      await docRef.update({
        ...finalAnalysis,
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
