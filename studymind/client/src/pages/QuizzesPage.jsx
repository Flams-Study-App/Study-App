import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import api from "../api/axios.js";
import { useToast } from "../context/ToastContext.jsx";

function QuizListView() {
  const navigate = useNavigate();
  const toast = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [documentId, setDocumentId] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get("/quizzes").then((res) => setQuizzes(res.data.quizzes));
    api.get("/documents").then((res) => setDocuments(res.data.documents.filter((d) => d.status === "ready")));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await api.post("/quizzes/generate", { topic, difficulty, numQuestions: Number(numQuestions), documentId: documentId || undefined });
      navigate(`/quizzes/${res.data.quiz._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Quiz generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Quizzes</h1>
          <p className="text-ink-500 text-sm mt-1">AI-generated multiple choice quizzes with instant grading.</p>
        </div>
        <button onClick={() => setShowCreate((s) => !s)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New quiz
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleGenerate} className="glass-panel p-4 mb-6 space-y-3 animate-in">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic, e.g. 'Operating System Deadlocks'" className="input-field" />
          <div className="grid grid-cols-3 gap-3">
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-field">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input type="number" min={3} max={15} value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="input-field" />
            <select value={documentId} onChange={(e) => setDocumentId(e.target.value)} className="input-field">
              <option value="">No document (general topic)</option>
              {documents.map((d) => <option key={d._id} value={d._id}>{d.originalName}</option>)}
            </select>
          </div>
          <button type="submit" disabled={generating} className="btn-primary w-full">{generating ? "Generating quiz..." : "Generate quiz"}</button>
        </form>
      )}

      <div className="space-y-3">
        {quizzes.length === 0 && <p className="text-sm text-ink-500 text-center py-10">No quizzes yet — generate one above.</p>}
        {quizzes.map((q) => (
          <div key={q._id} onClick={() => navigate(`/quizzes/${q._id}`)} className="glass-panel p-4 cursor-pointer hover:shadow-glow transition-shadow flex items-center justify-between animate-in">
            <div>
              <p className="font-medium">{q.topic}</p>
              <p className="text-xs text-ink-500 mt-0.5 capitalize">{q.difficulty} · {q.questions?.length || 0} questions</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizTakeView({ quizId }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get(`/quizzes/${quizId}`).then((res) => {
      setQuiz(res.data.quiz);
      setAnswers(new Array(res.data.quiz.questions.length).fill(null));
    });
  }, [quizId]);

  const handleSelect = (qIndex, oIndex) => {
    if (result) return;
    const updated = [...answers];
    updated[qIndex] = oIndex;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    const res = await api.post(`/quizzes/${quizId}/submit`, { answers });
    setResult(res.data);
    const pct = Math.round((res.data.score / res.data.total) * 100);
    if (pct >= 80) toast.success(`Great work — ${res.data.score}/${res.data.total} (${pct}%)`);
    else if (pct >= 50) toast.info(`Scored ${res.data.score}/${res.data.total} (${pct}%). Review the explanations below.`);
    else toast.error(`Scored ${res.data.score}/${res.data.total} (${pct}%). Worth reviewing this topic again.`);
  };

  if (!quiz) return null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate("/quizzes")} className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-100 mb-6">
        <ArrowLeft size={15} /> Back to quizzes
      </button>

      <h1 className="font-display font-bold text-xl mb-1">{quiz.topic}</h1>
      <p className="text-ink-500 text-sm mb-6 capitalize">{quiz.difficulty} difficulty</p>

      {result && (
        <div className="glass-panel p-5 mb-6 text-center">
          <p className="text-2xl font-display font-bold">{result.score} / {result.total}</p>
          <p className="text-ink-500 text-sm mt-1">{Math.round((result.score / result.total) * 100)}% correct</p>
        </div>
      )}

      <div className="space-y-5">
        {quiz.questions.map((q, qi) => {
          const res = result?.results?.[qi];
          return (
            <div key={qi} className="glass-panel p-5 animate-in">
              <p className="font-medium mb-3">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi;
                  let stateClasses = selected ? "border-violet/50 bg-violet/[0.1]" : "border-white/[0.08] hover:bg-white/[0.05]";
                  if (result) {
                    if (oi === res.correctIndex) stateClasses = "border-emerald-500/50 bg-emerald-500/[0.1]";
                    else if (selected && !res.correct) stateClasses = "border-red-500/50 bg-red-500/[0.1]";
                  }
                  return (
                    <div key={oi} onClick={() => handleSelect(qi, oi)} className={`px-4 py-2.5 rounded-xl border cursor-pointer text-sm flex items-center justify-between transition-colors ${stateClasses}`}>
                      {opt}
                      {result && oi === res.correctIndex && <CheckCircle2 size={15} className="text-emerald-400" />}
                      {result && selected && !res.correct && oi !== res.correctIndex && <XCircle size={15} className="text-red-400" />}
                    </div>
                  );
                })}
              </div>
              {result && <p className="text-xs text-ink-500 mt-3">{res.explanation}</p>}
            </div>
          );
        })}
      </div>

      {!result && (
        <button onClick={handleSubmit} disabled={answers.includes(null)} className="btn-primary w-full mt-6">Submit answers</button>
      )}
    </div>
  );
}

export default function QuizzesPage() {
  const { quizId } = useParams();
  return quizId ? <QuizTakeView quizId={quizId} /> : <QuizListView />;
}
