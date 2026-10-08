import { getDocumentCollection, getQueryEmbeddings } from "./embedder.js";

/**
 * Retrieves the five most semantically relevant chunks for a question within one document.
 *
 * @param {string} question User's question.
 * @param {string} filename Uploaded document filename.
 * @returns {Promise<Array<{text: string, score: number}>>} Results sorted by descending cosine similarity.
 */
export async function retrieveChunks(question, filename) {
  const embeddings = getQueryEmbeddings();
  const collection = await getDocumentCollection();
  const questionVector = await embeddings.embedQuery(question);
  // Cosine distance measures vector separation; with Chroma cosine space, similarity is 1 - distance.
  const result = await collection.query({
    queryEmbeddings: [questionVector],
    nResults: 5,
    where: { filename },
    include: ["documents", "distances"]
  });
  const documents = result.documents[0] || [];
  const distances = result.distances[0] || [];

  return documents
    .map((text, index) => ({ text, score: Math.max(0, 1 - (distances[index] ?? 1)) }))
    .sort((a, b) => b.score - a.score);
}
