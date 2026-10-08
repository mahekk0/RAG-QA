import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePDF } from "../services/pdfParser.js";
import { chunkText } from "../services/chunker.js";
import { embedAndStore } from "../services/embedder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    callback(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") return callback(new Error("Only PDF files are allowed."));
    return callback(null, true);
  }
});

const router = express.Router();

router.post("/", (req, res) => {
  upload.single("document")(req, res, async (uploadError) => {
    if (uploadError) {
      const message = uploadError instanceof multer.MulterError && uploadError.code === "LIMIT_FILE_SIZE"
        ? "The PDF is too large. The maximum file size is 10 MB."
        : uploadError.message;
      return res.status(400).render("error", { message });
    }

    try {
      if (!req.file) throw new Error("Choose a PDF file to upload.");
      const text = await parsePDF(req.file.path);
      const chunks = await chunkText(text);
      // Keep the original name as the document identity shown to the user and used in Chroma metadata.
      const documentName = req.file.originalname;
      await embedAndStore(chunks, documentName);
      return res.redirect(`/chat?filename=${encodeURIComponent(documentName)}`);
    } catch (error) {
      console.error("Upload failed:", error);
      return res.status(500).render("error", { message: error.message || "Unable to process this PDF." });
    }
  });
});

export default router;
