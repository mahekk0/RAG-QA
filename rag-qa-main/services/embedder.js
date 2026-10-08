import { ChromaClient, CloudClient } from "chromadb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const collectionName = "documents";
const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";
// All reads and writes supply Gemini vectors explicitly. This prevents the Chroma
// client from trying to load its optional DefaultEmbeddingFunction package.
const explicitGeminiVectors = {
  name: "gemini-explicit-vectors",
  async generate() {
    throw new Error("This collection requires embeddings supplied by the Gemini embedding service.");
  }
};

function getEmbeddings() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing. Add it to your .env file.");
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: embeddingModel
  });
}

/**
 * Opens the shared cosine-distance ChromaDB collection used for all documents.
 *
 * @returns {Promise<import("chromadb").Collection>} The documents collection.
 */
export async function getDocumentCollection() {
  const usesChromaCloud = Boolean(process.env.CHROMA_API_KEY);
  const chromaUrl = new URL(process.env.CHROMA_URL || "http://localhost:8000");
  const client = usesChromaCloud
    ? new CloudClient({
        apiKey: process.env.CHROMA_API_KEY,
        tenant: process.env.CHROMA_TENANT,
        database: process.env.CHROMA_DATABASE
      })
    : new ChromaClient({
        host: chromaUrl.hostname,
        port: Number(chromaUrl.port || (chromaUrl.protocol === "https:" ? 443 : 80)),
        ssl: chromaUrl.protocol === "https:"
      });
  try {
    return await client.getOrCreateCollection({
      name: collectionName,
      // Gemini vectors are supplied explicitly, so Chroma must not load its default embedder.
      embeddingFunction: explicitGeminiVectors,
      configuration: { hnsw: { space: "cosine" } }
    });
  } catch (error) {
    throw new Error(
      `ChromaDB is unavailable${usesChromaCloud ? " in Chroma Cloud" : ` at ${chromaUrl.href}`}. ${error.message}`
    );
  }
}

/**
 * Embeds document chunks with Gemini and stores the vectors and source metadata in ChromaDB.
 *
 * @param {string[]} chunks Text chunks to index.
 * @param {string} filename Original uploaded filename.
 * @returns {Promise<void>}
 */
export async function embedAndStore(chunks, filename) {
  if (!chunks.length) throw new Error("The PDF did not produce any chunks to index.");

  const collection = await getDocumentCollection();
  const embeddings = getEmbeddings();
  // Re-uploading a filename replaces its old chunks rather than mixing document versions.
  await collection.delete({ where: { filename } });
  // Embed one chunk at a time. The Google batch endpoint can silently return empty
  // vectors on a per-request failure; individual calls preserve the real API error.
  const vectors = [];
  for (const chunk of chunks) {
    const vector = await embeddings.embedQuery(chunk);
    if (!Array.isArray(vector) || vector.length === 0 || !vector.every(Number.isFinite)) {
      throw new Error(`Gemini returned an invalid embedding from ${embeddingModel}. Check GEMINI_API_KEY access and model availability.`);
    }
    vectors.push(vector);
  }
  // Chroma keeps the vector, original text, and metadata together for later retrieval.
  await collection.add({
    ids: chunks.map((_, index) => `${filename}-chunk-${index}`),
    embeddings: vectors,
    documents: chunks,
    metadatas: chunks.map((_, chunkIndex) => ({ filename, chunkIndex }))
  });
}

/**
 * Creates the Gemini embedding client used for search queries.
 *
 * @returns {GoogleGenerativeAIEmbeddings} Configured embedding client.
 */
export function getQueryEmbeddings() {
  return getEmbeddings();
}
