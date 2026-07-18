import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Sparkles, Trash2, ArrowLeft, RotateCcw } from "lucide-react";
import api from "../api/axios.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

function DeckListView() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [decks, setDecks] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");

  const loadDecks = () => api.get("/flashcards/decks").then((res) => setDecks(res.data.decks));
  useEffect(() => { loadDecks(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post("/flashcards/decks", { title, subject: subject || "General" });
    setTitle(""); setSubject(""); setShowCreate(false);
    loadDecks();
    toast.success("Deck created");
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    const ok = await confirm("Delete this deck?", `"${name}" and all of its flashcards will be permanently removed.`);
    if (!ok) return;
    await api.delete(`/flashcards/decks/${id}`);
    loadDecks();
    toast.success("Deck deleted");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Flashcards</h1>
          <p className="text-ink-500 text-sm mt-1">Spaced repetition decks that adapt to how well you know each card.</p>
        </div>
        <button onClick={() => setShowCreate((s) => !s)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New deck
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="glass-panel p-4 mb-6 flex gap-3 animate-in">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deck title (e.g. Data Structures)" className="input-field flex-1" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" className="input-field flex-1" />
          <button type="submit" className="btn-primary shrink-0">Create</button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {decks.length === 0 && <p className="text-sm text-ink-500 col-span-2 text-center py-10">No decks yet — create one to start generating flashcards.</p>}
        {decks.map((deck) => (
          <div key={deck._id} onClick={() => navigate(`/flashcards/${deck._id}`)} className="glass-panel p-5 cursor-pointer hover:shadow-glow transition-shadow group animate-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{deck.title}</p>
                <p className="text-xs text-ink-500 mt-0.5">{deck.subject}</p>
              </div>
              <button onClick={(e) => handleDelete(deck._id, deck.title, e)} className="opacity-0 group-hover:opacity-100 text-ink-500 hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
            <div className="flex gap-4 mt-4 text-xs">
              <span className="text-ink-300">{deck.total} cards</span>
              <span className={deck.due > 0 ? "text-amber font-medium" : "text-ink-500"}>{deck.due} due</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeckStudyView({ deckId }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [topic, setTopic] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState("study"); // study | manage
  const [allCards, setAllCards] = useState([]);

  const loadDue = () => api.get(`/flashcards/decks/${deckId}/due`).then((res) => { setCards(res.data.cards); setIndex(0); setFlipped(false); });
  const loadAll = () => api.get(`/flashcards/decks/${deckId}/cards`).then((res) => setAllCards(res.data.cards));

  useEffect(() => {
    loadDue(); loadAll();
    api.get("/documents").then((res) => setDocuments(res.data.documents.filter((d) => d.status === "ready")));
  }, [deckId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await api.post(`/flashcards/decks/${deckId}/generate`, { topic, count: 8, documentId: documentId || undefined });
      setTopic("");
      loadDue(); loadAll();
      toast.success(`Generated ${res.data.cards.length} flashcards on "${topic}"`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (quality) => {
    const card = cards[index];
    await api.post(`/flashcards/cards/${card._id}/review`, { quality });
    setFlipped(false);
    if (index + 1 < cards.length) setIndex(index + 1);
    else { setCards([]); loadAll(); }
  };

  const current = cards[index];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate("/flashcards")} className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-100 mb-6">
        <ArrowLeft size={15} /> Back to decks
      </button>

      <form onSubmit={handleGenerate} className="glass-panel p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <Sparkles size={18} className="text-violet-soft shrink-0 mt-2 hidden sm:block" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Generate cards on a topic, e.g. 'TCP vs UDP'" className="input-field flex-1" />
        <select value={documentId} onChange={(e) => setDocumentId(e.target.value)} className="input-field sm:w-56">
          <option value="">No document (general topic)</option>
          {documents.map((d) => <option key={d._id} value={d._id}>{d.originalName}</option>)}
        </select>
        <button type="submit" disabled={generating} className="btn-primary shrink-0">{generating ? "Generating..." : "Generate"}</button>
      </form>

      {!current && (
        <div className="glass-panel p-10 text-center">
          <p className="text-ink-300 mb-2">Nothing due for review right now 🎉</p>
          <p className="text-ink-500 text-sm">{allCards.length} total cards in this deck. Generate more, or come back later.</p>
        </div>
      )}

      {current && (
        <div>
          <p className="text-xs text-ink-500 mb-3">Card {index + 1} of {cards.length}</p>
          <div
            onClick={() => setFlipped((f) => !f)}
            className="glass-panel p-10 min-h-[220px] flex items-center justify-center text-center cursor-pointer select-none animate-in"
          >
            <p className="text-lg">{flipped ? current.back : current.front}</p>
          </div>
          <p className="text-xs text-ink-500 text-center mt-2 flex items-center justify-center gap-1"><RotateCcw size={12} /> Click card to flip</p>

          {flipped && (
            <div className="grid grid-cols-4 gap-2 mt-5 animate-in">
              <button onClick={() => handleReview(1)} className="btn-ghost !bg-red-500/10 !border-red-500/20 text-red-300">Again</button>
              <button onClick={() => handleReview(3)} className="btn-ghost !bg-amber/10 !border-amber/20 text-amber">Hard</button>
              <button onClick={() => handleReview(4)} className="btn-ghost !bg-cyan/10 !border-cyan/20 text-cyan">Good</button>
              <button onClick={() => handleReview(5)} className="btn-ghost !bg-emerald-500/10 !border-emerald-500/20 text-emerald-300">Easy</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FlashcardsPage() {
  const { deckId } = useParams();
  return deckId ? <DeckStudyView deckId={deckId} /> : <DeckListView />;
}
