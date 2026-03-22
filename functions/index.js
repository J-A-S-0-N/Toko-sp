import { onDocumentCreated } from "firebase-functions/v2/firestore";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import unwrapModule from "./unwrap.js";

const { polarUnwrap } = unwrapModule;

// delete when pushing github
//API key

//const client = new OpenAI({ apiKey: ApiKey });
const client = new OpenAI({
    apiKey: ApiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const ai = new GoogleGenAI({apiKey : ApiKey});

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
        { text: "Read the two number rows in the image. Match top and bottom numbers vertically by the same column. The bottom row is always a circular sequence of 1 to 9 but may start at any number in the image, so normalize it to horizontal order 1,2,3,4,5,6,7,8,9 and keep each top number paired with its original bottom-column match." }
    ],
    config: {
        responseMimeType: "application/json",
    },
  });
  console.log(response.text);
}

export const onNewDocument = onDocumentCreated("testBucket/{docId}", async (event) => {
    const snapshot = event.data;
    const imageLink = snapshot.get("imageLink");

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
    await main(imageBase64);
});