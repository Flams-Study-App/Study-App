import express from "express";
import fs from "fs";
import path from "path";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { insert, findMany, findOne, updateById, deleteById, deleteWhere } from "../utils/jsonStore.js";
import { chunkText } from "../utils/textUtils.js";
import { embedText, generateStructuredJSON } from "../services/gemini.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const documents = findMany("documents", (d) => d.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ documents: documents.map((d) => ({ ...d, _id: d.id })) });
});

router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const document = insert("documents", {
      userId: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: ext.replace(".", ""),
      chunkCount: 0,
      status: "processing",
      summary: "",
      keyTopics: [],
    });

    // Respond immediately, process embeddings in the background
    res.status(201).json({ document: { ...document, _id: document.id } });

    (async () => {
      try {
        let text = "";
        const filePath = path.join(process.cwd(), "uploads", req.file.filename);

        if (ext === ".pdf") {
          const pdfParse = (await import("pdf-parse")).default;
          const buffer = fs.readFileSync(filePath);
          const parsed = await pdfParse(buffer);
          text = parsed.text;
        } else {
          text = fs.readFileSync(filePath, "utf-8");
        }

        const chunks = chunkText(text);
        let order = 0;
        for (const chunkStr of chunks) {
          const embedding = await embedText(chunkStr);
          insert("chunks", { documentId: document.id, text: chunkStr, embedding, order });
          order += 1;
        }

        let summary = "";
        let keyTopics = [];
        try {
          const previewText = chunks.slice(0, 6).join("\n").slice(0, 6000);
          const summaryPrompt = `Summarize the following study material in 2-3 sentences, and list up to 5 key topics it covers.
Return ONLY valid JSON in this exact shape, nothing else:
{"summary":"...","keyTopics":["...","..."]}

Material:
${previewText}`;
          const summaryResult = await generateStructuredJSON(summaryPrompt);
          summary = summaryResult.summary || "";
          keyTopics = summaryResult.keyTopics || [];
        } catch (summaryErr) {
          console.error("Summary generation failed (non-fatal):", summaryErr.message);
        }

        updateById("documents", document.id, {
          chunkCount: chunks.length,
          status: "ready",
          summary,
          keyTopics,
        });
      } catch (bgErr) {
        console.error("Document processing failed:", bgErr.message);
        updateById("documents", document.id, { status: "failed" });
      }
    })();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/status", protect, async (req, res) => {
  const document = findOne("documents", (d) => d.id === req.params.id && d.userId === req.user.id);
  if (!document) return res.status(404).json({ message: "Document not found" });
  res.json({ document: { ...document, _id: document.id } });
});

router.delete("/:id", protect, async (req, res) => {
  const document = findOne("documents", (d) => d.id === req.params.id && d.userId === req.user.id);
  if (!document) return res.status(404).json({ message: "Document not found" });

  deleteWhere("chunks", (c) => c.documentId === document.id);
  const filePath = path.join(process.cwd(), "uploads", document.fileName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  deleteById("documents", document.id);

  res.json({ message: "Document deleted" });
});

export default router;
