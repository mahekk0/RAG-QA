import fs from "node:fs/promises";
import pdf from "pdf-parse";

/**
 * Extracts and normalizes the readable text from a PDF file.
 *
 * @param {string} filePath Absolute path of the uploaded PDF.
 * @returns {Promise<string>} Cleaned PDF text.
 */
export async function parsePDF(filePath) {
  // Read the uploaded file into a buffer for pdf-parse.
  const fileBuffer = await fs.readFile(filePath);
  // Extract the text layer from every page in the document.
  const parsed = await pdf(fileBuffer);
  // Collapse repeated whitespace so chunk boundaries are consistent and useful.
  const cleanedText = parsed.text.replace(/\s+/g, " ").trim();

  if (!cleanedText) {
    throw new Error("No readable text was found in this PDF. It may be image-only or password-protected.");
  }
  return cleanedText;
}
