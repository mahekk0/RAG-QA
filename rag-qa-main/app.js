import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import uploadRouter from "./routes/upload.js";
import queryRouter from "./routes/query.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT) || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (_req, res) => res.render("index"));
app.get("/chat", (req, res) => {
  const filename = typeof req.query.filename === "string" ? req.query.filename : "";
  if (!filename) {
    return res.status(400).render("error", { message: "Please upload a PDF before opening the chat." });
  }
  return res.render("chat", { filename });
});

app.use("/upload", uploadRouter);
app.use("/query", queryRouter);

app.use((req, res) => {
  res.status(404).render("error", { message: `The page ${req.originalUrl} was not found.` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).render("error", { message: "Something went wrong. Please try again." });
});

app.listen(port, () => {
  console.log("Server running on port 3000");
  if (port !== 3000) console.log(`Configured port: ${port}`);
});
