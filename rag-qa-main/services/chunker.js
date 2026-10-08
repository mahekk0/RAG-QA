import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Splits document text into overlapping chunks suitable for semantic retrieval.
 *
 * @param {string} text Cleaned document text.
 * @returns {Promise<string[]>} Ordered array of non-empty text chunks.
 */
export async function chunkText(text) {
  // 512 characters preserves focused context; 50-character overlap avoids losing ideas at boundaries.
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 50,
    separators: ["\n\n", "\n", ". ", " ", ""]
  });
  return splitter.splitText(text);
}
