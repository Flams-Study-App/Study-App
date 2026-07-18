<<<<<<< HEAD
# Synapse — AI Study Platform

Synapse is a full-stack study assistant: an AI tutor you can chat with, a place to upload your notes and ask questions about them directly, auto-generated flashcards with spaced repetition, AI-generated quizzes, a task planner with a Pomodoro timer, and a dashboard that tracks your progress over time.

**No database setup required.** Data is stored in local JSON files on disk — no MongoDB, no Atlas, no connection strings. Built with React + Express + Mock Offline AI (no API key required), with a dark glassmorphism interface inspired by [assistant-ui](https://github.com/assistant-ui/assistant-ui).

---

## Features

| Feature | What it does |
|---|---|
| **AI Chat Tutor** | Ask questions, get explanations, worked examples. Replies stream in token-by-token, just like ChatGPT/Claude, with copy, regenerate, and stop-generating controls on every response. Choose a response style — **Concise**, **Detailed**, or **ELI5** — per message. Code blocks get full syntax highlighting. |
| **Document Q&A** | Upload a PDF/TXT/MD file. Synapse chunks it, embeds it with Gemini, and answers your questions using only that material (retrieval-augmented generation), citing which chunk each answer came from. Each document also gets an AI-written summary and key-topic tags as soon as it finishes processing. |
| **Flashcards + Spaced Repetition** | Generate flashcards on any topic with one click — optionally grounded in one of your uploaded documents — or add your own. Reviews use the SM-2 algorithm (the same family of algorithm Anki uses) so cards you know well show up less often, and cards you struggle with come back sooner. |
| **AI Quiz Generator** | Generate multiple-choice quizzes on any topic, at a difficulty you choose, optionally grounded in a document you've uploaded. Instant grading with explanations. |
| **Study Planner + Pomodoro Timer** | Track assignments/tasks by subject, priority, and due date. A 25/5-minute Pomodoro timer logs your focus sessions automatically. |
| **Progress Dashboard** | Total focus time, quiz accuracy, flashcards due, day streak, a 14-day focus-time chart, a focus-time-by-subject breakdown, and a recent quiz activity log. |
| **Landing page** | A public marketing page for signed-out visitors, separate from the in-app dashboard. |
| **Toast notifications & error boundary** | Consistent success/error feedback across the app instead of browser `alert()` popups, plus a graceful fallback screen if something ever crashes. |
| **Confirmation dialogs** | Deleting a document, deck, chat, or task always asks for confirmation first — no more accidental data loss. |
| **Mobile-responsive layout** | The sidebar collapses into a slide-in drawer on small screens, and the chat view adapts to a single-pane mobile layout. |
| **Settings page** | View account details, streak, and log out with a confirmation step. |
| **Auth** | Email/password accounts with JWT sessions. |

---

## Tech stack

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, recharts, react-markdown, lucide-react icons
- **Backend:** Node.js, Express, JWT auth, Multer (file uploads), local JSON files for storage
- **AI:** Offline Mock AI (fully functional mock streaming chat, embedding generator for local document search, quiz, and flashcard generation)

---

## Project structure

```
studymind/
├── server/                  # Express API
│   ├── data/                 # JSON files (auto-created) — this is your "database"
│   ├── middleware/           # JWT auth guard, file upload handling
│   ├── routes/                # API endpoints, grouped by feature
│   ├── services/gemini.js    # All Gemini API calls live here
│   ├── utils/
│   │   ├── jsonStore.js       # The file-based data layer (read/write/query JSON collections)
│   │   ├── spacedRepetition.js # SM-2 algorithm
│   │   └── textUtils.js       # Text chunking, cosine similarity
│   ├── .env.example
│   └── server.js
├── client/                  # React app
│   └── src/
│       ├── api/axios.js     # Pre-configured API client (attaches JWT automatically)
│       ├── context/         # Auth, toast, and confirm-dialog state
│       ├── components/      # Chat UI, sidebar, Pomodoro timer, etc.
│       └── pages/           # One file per route
└── README.md
```

---

## Prerequisites

You'll need, before you start:

1. **Node.js 18+** — [nodejs.org](https://nodejs.org)

That's it — no database account or API keys needed.

---

## Setup

### 1. Run Offline (No Gemini key needed)

The server runs with a built-in mock AI engine that generates flashcards, quizzes, summaries, and chats offline. No setup is required.

### 2. Configure the backend

```bash
cd server
npm install
```

Copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

Open `.env` in **VS Code** (not Notepad — it silently saves as `.env.txt`) and fill in:

```
JWT_SECRET=any_long_random_string_you_make_up
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

You should see:
```
Synapse server running on http://localhost:5000
Data storage: local JSON files in server/data/ (no database needed)
```

On first run, a `server/data/` folder is created automatically containing empty JSON files (`users.json`, `documents.json`, `flashcards.json`, etc.) — this is where all your app data lives. Nothing to configure.

**If the server won't start / port already in use (common on Windows):**
```powershell
netstat -ano | findstr :5000
taskkill /PID <the_pid_you_see> /F
```

### 3. Configure the frontend

In a **new terminal**:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. Create an account and you're in.

---

## How the AI features work under the hood

- **Chat streaming:** the frontend opens a `fetch()` request to a Server-Sent Events endpoint (`POST /api/chat/threads/:id/messages`) and reads the response body as a stream, appending each token to the UI as it arrives — no extra libraries needed.
- **Document Q&A (RAG):** on upload, the file's text is split into ~250-word overlapping chunks, each chunk is embedded with a local deterministic text embedding algorithm, and the vectors are stored in `server/data/chunks.json`. When you ask a question in a thread linked to that document, your question is embedded too, compared against every chunk with cosine similarity, and the top 5 chunks are stuffed into the prompt as context — so answers are grounded in your actual notes, not general knowledge.
- **Flashcards:** reviews use the **SM-2 spaced repetition algorithm**. Rating a card "Again" resets it to review again tomorrow; rating it "Easy" pushes the next review much further out. This is the same underlying idea used by Anki.
- **Quizzes:** Gemini is prompted to return strict JSON (`responseMimeType: "application/json"`), which is parsed directly into quiz questions — no manual text-parsing required.

---

## About the data storage

Instead of a database, `server/utils/jsonStore.js` implements a small file-based data layer: each "collection" (users, documents, flashcards, quizzes, tasks, etc.) is a single JSON file under `server/data/`. It supports the same basic operations a database would — insert, find, update, delete — just backed by `fs.readFileSync` / `fs.writeFileSync` instead of a database engine.

This is intentionally simple and great for a portfolio project or local personal use. Worth knowing:
- It's not built for concurrent multi-user production traffic (each write rewrites the whole file) — fine for one person using the app locally.
- **Back up your data** by copying the `server/data/` folder — that's your entire database.
- Want a real database later? The `jsonStore.js` functions (`insert`, `findMany`, `updateById`, `deleteById`, etc.) map closely to what you'd write with Mongoose, so migrating is a matter of swapping that one file, not rewriting every route.

---

## Troubleshooting

| Problem | Likely fix |
|---|---|
| `.env` not found / `JWT_SECRET` missing | Your `.env` file doesn't exist or is named `.env.txt` — see the Notepad note above. |
| AI features return an error | The app now runs offline by default. If you ever want to connect a real model, update server/services/gemini.js. |
| Frontend can't reach the backend | Confirm the backend is running on port 5000 and `CLIENT_ORIGIN` in `server/.env` matches your frontend URL. |
| `EADDRINUSE` / port already in use | See the `netstat` / `taskkill` steps above (Windows) or `lsof -i :5000` + `kill -9 <pid>` (Mac/Linux). |
| I want to reset all my data | Stop the server, delete everything inside `server/data/` except keep the folder itself, and restart — fresh empty files will be recreated. |

---

## Ideas for extending this project

- Swap in a real database (Postgres, MongoDB) once you outgrow local JSON files — see the note above on `jsonStore.js`
- Add a "study group" mode where multiple users share a document and quiz bank
- Voice input for the chat tutor
- Export flashcard decks to Anki's `.apkg` format
- Add OAuth (Google sign-in) alongside email/password
- Deploy: frontend to Vercel, backend to Render/Railway (mount a persistent disk for `server/data/`), and swap `VITE_API_URL` / `CLIENT_ORIGIN` to the deployed URLs

---

Built as a portfolio project. Feel free to fork, extend, and make it your own.
=======

>>>>>>> 172d16933c9b8f60f250b878a3c16ba7a8e031d1
