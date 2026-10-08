import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retrieveChunks } from "../services/retriever.js";

const router = express.Router();
const fallbackAnswer = "I could not find relevant information in the uploaded document.";
const generationModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const minimumSimilarity = Number(process.env.RETRIEVAL_MIN_SCORE || "0.6");

function writeEvent(res, event, payload) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

router.post("/", async (req, res) => {
  const { question, filename } = req.body;
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.flushHeaders();

  try {
    if (typeof question !== "string" || !question.trim() || typeof filename !== "string" || !filename) {
      throw new Error("A question and document filename are required.");
    }
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing. Add it to your .env file.");

    const chunks = await retrieveChunks(question.trim(), filename);
    if (!chunks.length || chunks[0].score < minimumSimilarity) {
      writeEvent(res, "done", { answer: fallbackAnswer });
      return res.end();
    }

    const context = chunks.map((chunk, index) => `[${index + 1}] ${chunk.text}`).join("\n\n");
    const prompt = `System: "You are a helpful assistant. Answer the user's question using ONLY the context provided below. Do not use any prior knowledge. If the answer is not present in the context, respond with exactly: I don't know based on the provided document."
Context:
${context}
Question: ${question.trim()}`;
    const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = gemini.getGenerativeModel({
      model: generationModel,
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
    });
    const streamResult = await model.generateContentStream(prompt);
    let answer = "";
    for await (const chunk of streamResult.stream) {
      const token = chunk.text();
      if (token) {
        answer += token;
        writeEvent(res, "token", { token });
      }
    }
    writeEvent(res, "done", { answer });
    return res.end();
  } catch (error) {
    console.error("Query failed:", error);
    writeEvent(res, "error", { message: error.message || "Unable to answer that question." });
    return res.end();
  }
});

export default router;
