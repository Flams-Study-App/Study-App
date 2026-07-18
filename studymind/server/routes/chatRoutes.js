import express from "express";
import { protect } from "../middleware/auth.js";
import { insert, findById, findMany, findOne, updateById, deleteById, deleteWhere } from "../utils/jsonStore.js";
import { streamChatReply, embedText } from "../services/gemini.js";
import { cosineSimilarity } from "../utils/textUtils.js";

const router = express.Router();

const TUTOR_SYSTEM_PROMPT = `You are Synapse, a friendly and precise AI study tutor.
Explain concepts clearly and at the right depth for a student.
Use short paragraphs, bullet points, and worked examples where helpful.
If you are unsure of a fact, say so instead of guessing.
When the user shares document context, answer using that context and mention if the answer isn't in it.`;

const MODE_INSTRUCTIONS = {
  concise: "Keep this response short and to the point — a few sentences or a tight bullet list. No preamble.",
  detailed: "Give a thorough, well-structured explanation with examples, as if preparing the student for an exam question on this.",
  eli5: "Explain this as simply as possible, using an everyday analogy, as if to someone with no background in the subject.",
};

// List all threads for the logged-in user
router.get("/threads", protect, async (req, res) => {
  const threads = findMany("threads", (t) => t.userId === req.user.id)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ threads: threads.map((t) => ({ ...t, _id: t.id })) });
});

// Create a new thread (optionally attached to a document for Q&A)
router.post("/threads", protect, async (req, res) => {
  const { title, documentId } = req.body;
  const thread = insert("threads", {
    userId: req.user.id,
    title: title || "New chat",
    documentId: documentId || null,
  });
  res.status(201).json({ thread: { ...thread, _id: thread.id } });
});

router.delete("/threads/:id", protect, async (req, res) => {
  const thread = findOne("threads", (t) => t.id === req.params.id && t.userId === req.user.id);
  if (!thread) return res.status(404).json({ message: "Thread not found" });
  deleteWhere("messages", (m) => m.threadId === thread.id);
  deleteById("threads", thread.id);
  res.json({ message: "Thread deleted" });
});

router.get("/threads/:id/messages", protect, async (req, res) => {
  const thread = findOne("threads", (t) => t.id === req.params.id && t.userId === req.user.id);
  if (!thread) return res.status(404).json({ message: "Thread not found" });
  const messages = findMany("messages", (m) => m.threadId === thread.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json({ messages });
});

// Send a message and stream the AI reply back over Server-Sent Events
router.post("/threads/:id/messages", protect, async (req, res) => {
  try {
    const { content, mode } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: "Message content is required" });

    const thread = findOne("threads", (t) => t.id === req.params.id && t.userId === req.user.id);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    insert("messages", { threadId: thread.id, role: "user", content });

    // Auto-title the thread from the first message
    if (thread.title === "New chat") {
      updateById("threads", thread.id, { title: content.slice(0, 48) + (content.length > 48 ? "..." : "") });
    }

    // Retrieve relevant chunks if this thread is bound to a document (RAG)
    let systemContext = TUTOR_SYSTEM_PROMPT;
    if (mode && MODE_INSTRUCTIONS[mode]) {
      systemContext += `\n\n${MODE_INSTRUCTIONS[mode]}`;
    }
    let sourceRefs = [];
    if (thread.documentId) {
      const queryEmbedding = await embedText(content);
      const chunks = findMany("chunks", (c) => c.documentId === thread.documentId);
      const scored = chunks
        .map((c) => ({ chunk: c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      const contextText = scored.map((s) => s.chunk.text).join("\n---\n");
      sourceRefs = scored.map((s) => `Chunk ${s.chunk.order + 1}`);
      systemContext += `\n\nUse the following document excerpts as your primary source:\n${contextText}`;
    }

    const history = findMany("messages", (m) => m.threadId === thread.id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, -1) // exclude the message we just saved; sent separately below
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullReply = "";
    let clientGone = false;
    req.on("close", () => { clientGone = true; });

    try {
      for await (const piece of streamChatReply(history, content, systemContext)) {
        if (clientGone) break;
        fullReply += piece;
        res.write(`data: ${JSON.stringify({ delta: piece })}\n\n`);
      }
    } catch (streamErr) {
      if (!clientGone) res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
    }

    if (fullReply.trim()) {
      insert("messages", { threadId: thread.id, role: "assistant", content: fullReply, sources: sourceRefs });
      updateById("threads", thread.id, {});
    }

    if (!clientGone) {
      res.write(`data: ${JSON.stringify({ done: true, sources: sourceRefs })}\n\n`);
      res.end();
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

export default router;
