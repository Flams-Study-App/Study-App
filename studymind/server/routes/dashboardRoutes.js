import express from "express";
import { protect } from "../middleware/auth.js";
import { findMany } from "../utils/jsonStore.js";

const router = express.Router();

router.get("/summary", protect, async (req, res) => {
  const userId = req.user.id;

  const sessions = findMany("sessions", (s) => s.userId === userId && s.sessionType === "focus");
  const totalFocusMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  const attempts = findMany("quizAttempts", (a) => a.userId === userId);
  const avgAccuracy = attempts.length
    ? Math.round((attempts.reduce((sum, a) => sum + a.score / a.total, 0) / attempts.length) * 100)
    : 0;

  const decks = findMany("decks", (d) => d.userId === userId);
  const deckIds = new Set(decks.map((d) => d.id));
  const dueToday = findMany("flashcards", (c) => deckIds.has(c.deckId) && new Date(c.dueDate) <= new Date()).length;
  const totalCards = findMany("flashcards", (c) => deckIds.has(c.deckId)).length;

  const pendingTasks = findMany("tasks", (t) => t.userId === userId && !t.completed).length;
  const completedTasks = findMany("tasks", (t) => t.userId === userId && t.completed).length;

  // Minutes studied per day for the last 14 days (for a chart)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const recentSessions = sessions.filter((s) => new Date(s.createdAt) >= fourteenDaysAgo);
  const byDay = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = 0;
  }
  recentSessions.forEach((s) => {
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    if (byDay[key] !== undefined) byDay[key] += s.durationMinutes;
  });
  const dailyMinutes = Object.entries(byDay).map(([date, minutes]) => ({ date, minutes }));

  // Focus minutes grouped by subject, for a breakdown chart
  const bySubject = {};
  sessions.forEach((s) => {
    bySubject[s.subject] = (bySubject[s.subject] || 0) + s.durationMinutes;
  });
  const subjectBreakdown = Object.entries(bySubject)
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 6);

  // Recent quiz attempts for a quick activity log
  const quizzes = findMany("quizzes", (q) => q.userId === userId);
  const quizById = new Map(quizzes.map((q) => [q.id, q]));
  const recentAttempts = attempts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((a) => {
      const quiz = quizById.get(a.quizId);
      return {
        id: a.id,
        topic: quiz?.topic || "Deleted quiz",
        difficulty: quiz?.difficulty,
        score: a.score,
        total: a.total,
        createdAt: a.createdAt,
      };
    });

  res.json({
    totalFocusMinutes,
    avgAccuracy,
    dueToday,
    totalCards,
    pendingTasks,
    completedTasks,
    streakCount: req.user.streakCount || 0,
    dailyMinutes,
    subjectBreakdown,
    quizzesTaken: attempts.length,
    recentAttempts,
  });
});

export default router;
