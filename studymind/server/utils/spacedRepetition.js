/**
 * SM-2 spaced repetition algorithm (the same family used by Anki/SuperMemo).
 * quality: 0-5 rating of how well the card was recalled.
 *   0-2 = "Again" (forgot / hard to recall) -> restart the interval
 *   3   = "Hard"  -> small interval increase
 *   4   = "Good"  -> normal growth
 *   5   = "Easy"  -> bigger growth
 */
export function scheduleNextReview(card, quality) {
  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return { easeFactor, interval, repetitions, dueDate, lastReviewedAt: new Date() };
}
