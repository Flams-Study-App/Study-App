import express from "express";
import { protect } from "../middleware/auth.js";
import { insert, findMany, findOne } from "../utils/jsonStore.js";
import { generateStructuredJSON } from "../services/gemini.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const quizzes = findMany("quizzes", (q) => q.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((q) => ({ _id: q.id, topic: q.topic, difficulty: q.difficulty, questions: q.questions.map(() => ({})), createdAt: q.createdAt }));
  res.json({ quizzes });
});

router.post("/generate", protect, async (req, res) => {
  try {
    const { topic, difficulty = "medium", numQuestions = 5, documentId } = req.body;
    if (!topic) return res.status(400).json({ message: "A topic is required" });

    let contextBlock = "";
    if (documentId) {
      const chunks = findMany("chunks", (c) => c.documentId === documentId)
        .sort((a, b) => a.order - b.order)
        .slice(0, 12);
      contextBlock = `\n\nBase the questions on this source material:\n${chunks.map((c) => c.text).join("\n")}`;
    }

    const prompt = `Create a ${difficulty} difficulty multiple-choice quiz with ${numQuestions} questions on "${topic}".${contextBlock}
Return ONLY valid JSON in this exact shape, nothing else:
{"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"why this is correct"}]}
correctIndex is the 0-based index into options.`;

    const result = await generateStructuredJSON(prompt);
    const quiz = insert("quizzes", {
      userId: req.user.id,
      topic,
      difficulty,
      questions: result.questions,
      sourceDocument: documentId || null,
    });
    res.status(201).json({ quiz: { ...quiz, _id: quiz.id } });
  } catch (err) {
    res.status(500).json({ message: "Could not generate quiz: " + err.message });
  }
});

router.get("/:id", protect, async (req, res) => {
  const quiz = findOne("quizzes", (q) => q.id === req.params.id && q.userId === req.user.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  const safeQuiz = {
    ...quiz,
    _id: quiz.id,
    questions: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
  };
  res.json({ quiz: safeQuiz });
});

router.post("/:id/submit", protect, async (req, res) => {
  const { answers } = req.body;
  const quiz = findOne("quizzes", (q) => q.id === req.params.id && q.userId === req.user.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
    return res.status(400).json({ message: "answers must match the number of questions" });
  }

  let score = 0;
  const results = quiz.questions.map((q, i) => {
    const correct = answers[i] === q.correctIndex;
    if (correct) score += 1;
    return { question: q.question, yourAnswer: answers[i], correctIndex: q.correctIndex, correct, explanation: q.explanation };
  });

  const attempt = insert("quizAttempts", {
    userId: req.user.id,
    quizId: quiz.id,
    answers,
    score,
    total: quiz.questions.length,
  });

  res.json({ attempt, results, score, total: quiz.questions.length });
});

export default router;
