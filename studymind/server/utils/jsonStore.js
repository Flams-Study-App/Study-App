import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

const COLLECTIONS = [
  "users", "threads", "messages", "documents", "chunks",
  "decks", "flashcards", "quizzes", "quizAttempts", "tasks", "sessions",
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const name of COLLECTIONS) {
    const file = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf-8");
  }
}

function collectionPath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

export function readCollection(name) {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(collectionPath(name), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function writeCollection(name, data) {
  ensureDataDir();
  fs.writeFileSync(collectionPath(name), JSON.stringify(data, null, 2), "utf-8");
}

export function generateId() {
  return crypto.randomUUID();
}

export function insert(name, doc) {
  const items = readCollection(name);
  const now = new Date().toISOString();
  const record = { id: generateId(), createdAt: now, updatedAt: now, ...doc };
  items.push(record);
  writeCollection(name, items);
  return record;
}

export function insertMany(name, docs) {
  const items = readCollection(name);
  const now = new Date().toISOString();
  const records = docs.map((doc) => ({ id: generateId(), createdAt: now, updatedAt: now, ...doc }));
  writeCollection(name, [...items, ...records]);
  return records;
}

export function findById(name, id) {
  return readCollection(name).find((i) => i.id === id) || null;
}

export function findOne(name, predicate) {
  return readCollection(name).find(predicate) || null;
}

export function findMany(name, predicate = () => true) {
  return readCollection(name).filter(predicate);
}

export function updateById(name, id, updates) {
  const items = readCollection(name);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  writeCollection(name, items);
  return items[idx];
}

export function deleteById(name, id) {
  const items = readCollection(name);
  const filtered = items.filter((i) => i.id !== id);
  writeCollection(name, filtered);
  return filtered.length !== items.length;
}

export function deleteWhere(name, predicate) {
  const items = readCollection(name);
  const filtered = items.filter((i) => !predicate(i));
  writeCollection(name, filtered);
}

export function countWhere(name, predicate = () => true) {
  return readCollection(name).filter(predicate).length;
}

ensureDataDir();
