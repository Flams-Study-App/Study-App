/**
 * Splits long text into overlapping word-based chunks so each chunk
 * stays within a safe size for embeddings while keeping some context
 * from the previous chunk (the overlap).
 */
export function chunkText(text, chunkSize = 250, overlap = 40) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(" ");
    if (chunk.trim().length > 0) chunks.push(chunk);
    if (end === words.length) break;
    start = end - overlap;
  }

  return chunks;
}

export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
