import express from "express";
import { protect } from "../middleware/auth.js";
import { insert, insertMany, findMany, findOne, findById, updateById, deleteById, deleteWhere, countWhere } from "../utils/jsonStore.js";
import { scheduleNextReview } from "../utils/spacedRepetition.js";
import { generateStructuredJSON } from "../services/gemini.js";

const router = express.Router();

// Decks
router.get("/decks", protect, async (req, res) => {
  const decks = findMany("decks", (d) => d.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const withCounts = decks.map((deck) => {
    const total = countWhere("flashcards", (c) => c.deckId === deck.id);
    const due = countWhere("flashcards", (c) => c.deckId === deck.id && new Date(c.dueDate) <= new Date());
    return { ...deck, _id: deck.id, total, due };
  });

  res.json({ decks: withCounts });
});

router.post("/decks", protect, async (req, res) => {
  const { title, subject } = req.body;
  if (!title) return res.status(400).json({ message: "Deck title is required" });
  const deck = insert("decks", { userId: req.user.id, title, subject: subject || "General" });
  res.status(201).json({ deck: { ...deck, _id: deck.id } });
});

router.delete("/decks/:id", protect, async (req, res) => {
  const deck = findOne("decks", (d) => d.id === req.params.id && d.userId === req.user.id);
  if (!deck) return res.status(404).json({ message: "Deck not found" });
  deleteWhere("flashcards", (c) => c.deckId === deck.id);
  deleteById("decks", deck.id);
  res.json({ message: "Deck deleted" });
});

// AI-generate a batch of flashcards for a deck from a topic (optionally grounded in a document)
router.post("/decks/:id/generate", protect, async (req, res) => {
  try {
    const { topic, count = 8, documentId } = req.body;
    const deck = findOne("decks", (d) => d.id === req.params.id && d.userId === req.user.id);
    if (!deck) return res.status(404).json({ message: "Deck not found" });
    if (!topic) return res.status(400).json({ message: "A topic is required" });

    let contextBlock = "";
    if (documentId) {
      const chunks = findMany("chunks", (c) => c.documentId === documentId)
        .sort((a, b) => a.order - b.order)
        .slice(0, 12);
      contextBlock = `\n\nBase the cards on this source material:\n${chunks.map((c) => c.text).join("\n")}`;
    }

    const prompt = `Create ${count} flashcards for studying the topic "${topic}".${contextBlock}
Return ONLY valid JSON in this exact shape, nothing else:
{"cards":[{"front":"question or term","back":"concise answer or definition"}]}`;

    const result = await generateStructuredJSON(prompt);
    const cards = insertMany(
      "flashcards",
      result.cards.map((c) => ({
        deckId: deck.id,
        front: c.front,
        back: c.back,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        dueDate: new Date().toISOString(),
        lastReviewedAt: null,
      }))
    );
    res.status(201).json({ cards });
  } catch (err) {
    res.status(500).json({ message: "Could not generate flashcards: " + err.message });
  }
});

// Cards
router.get("/decks/:id/cards", protect, async (req, res) => {
  const cards = findMany("flashcards", (c) => c.deckId === req.params.id)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  res.json({ cards: cards.map((c) => ({ ...c, _id: c.id })) });
});

router.post("/decks/:id/cards", protect, async (req, res) => {
  const { front, back } = req.body;
  if (!front || !back) return res.status(400).json({ message: "Both front and back are required" });
  const card = insert("flashcards", {
    deckId: req.params.id,
    front,
    back,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: new Date().toISOString(),
    lastReviewedAt: null,
  });
  res.status(201).json({ card: { ...card, _id: card.id } });
});

router.get("/decks/:id/due", protect, async (req, res) => {
  const now = new Date();
  const cards = findMany("flashcards", (c) => c.deckId === req.params.id && new Date(c.dueDate) <= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  res.json({ cards: cards.map((c) => ({ ...c, _id: c.id })) });
});

// Submit a review rating (0-5) and reschedule with SM-2
router.post("/cards/:id/review", protect, async (req, res) => {
  const { quality } = req.body;
  if (quality === undefined || quality < 0 || quality > 5) {
    return res.status(400).json({ message: "quality must be a number between 0 and 5" });
  }
  const card = findById("flashcards", req.params.id);
  if (!card) return res.status(404).json({ message: "Card not found" });

  const updated = scheduleNextReview(card, quality);
  const saved = updateById("flashcards", card.id, {
    easeFactor: updated.easeFactor,
    interval: updated.interval,
    repetitions: updated.repetitions,
    dueDate: updated.dueDate.toISOString(),
    lastReviewedAt: updated.lastReviewedAt.toISOString(),
  });

  res.json({ card: { ...saved, _id: saved.id } });
});

router.delete("/cards/:id", protect, async (req, res) => {
  const card = findById("flashcards", req.params.id);
  if (!card) return res.status(404).json({ message: "Card not found" });
  deleteById("flashcards", card.id);
  res.json({ message: "Card deleted" });
});

export default router;
